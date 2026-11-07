package de.wpvs.localai_test.inference.embedding;

import java.text.Normalizer;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

/**
 * WordPiece tokenizer for BERT-style embedding models. Since ORT GenAI does not
 * support WordPiece tokenizers, this reproduces the Transformers.js implementation
 * ({@code @huggingface/tokenizers}) so embeddings computed natively and in the browser
 * match.
 *
 * <p>Supported components are {@code BertNormalizer}, {@code BertPreTokenizer}, the
 * {@code WordPiece} model, and the {@code TemplateProcessing}, {@code BertProcessing},
 * and {@code RobertaProcessing} post-processors, each also without a normalizer,
 * pre-tokenizer, or post-processor.</p>
 */
final class WordPieceTokenizer implements EmbeddingPipeline.TextTokenizer {
    /**
     * Special token from {@code added_tokens}.
     */
    private static final class AddedToken {
        final String content;
        final boolean lstrip;
        final boolean rstrip;

        AddedToken(String content, boolean lstrip, boolean rstrip) {
            this.content = content;
            this.lstrip  = lstrip;
            this.rstrip  = rstrip;
        }
    }

    /**
     * Node in the prefix tree used to split out special tokens.
     */
    private static final class TrieNode {
        final Map<Character, TrieNode> children = new HashMap<>();
        String end;
    }

    /**
     * Element of the post-processing template: either fixed token IDs or the input sequence.
     */
    private static final class TemplatePiece {
        final long[] ids;
        final long typeId;

        TemplatePiece(long[] ids, long typeId) {
            this.ids    = ids;
            this.typeId = typeId;
        }
    }

    private final Map<String, Integer> vocab = new HashMap<>();
    private final Map<String, AddedToken> addedTokens = new HashMap<>();
    private final TrieNode unnormalizedSplitter = new TrieNode();
    private final TrieNode normalizedSplitter = new TrieNode();
    private final List<TemplatePiece> template = new ArrayList<>();

    private final String unkToken;
    private final String subwordPrefix;
    private final int maxInputCharsPerWord;
    private final int modelMaxLength;

    private final boolean hasNormalizer;
    private final boolean cleanText;
    private final boolean handleChineseChars;
    private final boolean lowercase;
    private final Boolean stripAccents;
    private final boolean hasPreTokenizer;

    /**
     * Check whether a tokenizer is supported by this class.
     *
     * @param tokenizerJson Contents of {@code tokenizer.json}
     * @return {@code true} if all components are supported
     */
    static boolean supports(JSONObject tokenizerJson) {
        JSONObject model = tokenizerJson.optJSONObject("model");
        if (model == null || !"WordPiece".equals(model.optString("type"))) return false;

        JSONObject normalizer = tokenizerJson.optJSONObject("normalizer");
        if (normalizer != null && !"BertNormalizer".equals(normalizer.optString("type"))) return false;

        JSONObject preTokenizer = tokenizerJson.optJSONObject("pre_tokenizer");
        if (preTokenizer != null && !"BertPreTokenizer".equals(preTokenizer.optString("type"))) return false;

        JSONObject postProcessor = tokenizerJson.optJSONObject("post_processor");
        if (postProcessor == null) return true;

        switch (postProcessor.optString("type")) {
            case "TemplateProcessing":
            case "BertProcessing":
            case "RobertaProcessing":
                return true;
            default:
                return false;
        }
    }

    /**
     * @param tokenizerJson   Contents of {@code tokenizer.json}
     * @param tokenizerConfig Contents of {@code tokenizer_config.json} (for {@code model_max_length})
     * @throws JSONException if the configuration is incomplete
     * @throws IllegalArgumentException for unsupported components
     */
    WordPieceTokenizer(JSONObject tokenizerJson, JSONObject tokenizerConfig) throws JSONException {
        if (!supports(tokenizerJson)) {
            throw new IllegalArgumentException("Tokenizer wird nicht unterstützt (nur BERT/WordPiece).");
        }

        // WordPiece model.
        JSONObject model = tokenizerJson.getJSONObject("model");
        JSONObject modelVocab = model.getJSONObject("vocab");

        for (Iterator<String> keys = modelVocab.keys(); keys.hasNext(); ) {
            String token = keys.next();
            vocab.put(token, modelVocab.getInt(token));
        }

        unkToken             = model.getString("unk_token");
        subwordPrefix        = model.optString("continuing_subword_prefix", "##");
        maxInputCharsPerWord = model.optInt("max_input_chars_per_word", 100);

        // Normalizer.
        JSONObject normalizer = tokenizerJson.optJSONObject("normalizer");
        hasNormalizer      = normalizer != null;
        cleanText          = hasNormalizer && normalizer.optBoolean("clean_text", false);
        handleChineseChars = hasNormalizer && normalizer.optBoolean("handle_chinese_chars", false);
        lowercase          = hasNormalizer && normalizer.optBoolean("lowercase", false);
        stripAccents       = hasNormalizer && normalizer.opt("strip_accents") instanceof Boolean
                           ? (Boolean) normalizer.opt("strip_accents") : null;

        hasPreTokenizer = tokenizerJson.optJSONObject("pre_tokenizer") != null;

        // Special tokens, separated into normalized and unnormalized forms.
        JSONArray added = tokenizerJson.optJSONArray("added_tokens");

        for (int i = 0; added != null && i < added.length(); i++) {
            JSONObject entry = added.getJSONObject(i);
            String content = entry.getString("content");
            AddedToken token = new AddedToken(content, entry.optBoolean("lstrip"), entry.optBoolean("rstrip"));

            vocab.put(content, entry.getInt("id"));
            addedTokens.put(content, token);

            if (entry.optBoolean("normalized") && hasNormalizer) {
                String normalizedContent = normalize(content);
                addedTokens.put(normalizedContent, token);
                addToTrie(normalizedSplitter, normalizedContent);
            } else {
                addToTrie(unnormalizedSplitter, content);
            }
        }

        // Post-processing (special tokens at the beginning and end).
        parseTemplate(tokenizerJson.optJSONObject("post_processor"));

        // Truncate based on model_max_length only, as in Transformers.js.
        double maxLength = tokenizerConfig.optDouble("model_max_length", Double.NaN);
        modelMaxLength   = Double.isNaN(maxLength) || maxLength >= Integer.MAX_VALUE ? Integer.MAX_VALUE : (int) maxLength;
    }

    /**
     * Convert text to token IDs, including special tokens.
     *
     * @param text Input text
     * @return Token IDs and token type IDs, truncated to {@code model_max_length}
     */
    @Override
    public EmbeddingPipeline.Encoding encode(String text) {
        List<String> tokens = tokenize(text);
        List<Long> ids   = new ArrayList<>();
        List<Long> types = new ArrayList<>();

        if (template.isEmpty()) {
            for (String token : tokens) {
                ids.add(tokenToId(token));
                types.add(0L);
            }
        } else {
            for (TemplatePiece piece : template) {
                if (piece.ids == null) {
                    for (String token : tokens) {
                        ids.add(tokenToId(token));
                        types.add(piece.typeId);
                    }
                } else {
                    for (long id : piece.ids) {
                        ids.add(id);
                        types.add(piece.typeId);
                    }
                }
            }
        }

        int length = Math.min(ids.size(), modelMaxLength);
        long[] inputIds     = new long[length];
        long[] tokenTypeIds = new long[length];

        for (int i = 0; i < length; i++) {
            inputIds[i]     = ids.get(i);
            tokenTypeIds[i] = types.get(i);
        }

        return new EmbeddingPipeline.Encoding(inputIds, tokenTypeIds);
    }

    /**
     * Split text into tokens without special tokens at the beginning or end
     * ({@code encode_text} in Transformers.js).
     *
     * @param text Input text
     * @return Tokens
     */
    List<String> tokenize(String text) {
        List<String> result = new ArrayList<>();
        List<String> sections = split(unnormalizedSplitter, text);
        stripAroundAddedTokens(sections);

        for (String section : sections) {
            if (section.isEmpty()) continue;

            if (addedTokens.containsKey(section)) {
                result.add(section);
                continue;
            }

            String normalized = hasNormalizer ? normalize(section) : section;
            if (normalized.isEmpty()) continue;

            List<String> subsections = split(normalizedSplitter, normalized);
            stripAroundAddedTokens(subsections);

            for (String subsection : subsections) {
                if (subsection.isEmpty()) continue;

                if (addedTokens.containsKey(subsection)) {
                    result.add(subsection);
                    continue;
                }

                List<String> words = hasPreTokenizer ? preTokenize(subsection) : List.of(subsection);
                result.addAll(wordPiece(words));
            }
        }

        return result;
    }

    /**
     * {@code BertNormalizer.normalize} from Transformers.js.
     */
    String normalize(String text) {
        if (cleanText) text = cleanText(text);
        if (handleChineseChars) text = tokenizeChineseChars(text);

        if (lowercase) {
            text = text.toLowerCase(Locale.ROOT);
            if (!Boolean.FALSE.equals(stripAccents)) text = stripAccents(text);
        } else if (Boolean.TRUE.equals(stripAccents)) {
            text = stripAccents(text);
        }

        return text;
    }

    /**
     * Remove control characters and replace whitespace with spaces.
     */
    private static String cleanText(String text) {
        StringBuilder output = new StringBuilder(text.length());

        for (int i = 0; i < text.length(); ) {
            int cp = text.codePointAt(i);
            i += Character.charCount(cp);

            if (cp == 0 || cp == 0xFFFD || isControl(cp)) continue;

            if (isJsWhitespace(cp)) {
                output.append(' ');
            } else {
                output.appendCodePoint(cp);
            }
        }

        return output.toString();
    }

    /**
     * Surround CJK characters with spaces. As in Transformers.js, UTF-16 code units
     * are checked, so only basic multilingual plane (BMP) characters are recognized.
     */
    private static String tokenizeChineseChars(String text) {
        StringBuilder output = new StringBuilder(text.length());

        for (int i = 0; i < text.length(); i++) {
            char c = text.charAt(i);

            if ((c >= 19968 && c <= 40959) || (c >= 13312 && c <= 19903) || (c >= 63744 && c <= 64255)) {
                output.append(' ').append(c).append(' ');
            } else {
                output.append(c);
            }
        }

        return output.toString();
    }

    /**
     * Remove accents by applying NFD decomposition and removing non-spacing marks ({@code \p{Mn}}).
     */
    private static String stripAccents(String text) {
        String decomposed = Normalizer.normalize(text, Normalizer.Form.NFD);
        StringBuilder output = new StringBuilder(decomposed.length());

        for (int i = 0; i < decomposed.length(); ) {
            int cp = decomposed.codePointAt(i);
            i += Character.charCount(cp);

            if (Character.getType(cp) != Character.NON_SPACING_MARK) {
                output.appendCodePoint(cp);
            }
        }

        return output.toString();
    }

    /**
     * {@code BertPreTokenizer}: words consisting of non-whitespace, non-punctuation characters,
     * along with individual punctuation marks, matching the regular expression {@code [^\s P]+|[P]}.
     */
    private static List<String> preTokenize(String text) {
        List<String> words = new ArrayList<>();
        text = jsTrim(text);

        int wordStart = -1;

        for (int i = 0; i < text.length(); ) {
            int cp = text.codePointAt(i);
            int next = i + Character.charCount(cp);

            if (isJsWhitespace(cp) || isPunctuation(cp)) {
                if (wordStart >= 0) {
                    words.add(text.substring(wordStart, i));
                    wordStart = -1;
                }

                if (isPunctuation(cp)) words.add(text.substring(i, next));
            } else if (wordStart < 0) {
                wordStart = i;
            }

            i = next;
        }

        if (wordStart >= 0) words.add(text.substring(wordStart));
        return words;
    }

    /**
     * Greedily split words into the longest known subwords.
     */
    private List<String> wordPiece(List<String> words) {
        List<String> output = new ArrayList<>();

        for (String word : words) {
            int[] chars = word.codePoints().toArray();

            if (chars.length > maxInputCharsPerWord) {
                output.add(unkToken);
                continue;
            }

            List<String> subTokens = new ArrayList<>();
            boolean unknown = false;
            int start = 0;

            while (start < chars.length) {
                int end = chars.length;
                String current = null;

                while (start < end) {
                    String substr = new String(chars, start, end - start);
                    if (start > 0) substr = subwordPrefix + substr;

                    if (vocab.containsKey(substr)) {
                        current = substr;
                        break;
                    }

                    end--;
                }

                if (current == null) {
                    unknown = true;
                    break;
                }

                subTokens.add(current);
                start = end;
            }

            if (unknown) {
                output.add(unkToken);
            } else {
                output.addAll(subTokens);
            }
        }

        return output;
    }

    private long tokenToId(String token) {
        Integer id = vocab.get(token);
        if (id == null) id = vocab.get(unkToken);
        if (id == null) throw new IllegalStateException("Unbekanntes Token ohne [UNK]-Token: " + token);
        return id;
    }

    /**
     * Read the template for special tokens at the beginning and end from the post-processor.
     */
    private void parseTemplate(JSONObject postProcessor) throws JSONException {
        if (postProcessor == null) return;

        String type = postProcessor.getString("type");

        if (type.equals("TemplateProcessing")) {
            JSONArray single = postProcessor.getJSONArray("single");
            JSONObject specialTokens = postProcessor.optJSONObject("special_tokens");

            for (int i = 0; i < single.length(); i++) {
                JSONObject item = single.getJSONObject(i);

                if (item.has("SpecialToken")) {
                    JSONObject special = item.getJSONObject("SpecialToken");
                    String id = special.getString("id");
                    JSONObject definition = specialTokens == null ? null : specialTokens.optJSONObject(id);
                    long[] ids;

                    if (definition != null) {
                        JSONArray idArray = definition.getJSONArray("ids");
                        ids = new long[idArray.length()];
                        for (int j = 0; j < ids.length; j++) ids[j] = idArray.getLong(j);
                    } else {
                        ids = new long[] { tokenToId(id) };
                    }

                    template.add(new TemplatePiece(ids, special.optLong("type_id", 0)));
                } else {
                    JSONObject sequence = item.getJSONObject("Sequence");
                    template.add(new TemplatePiece(null, sequence.optLong("type_id", 0)));
                }
            }
        } else {
            // BertProcessing / RobertaProcessing: {"cls": ["[CLS]", 101], "sep": ["[SEP]", 102]}
            template.add(new TemplatePiece(new long[] { postProcessor.getJSONArray("cls").getLong(1) }, 0));
            template.add(new TemplatePiece(null, 0));
            template.add(new TemplatePiece(new long[] { postProcessor.getJSONArray("sep").getLong(1) }, 0));
        }
    }

    /**
     * Remove whitespace next to special tokens with {@code lstrip}/{@code rstrip}.
     */
    private void stripAroundAddedTokens(List<String> sections) {
        for (int i = 0; i < sections.size(); i++) {
            AddedToken token = addedTokens.get(sections.get(i));
            if (token == null) continue;

            if (token.lstrip && i > 0) {
                sections.set(i - 1, jsTrimEnd(sections.get(i - 1)));
            }

            if (token.rstrip && i < sections.size() - 1) {
                sections.set(i + 1, jsTrimStart(sections.get(i + 1)));
            }
        }
    }

    private static void addToTrie(TrieNode root, String word) {
        TrieNode node = root;

        for (int i = 0; i < word.length(); i++) {
            node = node.children.computeIfAbsent(word.charAt(i), key -> new TrieNode());
        }

        node.end = word;
    }

    /**
     * Split text at the longest matches in the prefix tree ({@code DictionarySplitter}).
     */
    private static List<String> split(TrieNode root, String text) {
        List<String> result = new ArrayList<>();

        if (root.children.isEmpty()) {
            result.add(text);
            return result;
        }

        int n = text.length();
        int start = 0;
        int i = 0;

        while (i < n) {
            TrieNode node = root;
            String match = null;

            for (int j = i; j < n; j++) {
                node = node.children.get(text.charAt(j));
                if (node == null) break;
                if (node.end != null) match = node.end;
            }

            if (match != null) {
                if (i > start) result.add(text.substring(start, i));
                result.add(match);
                i += match.length();
                start = i;
            } else {
                i++;
            }
        }

        if (start < n) result.add(text.substring(start));
        return result;
    }

    /**
     * Control characters in Unicode categories Cc, Cf, Co, or Cs, excluding tabs and line breaks.
     */
    private static boolean isControl(int cp) {
        if (cp == '\t' || cp == '\n' || cp == '\r') return false;

        switch (Character.getType(cp)) {
            case Character.CONTROL:
            case Character.FORMAT:
            case Character.PRIVATE_USE:
            case Character.SURROGATE:
                return true;
            default:
                return false;
        }
    }

    /**
     * Punctuation in Unicode category P, along with all ASCII special characters.
     */
    private static boolean isPunctuation(int cp) {
        if ((cp >= 0x21 && cp <= 0x2F) || (cp >= 0x3A && cp <= 0x40) || (cp >= 0x5B && cp <= 0x60) || (cp >= 0x7B && cp <= 0x7E)) {
            return true;
        }

        switch (Character.getType(cp)) {
            case Character.CONNECTOR_PUNCTUATION:
            case Character.DASH_PUNCTUATION:
            case Character.START_PUNCTUATION:
            case Character.END_PUNCTUATION:
            case Character.INITIAL_QUOTE_PUNCTUATION:
            case Character.FINAL_QUOTE_PUNCTUATION:
            case Character.OTHER_PUNCTUATION:
                return true;
            default:
                return false;
        }
    }

    /**
     * Whitespace as defined by {@code \s} in JavaScript, which differs from
     * {@link Character#isWhitespace(int)}.
     */
    static boolean isJsWhitespace(int cp) {
        switch (cp) {
            case '\t': case '\n': case 0x0B: case '\f': case '\r': case ' ':
            case 0x00A0: case 0x1680: case 0x2028: case 0x2029: case 0x202F:
            case 0x205F: case 0x3000: case 0xFEFF:
                return true;
            default:
                return cp >= 0x2000 && cp <= 0x200A;
        }
    }

    private static String jsTrim(String text) {
        return jsTrimEnd(jsTrimStart(text));
    }

    private static String jsTrimStart(String text) {
        int start = 0;
        while (start < text.length() && isJsWhitespace(text.charAt(start))) start++;
        return text.substring(start);
    }

    private static String jsTrimEnd(String text) {
        int end = text.length();
        while (end > 0 && isJsWhitespace(text.charAt(end - 1))) end--;
        return text.substring(0, end);
    }
}

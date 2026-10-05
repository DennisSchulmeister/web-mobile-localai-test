package de.wpvs.localai_test.inference.embedding;

import static org.junit.Assert.assertArrayEquals;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;
import static org.junit.Assume.assumeTrue;

import java.io.File;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import org.json.JSONArray;
import org.json.JSONObject;
import org.junit.BeforeClass;
import org.junit.Test;

/**
 * Vergleicht den WordPiece-Tokenizer mit Token-IDs, die mit Transformers.js für das
 * Modell {@code sentence-transformers/all-MiniLM-L6-v2} erzeugt wurden.
 */
public class WordPieceTokenizerTest {
    private static final String MODEL_PATH = "_generated/models/sentence-transformers/all-MiniLM-L6-v2/";

    private static final String[] MODEL_DIRS = {
        "src/main/assets/public/" + MODEL_PATH,
        "app/src/main/assets/public/" + MODEL_PATH,
        "../static/" + MODEL_PATH,
        "../../static/" + MODEL_PATH,
    };

    private static WordPieceTokenizer tokenizer;

    @BeforeClass
    public static void loadTokenizer() throws Exception {
        File modelDir = null;

        for (String path : MODEL_DIRS) {
            File candidate = new File(path);
            if (new File(candidate, "tokenizer.json").isFile()) {
                modelDir = candidate;
                break;
            }
        }

        assumeTrue("MiniLM-Modell nicht gefunden, bitte zuerst die Modelle herunterladen.", modelDir != null);

        JSONObject tokenizerJson   = new JSONObject(read(new File(modelDir, "tokenizer.json")));
        JSONObject tokenizerConfig = new JSONObject(read(new File(modelDir, "tokenizer_config.json")));

        assertTrue(WordPieceTokenizer.supports(tokenizerJson));
        tokenizer = new WordPieceTokenizer(tokenizerJson, tokenizerConfig);
    }

    @Test
    public void matchesTransformersJs() throws Exception {
        JSONArray cases;

        try (InputStream input = getClass().getClassLoader().getResourceAsStream("wordpiece-reference.json")) {
            cases = new JSONArray(new String(input.readAllBytes(), StandardCharsets.UTF_8));
        }

        assertTrue(cases.length() > 0);

        for (int i = 0; i < cases.length(); i++) {
            JSONObject testCase = cases.getJSONObject(i);
            String text = testCase.getString("text");
            JSONArray expectedIds = testCase.getJSONArray("ids");

            long[] expected = new long[expectedIds.length()];
            for (int j = 0; j < expected.length; j++) expected[j] = expectedIds.getLong(j);

            EmbeddingPipeline.Encoding encoding = tokenizer.encode(text);
            assertArrayEquals("Token-IDs für: " + text, expected, encoding.inputIds);
            assertEquals(expected.length, encoding.tokenTypeIds.length);
        }
    }

    @Test
    public void truncatesToModelMaxLength() {
        EmbeddingPipeline.Encoding encoding = tokenizer.encode("Wort ".repeat(700));
        assertEquals(512, encoding.inputIds.length);
        assertEquals(101, encoding.inputIds[0]);
    }

    @Test
    public void rejectsOtherTokenizers() throws Exception {
        JSONObject bpe = new JSONObject().put("model", new JSONObject().put("type", "BPE"));
        assertFalse(WordPieceTokenizer.supports(bpe));

        JSONObject otherNormalizer = new JSONObject()
            .put("model", new JSONObject().put("type", "WordPiece"))
            .put("normalizer", new JSONObject().put("type", "NFC"));
        assertFalse(WordPieceTokenizer.supports(otherNormalizer));
    }

    @Test
    public void tokenizesWithMinimalVocabulary() throws Exception {
        JSONObject vocab = new JSONObject()
            .put("[UNK]", 0).put("[CLS]", 1).put("[SEP]", 2)
            .put("hallo", 3).put("welt", 4).put("!", 5).put("un", 6).put("##ter", 7);

        JSONObject tokenizerJson = new JSONObject()
            .put("normalizer", new JSONObject().put("type", "BertNormalizer").put("clean_text", true)
                .put("handle_chinese_chars", true).put("lowercase", true).put("strip_accents", JSONObject.NULL))
            .put("pre_tokenizer", new JSONObject().put("type", "BertPreTokenizer"))
            .put("post_processor", new JSONObject().put("type", "BertProcessing")
                .put("cls", new JSONArray().put("[CLS]").put(1))
                .put("sep", new JSONArray().put("[SEP]").put(2)))
            .put("model", new JSONObject().put("type", "WordPiece").put("unk_token", "[UNK]").put("vocab", vocab));

        WordPieceTokenizer minimal = new WordPieceTokenizer(tokenizerJson, new JSONObject());
        EmbeddingPipeline.Encoding encoding = minimal.encode("Hallo WELT! unter xyz");

        assertArrayEquals(new long[] { 1, 3, 4, 5, 6, 7, 0, 2 }, encoding.inputIds);
    }

    private static String read(File file) throws Exception {
        return new String(Files.readAllBytes(file.toPath()), StandardCharsets.UTF_8);
    }
}

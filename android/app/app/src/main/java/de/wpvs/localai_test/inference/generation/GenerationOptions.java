package de.wpvs.localai_test.inference.generation;

import org.json.JSONObject;

/**
 * Generation parameters for ORT GenAI, resolved as in Transformers.js: values from the call
 * take precedence over the model's {@code generation_config.json}, followed by the defaults
 * from Hugging Face Transformers. Length values from {@code generation_config.json} are
 * ignored, as they are in the web version.
 */
final class GenerationOptions {
    final int maxLength;
    final boolean doSample;
    final double temperature;
    final int topK;
    final double topP;
    final double repetitionPenalty;

    private GenerationOptions(int maxLength, boolean doSample, double temperature, int topK, double topP, double repetitionPenalty) {
        this.maxLength         = maxLength;
        this.doSample          = doSample;
        this.temperature       = temperature;
        this.topK              = topK;
        this.topP              = topP;
        this.repetitionPenalty = repetitionPenalty;
    }

    /**
     * Resolve the search parameters.
     *
     * @param generationConfig  Contents of {@code generation_config.json} (may be empty)
     * @param promptLength      Prompt length in tokens
     * @param contextLength     Maximum model context length
     * @param maxNewTokens      Maximum number of new tokens or {@code null}
     * @param maxLength         Maximum total length or {@code null}
     * @param doSample          Sampling instead of greedy search, or {@code null}
     * @param temperature       Temperature or {@code null}
     * @param repetitionPenalty Repetition penalty or {@code null}
     * @return Suchparameter
     * @throws IllegalArgumentException if the prompt fills the context window
     */
    static GenerationOptions resolve(JSONObject generationConfig, int promptLength, int contextLength,
                                     Integer maxNewTokens, Integer maxLength, Boolean doSample,
                                     Double temperature, Double repetitionPenalty) {
        if (promptLength >= contextLength) {
            throw new IllegalArgumentException("Der Prompt ist mit " + promptLength
                + " Tokens zu lang für das Kontextfenster des Modells (" + contextLength + " Tokens).");
        }

        int length;

        if (maxNewTokens != null && maxNewTokens > 0) {
            length = (int) Math.min((long) promptLength + maxNewTokens, contextLength);
        } else if (maxLength != null && maxLength > 0) {
            length = Math.min(maxLength, contextLength);
        } else {
            length = contextLength;
        }

        length = Math.max(length, promptLength + 1);

        boolean sample = doSample != null ? doSample : generationConfig.optBoolean("do_sample", false);
        double temp    = temperature != null ? temperature : generationConfig.optDouble("temperature", 1.0);
        int k          = generationConfig.optInt("top_k", 50);
        double p       = generationConfig.optDouble("top_p", 1.0);
        double penalty = repetitionPenalty != null ? repetitionPenalty : generationConfig.optDouble("repetition_penalty", 1.0);

        if (Double.isNaN(temp)) temp = 1.0;
        if (Double.isNaN(p)) p = 1.0;
        if (Double.isNaN(penalty) || penalty <= 0) penalty = 1.0;

        if (temp <= 0) {
            sample = false;
            temp   = 1.0;
        }

        return new GenerationOptions(length, sample, temp, k, p, penalty);
    }
}

package de.wpvs.localai_test.inference.generation;

import org.json.JSONObject;

/**
 * Suchparameter für ORT GenAI, ermittelt wie in Transformers.js: Werte aus dem Aufruf haben
 * Vorrang vor der {@code generation_config.json} des Modells, danach gelten die Standardwerte
 * von Hugging Face Transformers. Längenangaben der {@code generation_config.json} werden wie in
 * der Web-Version ignoriert.
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
     * Suchparameter ermitteln.
     *
     * @param generationConfig  Inhalt der {@code generation_config.json} (ggf. leer)
     * @param promptLength      Länge des Prompts in Tokens
     * @param contextLength     Maximale Kontextlänge des Modells
     * @param maxNewTokens      Maximale Anzahl neuer Tokens oder {@code null}
     * @param maxLength         Maximale Gesamtlänge oder {@code null}
     * @param doSample          Sampling statt Greedy Search oder {@code null}
     * @param temperature       Temperatur oder {@code null}
     * @param repetitionPenalty Strafe für Wiederholungen oder {@code null}
     * @return Suchparameter
     * @throws IllegalArgumentException wenn der Prompt das Kontextfenster füllt
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

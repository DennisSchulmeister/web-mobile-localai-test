Web/Mobile-Test für lokale KI
=============================

1. [Beschreibung](#beschreibung)
1. [Technische Umsetzung](#technische-umsetzung)
1. [Weitere Ideen](#weitere-ideen)
1. [Copyright](#copyright)

Beschreibung
------------

Dies ist ein Versuch, ob kleine KI-Sprachmodelle auch im Browser auf Mobilgeräten
mit akzeptabler Performance ausgeführt werden können. Natürlich können auf diese
Weise nur einfache Anwendungsfälle unterstützt werden, aber dafür funktionieren
sie (in einer Progressive Web App) auch 100% offline und lokal, so dass der
Datenschutz gewährt ist.

Zwei Anwendungsfälle sollen hier getestet werden:

1. Text zusammenfassen
2. Lokale Vektorsuche

Eventuell kommt noch das Beantworten von Fragen anhand eines vorgegebenen Textes
(Question Answering) hinzu, da dies technisch ähnlich funktioniert wird das
Zusammenfassen eines Textes. Hierfür müssten wir aber ein Modell finden, das
klein genug ist.

Technische Umsetzung
--------------------

Die Umsetzung ist bewusst so minimal wie möglich gehalten, um nicht vom eigentlichen
Versuch abzulenken. Für die Weboberfläche kommen zum Einsatz:

* **Bundler:** [Esbuild](https://picocss.com/)
* **Styling:** [Pico CSS](https://picocss.com/)
* **UI:** [Svelte](https://svelte.dev/)

Für die KI kommen folgende Bibliotheken und Modelle zum Einsatz:

* **Runtime:** [transformers.js](https://huggingface.co/docs/transformers.js/index) (basiert auf [ONNX}(https://onnxruntime.ai/))
* **Zusammenfassung:**
    * [apbaxel/bigscience-mt0-small-int8-onnx](https://huggingface.co/apbaxel/bigscience-mt0-small-int8-onnx)
    * [Alternativen auf HuggingFace](https://huggingface.co/models?pipeline_tag=summarization&language=de&sort=downloads)
* **Embedding:**
    * [onnx-community/multilingual-e5-base-ONNX](https://huggingface.co/onnx-community/multilingual-e5-base-ONNX)
    * [shannondata/multilingual-e5-small](https://huggingface.co/shannondata/multilingual-e5-small)
    * [Hisham480/multilingual-r2-ONNX](https://huggingface.co/Hisham480/multilingual-r2-ONNX)
    * [Alternativen auf HuggingFace](https://huggingface.co/models?pipeline_tag=sentence-similarity&library=onnx&language=de&sort=downloads)

Weitere Ideen
-------------

Eventuell könnte es sinnvoll sein, ein besseres Modell für Zusammenfassungen zu verwenden.
[deutsche-telekom/mt5-small-sum-de-en-v1](https://huggingface.co/deutsche-telekom/mt5-small-sum-de-en-v1)
würde sich anbieten, müsste aber noch [in das ONXX-Format konvertiert](https://huggingface.co/spaces/onnx-community/convert-to-onnx) werden.

[shannondata/multilingual-e5-small](https://huggingface.co/shannondata/multilingual-e5-small) kann vermutlich
auch für Question Answering verwendet werden.

Copyright
---------

© 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>

[Lizenziert unter CC0 1.0](.LICENCE), https://creativecommons.org/publicdomain/zero/1.0/ 
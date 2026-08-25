Web/Mobile-Test für lokale KI
=============================

1. [Beschreibung](#beschreibung)
1. [Vorbereitungen](#vorbereitungen)
1. [Start der Anwendung](#start-der-anwendung)
1. [Technische Umsetzung](#technische-umsetzung)
1. [Künftige Web APIs](#künftige-web-apis)
1. [Weitere Ideen](#weitere-ideen)
1. [Lessons Learned](#lessons-learned)
1. [Copyright](#copyright)

Beschreibung
------------

Dies ist ein Versuch, ob kleine KI-Sprachmodelle auch im Browser auf Mobilgeräten
mit akzeptabler Performance ausgeführt werden können. Natürlich können auf diese
Weise nur einfache Anwendungsfälle unterstützt werden, aber dafür funktionieren
sie (in einer Progressive Web App) auch 100% offline und lokal, so dass der
Datenschutz gewährt ist.

Folgende Anwendungsfälle sollen hier getestet werden:

1. Text zusammenfassen (Summarization)
1. Text übersetzen (Translation)
1. Fragen beantworten (Question Answertung)
1. Semantische Suche (Sentence Similarity)
1. Text vorlesen (Text to Speach)

Vorbereitungen
--------------

Bevor die Anwendung gestartet werden kann, müssen folgende Schritte ausgeführt werden:

1. **Modelle herunterladen:** Um ein realistisches Deployment-Szenario nachzustellen,
   lädt die Webanwendung die Modelle nicht vom HuggingFace Model Hub. Stattdessen werden
   die Modelle als Teil der Webanwendung gehostet. Hierfür müssen sie auf dem Webserver
   einmalig lokal heruntergeladen werden.

2. **Testdaten aufbereiten:** Hier kommen verschiedene regelbasierte Natural Language
   Processing (NLP) Algorithmen zum Einsatz, um die Testdaten zu filtern und in kleinere
   Teile zu zerlegen. Dies ist wichtig für die Question Answering Modelle, die aus
   mehreren kleinen Textpassagen (z.B. einzelne Sätze) die zur Beantwortung einer Frage
   passenden Passagen heraussuchen. Aber auch für die semantische Suche ist dies relevant,
   um die Worteinbettungen auf einzelne Kontextblöcke anstatt ganzer Dokumente zu berechnen.

3. **Worteinbettungen berechnen:** Die semantische Suche basiert auf der klassischen
   Cosinus-Ähnlichkeit von Worteinbettungen. Während der Suche wird die Worteinbettung
   des Suchbegriffs berechnet und mit den Worteinbettungen der aus den Testdokumenten
   erzeugten Kontextblöcke verglichen. Da sich letztere nur ändern, wenn sich die Testdaten
   ändern, müssne sie vor Ausführung der App einmalig vorberechnet werden.

Alle drei Schritte können mit `npm run init` hintereinander ausgeführt werden.
Alterantiv können die Schritte einzeln ausgeführt werden:

1. `npm run init:download`: Modelle herunterladen
2. `npm run init:preprocess`: Testdaten aufbereiten
3. `npm run init:embeddings`: Worteinbettungen berechnen

Wann immer sich die Testdaten ändern, müssen die Schritte 2 und 3 ausgeführt werden.
Wenn sich die verwendeten Modelle ändern, müssen in die Schritte 1 und 3 ausgeführt werden.

Da die Daten für die clientseitigen Webanwendung nutzbar sein müssen, liegen die Ergebnisse
dieser Schritte im `static`-Verzeichnis, sind aber von der Git-Versionierung ausgeschlossen.

Start der Anwendung 
-------------------

Der Devserver kann mit `npm start` oder `npm run watch` gestartet werden. Die Anwendung
kann dann über http://localhost:8888 im Browser aufgerufen werden.

Für ein statisches Deployment, kann die Anwendung mit `npm run build` gebaut werden.
Die Inhalte des `static`-Verzeichnisses können dann auf einen Webserver geschoben werden.

Technische Umsetzung
--------------------

Die Umsetzung ist bewusst so minimal wie möglich gehalten, um nicht vom eigentlichen
Versuch abzulenken. Für die Weboberfläche kommen zum Einsatz:

* **Bundler:** [Esbuild](https://picocss.com/)
* **UI:** [Svelte](https://svelte.dev/)
* **Styling:** [Pico CSS](https://picocss.com/)
* **Icons:** [Bootstrap Icons](https://icons.getbootstrap.com/)

Für die KI kommen folgende Bibliotheken und Modelle zum Einsatz:

* **Runtime:** [transformers.js](https://huggingface.co/docs/transformers.js/index) (basiert auf [ONNX}(https://onnxruntime.ai/))
* **Zusammenfassung (Summarization):**
    * [onnx-community/text_summarization-ONNX](https://huggingface.co/onnx-community/text_summarization-ONNX)
    * [Alternativen auf HuggingFace](https://huggingface.co/models?pipeline_tag=summarization&library=onnx&language=de&sort=downloads)
* **Übersetzen (Translation):**
    * [huggingworld/m2m100_418M](https://huggingface.co/huggingworld/m2m100_418M)
    * [Alternativen auf HuggingFace](https://huggingface.co/models?pipeline_tag=translation&library=transformers.js&language=de&sort=downloads)
* **Fragen beantworten (Question Answering):**
    * [onnx-community/all-MiniLM-L12-v2-qa-all-ONNX](https://huggingface.co/onnx-community/all-MiniLM-L12-v2-qa-all-ONNX)
    * [dewdev/mdeberta-v3-base-squad2-onnx](https://huggingface.co/dewdev/mdeberta-v3-base-squad2-onnx)
    * [Alternativen auf HuggingFace](https://huggingface.co/models?pipeline_tag=question-answering&library=onxx&language=de&sort=downloads)
* **Semantische Suche (Sentence Similarity):**
    * [onnx-community/multilingual-e5-base-ONNX](https://huggingface.co/onnx-community/multilingual-e5-base-ONNX)
    * [shannondata/multilingual-e5-small](https://huggingface.co/shannondata/multilingual-e5-small)
    * [Alternativen auf HuggingFace](https://huggingface.co/models?pipeline_tag=sentence-similarity&library=transformers.js&language=de&sort=downloads)
* **Vorlesen (Text to Speach):**
    * [onnx-community/Supertonic-TTS-ONNX](https://huggingface.co/onnx-community/Supertonic-TTS-ONNX)
    * [Alternativen auf HuggingFace](https://huggingface.co/models?pipeline_tag=text-to-speech&library=transformers.js&language=de&sort=downloads)

Künftige Web APIs
-----------------

Aktuell bietet der Web-Plattform noch keine nativen APIs für die lokale Ausführung
von Machine-Learning-Modellen. Dies könnte sich aber künftig ändern:

* W3C Web Machine Learning Group
    * [Webseite](https://webmachinelearning.github.io/)
    * [W3C-Seite](https://www.w3.org/groups/cg/webmachinelearning/)
    * [GitHub](github.com/webmachinelearning/)
* Vorgeschlagene APIs (Auswahl)
    * [Web Neural Network API](https://www.w3.org/TR/webnn/)
    * [Danymic AI Offloading Protocol](https://github.com/webmachinelearning/daop)
    * [Prompt API](https://github.com/webmachinelearning/prompt-api)
    * [Writing Assistance API](https://github.com/webmachinelearning/writing-assistance-apis)
    * [WebMPC](https://github.com/webmachinelearning/webmcp)

Weitere Ideen
-------------

Eventuell könnte es sinnvoll sein, ein besseres Modell für Zusammenfassungen zu verwenden.
[deutsche-telekom/mt5-small-sum-de-en-v1](https://huggingface.co/deutsche-telekom/mt5-small-sum-de-en-v1)
würde sich anbieten, müsste aber noch [in das ONXX-Format konvertiert](https://huggingface.co/spaces/onnx-community/convert-to-onnx) werden.

[shannondata/multilingual-e5-small](https://huggingface.co/shannondata/multilingual-e5-small) kann vermutlich
für Sentency Similarity und Question Answering verwendet werden.

Lessons Learned
---------------

transformers.js und HuggingFace:

* transformers.js benötigt die Modelle im ONNX-Format, da es sich um Grunde genommen um
  einen Wrapper um ONXX handelt.
  
* Um wirklich alle kompatiblem Modelle zu finden, muss man auf HuggingFace unter "Libraries"
  nach beidem getrennt suchen, da ONXX und transformers.js zwei Filtereinträge sind. Wählt man
  aber beide aus, erhält man nur Treffer, die auch beides in ihren Metadaten deklarieren.

* Die Modelle müssen eine feste Verzeichnisstruktur besitzen, um genutzt werden zu können:

    - `/config.json`
    - `onnx/model.onnx`
    - `onnx/model_{dtype}.onnx`

  Fehlt beispielsweise die `config.json`-Datei, wirft transformers.js beim Herunterladen
  des Modells einen Fehler. Oft sind aber auch einfach die `*.onnx`-Dateien falsch benannt.
  Im Download-Skript können hierfür Overrides eingetragen werden, um die falsch benannten
  Dateien überhaupt herunterladen und unter dem richtigen Namen ablegen zu können.

* Nicht immer sieht man am Dateinamen der Modelle, welche Datenformate (`dtype`) unterstützt
  werden. Das Skript `bin/init/download.js` ruft daher die Funktion `ModelRegistry.get_available_dtypes()`
  auf, um die verfügbaren Datentypen abzurufen und zeigt diese auf der Konsole an.

* Manchmal unterstützen die Modell die deutsche Sprache, auch wenn dies in den Metadaten
  nicht explizit angegeben ist. Zum Beispiel [onnx-community/text_summarization-ONNX](https://huggingface.co/onnx-community/text_summarization-ONNX).

* Die Dokumentation von transformers.js ist unvollständig und teilweise fehlerhaft. Manche
  Funktionen wie Text2Audio werden nur im Code in Form von Kommentaren dokumentiert. Andere
  Module wie `utils/hub` sind zwar dokumentiert, werden aber nicht exportiert.

* transformers.js besitzt für viele Modelle, in der Dokumentation nicht erwähnte, feste
  Konfigurationen im Code. Es bleibt abzuwarten, ob andere Modelle überhaupt nutzbar sind.

Copyright
---------

**Web/Mobile-Test für lokale KI**
**© 2026 Dennis Schulmeister-Zimolong <[dennis@wpvs.de](mailto:dennis@wpvs.de)>** <br>
[Quellcode Lizenziert unter BSD 3-Clause](.LICENCE) <br>
Beispieldaten lizenziert unter CC-BY 4.0, http://creativecommons.org/licenses/by/4.0/
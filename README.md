Web/Mobile-Test für lokale KI
=============================

1. [Beschreibung](#beschreibung)
1. [Vorbereitungen](#vorbereitungen)
1. [Start der Anwendung](#start-der-anwendung)
1. [Technische Umsetzung](#technische-umsetzung)
1. [Künftige Web APIs](#künftige-web-apis)
1. [Weitere Ideen](#weitere-ideen)
1. [Lessons Learned](#lessons-learned)
1. [Fazit](#fazit)
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

<table>
    <tr>
        <td>
            <a href="./doc/screenshot1.png">
                <img src="./doc/screenshot1.png" width="200">
            </a>
        </td>
        <td>
            <a href="./doc/screenshot2.png">
                <img src="./doc/screenshot2.png" width="200">
            </a>
        </td>
        <td>
            <a href="./doc/screenshot3.png">
                <img src="./doc/screenshot3.png" width="200">
            </a>
        </td>
    </tr>
</table>

Vorbereitungen
--------------

Bevor die Anwendung gestartet werden kann, müssen folgende Schritte ausgeführt werden:

1. **Modelle herunterladen:** Um ein realistisches Deployment-Szenario nachzustellen,
   lädt die Webanwendung die Modelle nicht vom HuggingFace Model Hub. Stattdessen werden
   die Modelle als Teil der Webanwendung gehostet. Hierfür müssen sie auf dem Webserver
   einmalig lokal heruntergeladen werden.

2. **Testdaten aufbereiten:** In Vorbereitung auf den nächsten Schritt werden hier
   Schlüsselwörter aus den Beispielseiten extrahiert und die Seiten in einzelne Sätze
   zerlegt. Als Schlüsselwörter werden der Einfachheit halber einfach alle Überschriften
   und mit Fettdruck oder Kursivschrift ausgezeichnete Textstellen verwendet. Dies
   ermöglicht es, im nächsten Schritt die Texteinbettungen für beides zu berechnen,
   um somit einen Index für die semantische Suche aufzubauen.

3. **Worteinbettungen berechnen:** Die semantische Suche basiert auf der klassischen
   Kosinus-Ähnlichkeit von Worteinbettungen. Während der Suche wird die Einbettung
   des Suchbegriffs berechnet und mit den Einbettungen der aus den Testdokumenten
   erzeugten Kontextblöcke verglichen. Siehe [Lessons Learned](#semantische-suche)
   unten. Da sich letztere nur ändern, wenn sich die Testdaten ändern, müssne sie
   vor Ausführung der App einmalig vorberechnet werden.

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
* **KI-Modelle:** Siehe [./static/models/index.json](static/models/index.json)

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

[shannondata/multilingual-e5-small](https://huggingface.co/shannondata/multilingual-e5-small) kann vermutlich
für Sentency Similarity und Question Answering verwendet werden.

Lessons Learned
---------------

### Web-Plattform

* `Uint8Array.fromBase64()` wird von der Android Webview noch nicht durchgängig unterstützt.
  Älteren Geräte, die seit einem Jahr keine Updates mehr erhalten haben (eine Pest im Android-Ökosystem!)
  fehlen die Base64-Methoden, so dass hier auf eine kompliziertere Implementierung ausgewichen
  werden muss.

* Die Ausführung großer Modelle (bereits um die 300 MB) mit Web Assembly blockiert den Browser
  so sehr, dass diese währenddessen alle anderen Prozesse unterbricht. Vor allem findet kein
  Rendering statt. Deshalb scheint unsere Stoppuhr nicht zu laufen und auch die gestreamten
  Texte werden nicht angezeigt. Getestet mit Firefox Desktop und Chrome Desktop.

### transformers.js und HuggingFace

* transformers.js benötigt die Modelle im ONNX-Format, da es sich um Grunde genommen um
  einen Wrapper um ONXX handelt.
  
* Um wirklich alle kompatiblem Modelle zu finden, muss man auf HuggingFace unter "Libraries"
  nach beidem getrennt suchen, da ONXX und transformers.js zwei Filtereinträge sind. Wählt man
  aber beide aus, erhält man nur Treffer, die auch beides in ihren Metadaten deklarieren.

* Die Modelle müssen eine feste Verzeichnisstruktur besitzen, um genutzt werden zu können:

    - `/config.json`
    - `/tokenizer_config.json`
    - `onnx/model.onnx`
    - `onnx/model_{dtype}.onnx`

  Fehlt beispielsweise die `config.json`-Datei, wirft transformers.js beim Herunterladen
  des Modells einen Fehler.

* Nicht immer sieht man am Dateinamen der Modelle, welche Datenformate (`dtype`) unterstützt
  werden. Das Skript `bin/init/download.js` ruft daher die Funktion `ModelRegistry.get_available_dtypes()`
  auf, um die verfügbaren Datentypen abzurufen und zeigt diese auf der Konsole an.

* Manchmal unterstützen die Modell die deutsche Sprache, auch wenn dies in den Metadaten
  nicht explizit angegeben ist. Zum Beispiel [onnx-community/text_summarization-ONNX](https://huggingface.co/onnx-community/text_summarization-ONNX).

* Allerdings scheinen Modelle für die deutsche Sprache insgesamt selten zu sein. Die allermeisten
  Modelle sind auf Englisch trainiert. Zum Beispiel: [Xenova/distilbart-xsum-12-1](https://huggingface.co/Xenova/distilbart-xsum-12-1)
  generiert bei einem deutschen Text nur Müll.

* Die Dokumentation von transformers.js ist teilweise unvollständig und fehlerhaft. Manche
  Funktionen wie Text2Audio werden nur im Code in Form von Kommentaren dokumentiert. Andere
  Module wie `utils/hub` sind zwar dokumentiert, werden aber nicht exportiert.

* transformers.js besitzt für viele Modelle, in der Dokumentation nicht erwähnte, feste
  Konfigurationen im Code. Die Hoffnung ist, dass andere Modelle trotzdem nutzbar sind.

* transformers.js Version 4.2.0, basierend auf ONNX Runtime 1.25+: Unter Web Assembly lassen
  sich aktuell nur Modelle vom Typ FP32 laden. Der Versuch, ein quantisiertes Modell zu laden
  schlägt mit „TransposeDQWeightsForMatMulNBits Missing required scale“ fehl, weil in ONXX ein
  Optimierungsdurchlauf eingeführt wurde, der bestimmte Skalierungstensoren in quantisierten
  Modellen erwartet, die ältere quantisierte Exporte nicht bereitstellen.

  Soll angeblich in transformers.js 4.3.0 behoben werden: [GitHub Issue](https://github.com/huggingface/transformers.js/issues/1707#issuecomment-4684921369)
  Diese ist Stand 31.08.2026 aber noch nicht veröffentlicht.

* Modelle, die noch nicht im ONNX-Format vorliegen, können mit folgendem Online-Tool automatisch
  konvertiert und auf HuggingFace hochgeladen werden. Gibt man keinen eigenen Write Token an,
  werden sie unter der Organisation `onnx-community` hochgeladen:

  [Space: Conver to ONNX][https://huggingface.co/spaces/onnx-community/convert-to-onnx]

### Semantische Suche

* Viele moderne Sprachmodelle besitzen einen Transformer-Encoder, der aus
  einem Eingabetext kontextabhängige Token-Repräsentationen erzeugt. Das wird z.
  B. über eine Feature-Extraction-Pipeline zugänglich gemacht. Allerdings
  eignen sich nicht alle Sprachmodelle bzw. deren Repräsentationen gleichermaßen
  für semantische Suche. Insbesondere sind die erzeugten Token-Repräsentationen
  nicht automatisch so trainiert, dass sich daraus durch einen einfachen
  Vektorenvergleich sinnvolle semantische Ähnlichkeiten ergeben.

* Sentence Transformer Modelle eignen sich besonders gut für semantische
  Suche, da sie speziell darauf trainiert wurden, semantisch ähnliche Texte im
  Embedding-Raum nahe beieinander abzubilden. Dazu werden entsprechende
  Trainingsverfahren und ein für den Vergleich geeigneter Embedding-Output
  verwendet.

* Füttert man einem Modell wie `sentence-transformers/all-MiniLM-L6-v2` einen
  einzelnen String, erhält man bei der Feature Extraction beispielsweise einen
  Tensor mit der Dimensionalität `(1, 15, 384)`. Dies bedeutet:

  * `1` Eingabestring
  * `15` Tokens (abhängig vom Eingabetext)
  * `384` Werte je Token (abhängig vom Modell)

* Im Beispiel besteht die Ausgabe also aus `1 × 15 × 384 = 5760` Werten. Um aus
  den unterschiedlich langen Sequenzen eine einheitliche Repräsentation des
  gesamten Strings zu erhalten, werden die Token-Embeddings mittels Mean
  Pooling zu einem Vektor mit 384 Werten zusammengefasst. Bei `all-MiniLM-L6-v2`
  ist dies die vorgesehene Vorgehensweise.

* Der eigentliche Vergleich zweier Embeddings kann über die Kosinus-Ähnlichkeit
  erfolgen. Sie entspricht geometrisch dem Kosinus des Winkels zwischen den beiden
  Vektoren und liegt im Wertebereich `[-1, 1]`:

  * `-1` → entgegengesetzte Richtungen (`180°`)
  * `0` → orthogonale Vektoren (`90°`)
  * `1` → gleiche Richtung (`0°`)

  Vgl. [Wikipedia: Kosinus-Ähnlichkeit](https://de.wikipedia.org/wiki/Kosinus-%C3%84hnlichkeit) <br>
  Vgl. [transformers.js: maths.cos_sim()](https://huggingface.co/docs/transformers.js/api/utils/maths#utilsmathscossimarr1-arr2--number)


* Werden die Vektoren zusätzlich auf Einheitslänge normalisiert, reduziert sich die Berechnung
  der Kosinus-Ähnlichkeit auf das Skalarprodukt der beiden Vektoren.

  Vgl. [transformers.js: maths.dot()](https://huggingface.co/docs/transformers.js/api/utils/maths#module_utils/maths.dot)

* Die Qualität der semantischen Suche hängt, wie zu erwarten, vom verwendeten Embedding
  Modell ab und ob dieses Synonyme für die verwendeten Begriffe kennt. Das kleine Modell
  `sentence-transformers/all-MiniLM-L6-v2` scheint zum Beispiel `WWW` und `World Wide Web`
  als Synonyme zu kennen, `IoT` und `Internet of Things` aber nicht. Dennoch sinkt die
  Trefferwahrscheinlichkeit deutlich, wenn man `WWW` sucht, im Text aber `World Wide Web`
  steht.

### Text zusammenfassen

* Die im ONNX-Format verfügbaren Modelle auf HuggingFace sind alle nur auf englischen
  Texten trainiert. Deutsche Texte werden daher wörtlich wiedergegeben und nach einer
  Festen länge abgebrochen.

* Lediglich [Shahm/bart-german](https://huggingface.co/Shahm/bart-german) scheint auf
  einem deutschen Datensatz trainiert zu sein. Das Repository hat aber nicht die von
  transformers.js erwartete Struktur.

* In anderen Formaten als ONXX gibt es zumindest eine kleine Auswahl.
  [deutsche-telekom/mt5-small-sum-de-en-v2](https://huggingface.co/deutsche-telekom/mt5-small-sum-de-en-v2)
  wurde für diesen Test ins ONNX-Format konvertiert. Die FP32-Variante ist aber 1,8 GB groß.

    * int8: ca. 1,4 GB. In Firefox Desktop crash der Tab beim Laden.

    * q4f16: ca. 600 MB. Lässt sich aber nicht laden.

      ```
      Error: Can't create a session. ERROR_CODE: 1, ERROR_MESSAGE: Type Error: Type (tensor(float16)) of output arg (/block.0/layer.0/layer_norm/Cast_output_0) of node (/block.0/layer.0/layer_norm/Cast) does not match expected type (tensor(float)).
      ```

    * fp16: ca. 817 MB. Lässt sich mit derselben Fehlermeldung nicht laden

    * q4: ca. 1,1 GB. Lässt sich laden, aber die Datei `tokenizer_config.json` fehlt.
      Die Generierung bricht daher mit `TypeError: tokenizer is not a function` ab.


  Es sieht so aus, als ob die ONNX Runtime fp16 nicht unterstützt.

* [Shahm/t5-small-german](https://huggingface.co/Shahm/t5-small-german) konnte erfolgreich
  konvertiert und getestet werden. Die besonders kleinen q4 und bnb4-Varianten erzeugen
  allerdings keinen Text. Und die Zusammenfassungen sind dast immer nur einen Satz lang. 🙂

* Lässt man das Modell zu wenig Token erzeugen (zum Beispiel nur zehn), wird der Text
  abgeschnitten. Generell scheint das Modell darauf ausgelegt zu sein, eine Textstelle
  aus der Anfrage zu extrahieren.

* Generell scheint es keine guten deutschsprachigen Modelle zu geben, oder diese sind
  für die Nutzung im Browser zu groß (1,5 GB und mehr). Von daher ist "summarization"
  mit [Shahm/t5-small-german](https://huggingface.co/Shahm/t5-small-german) zwar machbar.
  Die Zusammenfassung ist aber zu kurz.
  
  [onnx-community/bart-german-ONNX](https://huggingface.co/Shahm/t5-small-german) liefert
  etwas längere Texte bis zu drei Sätze. Das ist immer noch zu kurz. Und das Modell streut
  unsinnige Artefakte (falsche Wortfetzen mit technischen Begriffen ohne Bezug zum Kontext)
  ein, die vermutlich in den Trainingsdaten enthalten waren. Dadurch wird die Lesbarkeit
  deutlich gestört.

### Text übersetzen

* [huggingworld/m2m100_418M](https://huggingface.co/huggingworld/m2m100_418M) lässt sich
  wegen dem ONNX-Problem aktuell nicht laden.
  [casawolice/small100-onnx](https://huggingface.co/casawolice/small100-onnx) ist ähnlich klein
  und lässt sich laden. Alle anderen Modelle auf HuggingFace sind zu groß.

Fazit
----

Kleinere Anwendungsfälle, die mit Modellen zwischen 300 und 500 MB auskommen, lassen sich
auf mobilen Geräten innerhalb einer Webawendung lokal ausführen. Allerdings nur mit
Einschränkungen:

* Es funktioniert nicht mit jedem Browser. Chrome hat bisher am besten funktioniert.
  Firefox am schlechtesten (Abstürze, keine WASM SIMD-Unterstützen auf älteren Geräten, ... ).

* WebGPU war auf keinem der getesteten, mobilen Geräte verfügbar, obwohl es laut
  [Can I Use](https://caniuse.com/?search=webgpu) ab Chrome für Android 151 unterstützt
  werden sollte.

* Speicher ist sehr knapp. Mehrere Modelle können daher nicht praktikabel im Speicher
  gehalten werden, sondern die Modelle regelmäßig neu geladen werden. Neben der Wartezeit
  erhöht dies auch den Traffic.

* Der Browser friert ein, während ein Modell ausgeführt wird. Es findet kein Rendering
  und somit auch keine Aktualisierung der Anzeige statt, während ein Modell läuft.

* Dadurch, dass nur sehr kleine Modelle ausführbar sind, lassen sich auch keine
  Anwendungsfälle lokale umsetzen, die man heute mit einem LLM assoziieren würde.

* Das Ökosystem entwickelt sich schnell weiter. Aber in Folge daraus, ist es auch nicht
  sehr stabil, was die durch ONNX 1.25 ausgelösten Fehlermeldungen zeigen, die über
  Monate hinweg nicht gefixt werden.

Copyright
---------

**Web/Mobile-Test für lokale KI** <br>
© 2026 Dennis Schulmeister-Zimolong <[dennis@wpvs.de](mailto:dennis@wpvs.de)> <br>
[Quellcode Lizenziert unter BSD 3-Clause](.LICENCE) <br>
Beispieldaten lizenziert unter CC-BY 4.0, http://creativecommons.org/licenses/by/4.0/
Grundbegriffe der Kryptographie
===============================

**Verschlüsselung:** Ein umkehrbarer Algorithmus, um einen Klartext mithilfe
eines Schlüssels so abzuändern, dass er für unberechtigte Dritte keinen Sinn
ergibt. Im Idealfall verhalten sich die verschlüsselten Daten wie zufälliges
Rauschen, damit keine Rückschlüsse auf den Ursprungstext gezogen werden können.
Wird zum Beispiel ein Ursprungstext aus dem Alphabet A-Z auf ein Chiffrat mit
demselben Alphabet A-Z abgebildet, sollten im Ergebnis alle Buchstaben mit der
gleichen Wahrscheinlichkeit auftreten und es darf nicht passieren, dass derselbe
Eingangsbuchstabe häufiger zum selben Ausgangsbuchstaben führt. Denn sonst
könnte ein Angreifer durch Häufigkeitsanalysen große Teile des Ursprungstextes
rekonstruieren, da bestimmte Buchstabenkombinationen in der natürlichen Sprache
häufiger vorkommen als andere.

**Symmetrische Verschlüsselung:** Die Entschlüsselung erfolgt mit demselben
Schlüssel wie die Verschlüsselung. Die Sicherheit basiert allein auf der
Geheimhaltung des Schlüssels, der daher auch Shared Secret genannt wird. Die
Kommunikationspartner sollten den Schlüssel Out-Off-Band austauschen, sprich
nicht über denselben Kanal wie die zu verschlüsselnden Daten.

**Asymmetrische Verschlüsselung:** Zum Verschlüsseln wird ein anderer Schlüssel
benötigt, als zum Entschlüsseln. Welchen der beiden Schlüssel man beim
Verschlüsseln verwendet, spielt keine Rolle, solange man das Chiffrat stets mit
dem anderen Schlüssel entschlüsselt. Die Schlüssel müssen so gewählt werden,
dass es in akzeptabler Zeit nicht möglich ist, den einen Schlüssel aus dem
anderen abzuleiten.

**Public Key/Private Key:** Bei der Vewendung eines asymmetrischen
Verschlüsselungsalgorithmus besitzt jeder Kommunikationsteilnehmer ein
Schlüsselpaar bestehend aus Public Key und Private Key. Der Private Key ist
streng geheim zu halten und darf niemals aus der Hand gegeben werden. Der Public
Key hingegen wird öffentlich geteilt. Will man jemandem eine sichere Nachricht
schicken, verschlüsselt man sie mit dem Public Key des Empfängers, da somit nur
er die Nachricht mit seinem Private Key wieder entschlüsseln kann.

**Hash:** Eine mathematische Funktion, die einen Klartext auf einen viel
kürzeren Wert, den Hashwert, abbildet. Hashfunktionen werden auch Einwegfunktion
oder Falltürfunktion genannt: In die eine Richtung sind sie einfach zu
berechnen, man kommt aber nur extrem schwer wieder auf den Ursprungswert zurück.
Da durch die Hashfunktion Informationen verloren gehen, gibt es immer mehrere
zulässige Eingangswerte, die zum selben Hashwert führen. Man spricht dann von
Kollisionen. Gute Hashfunktionen sind so gewählt, dass Kollisionen möglichst
selten auftreten und dass bereits eine kleine Änderung am Eingangswert zu einer
drastischen Abweichung im Hashwert führt.

**Digitale Signatur:** Ein mit dem Private Key des Absenders verschlüsselter
Hashwert einer Nachricht, mit dem unerlaubte Modifikationen an der Nachricht
erkannt werden können, wodurch die Integrität der Nachricht sichergestellt wird.
Da die Signatur mit dem Private Key des Absenders gebildet wird, kann nur der
Originalsender eine zum Inhalt passende Signatur bilden. Der Empfänger kann die
Nachricht prüfen, indem er selbst den Hashwert ausrechnet und ihn mit der
entschlüsselten Signatur vergleicht.
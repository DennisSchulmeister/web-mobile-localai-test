Die Bestandteile des World Wide Web
===================================

Ursprüng des Web
----------------

In den Jahren ab 1989 machte sich Tim Berners-Lee daran, seine Vision
umzusetzen. Er ging also her und hat angefangen, sowohl einen Webserver
als auch einen Browser zu entwickeln. Als Entwicklungsmaschine nutzte er hierfür
einen NeXTcube, der für sich genommen schon eine interessante Geschichte wert
wäre. So viel sei an dieser Stelle aber zum NeXTcube und der Firma NeXT
verraten: Als Steve Jobs die von ihm mitgegründete Firma Apple 1985 im Streit
verließ, gründete er kurzerhand einfach einen neuen Computerhersteller. 1996
wurde dieser von Apple übernommen und Steve Jobs kehrte zu seiner ersten Firma
zurück.

Doch zurück zum Thema. Bereits in seinem Aufsatz von 1989 beschreibt Tim
Berners-Lee die drei wesentlichen Elemente, die zusammengenommen das World Wide
Web ergeben (vom Internet einmal abgesehen):

* **HTML (Hypertext Markup Language)** als Beschreibungssprache zum Verfassen
  von Webseiten. Wobei damit anfangs eher Textdokumente wie zum Beispiel
  wissenschaftliche Artikel oder Anleitungen und weniger Webseiten in modernen
  Sinne gemeint waren. Als Grundlage wählte er daher eine bereits vorhandene
  Beschreibungssprache namens SGML und vereinfachte diese.

* **URL (Uniform Resource Locator)** als das formale Schema zur Adressierung
  jener Dokumente im Web. Jedes Dokument sollte damit eine weltweit eindeutige
  Adresse bekommen, unter der aus gefunden und abgerufen werden kann.

* **HTTP (HyperText Transfer Protocol)** als Übertragunsprotokoll, mit dem eine
  Verbindung zu einem Server hergestellt werden kann, um gewünschten Dokumente
  abzurufen. Im Vergleich zu heute war das Protokoll dabei fast schon trivial
  einfach: Nach erfolgtem Verbindungsaufbau sollte einfach das Wort GET gefolgt
  vom Namen der gewünschten Datei gesendet werden, woraufhin der Server mit dem
  Inhalt der Datei antwortete und die Verbindung beendete.

1991 war es endlich soweit. Eine erste lauffähige Version der Software war
vorhanden und Tom Berners-Lee setzte den ersten Webserver mit der ersten
Webseite auf. Diese hatte die Adresse
http://info.cern.ch/hypertext/WWW/TheProject.html und beschrieb einfach nur „das
Projekt“, wie er es damals nannte. 

Die Entwicklung danach
----------------------

Mit dem World Wide Web hatte Tim Berners-Lee einen Zeitgeist getroffen. Zwar gab
es für ein paar Jahre mit Gopher einen alternativen Informationsdienst im
Internet, dieser konnte sich jedoch nicht gegen die neuen multimedialen
Fähigkeiten des Web durchsetzen. Und so kam es, dass 1993, noch im selben Jahr,
als Berners-Lee die Software der Allgemeinheit zur Verfügung stellte, weltweit
bereits über 500 Webserver online gingen.

In den Folgejahren entwickelte sich eine immer größere Fangemeinde rund um das
Web und Tim Bernes-Lee verließ irgendwann das CERN, um das W3C zur Koordination
aller weiteren Tätigkeiten zu gründen. Das Web entwickelte sich daraufhin rapide
weiter, so dass gerade in den Anfangsjahren öfters neue Versionen der zugrunde
liegenden Technologien erschienen. Dabei hat sich natürlich nicht jede Idee
durchgesetzt, auch weil es oft konkurrierende Umsetzungen gab. Beispielsweise
gab es vor CSS mehrere Stylesheetsprachen, mit denen der/die Besucher:in das
Aussehen einer Webseite definieren konnte. Aber erst die Idee, dass dies durch
den/die Betreiber:in erfolgen sollte, konnte letztlich überzeugen.

Für interaktive Elemente innerhalb einer Webseite wurde 1995 dann die
Programmiersprache JavaScript erfunden und im Netscape Communicator (heute
Firefox) eingebunden. Syntax und Namen orientieren sich an der damals ebenfalls
neuen Programmiersprache Java. Einsatzgebiet sollte aber nicht Entwicklung
plattformneutraler Anwendungen sondern die anreicherung einfacher Webseiten
sein. Andere Browserhersteller zogen deshalb bald nach, leisteten sich aber im
Falle von Microsoft auch inkompatible Implementierungen, in der Hoffnung,
dadurch mehr Benutzer*innen zu generieren. Unterdessen setzte aber auch eine
Standardisierung ein, wodurch die Browser mit jeder Version immer kompatibler
wurden.

Viele Jahre später – wir sind nun mitten in der 2000ern angekommen – gab es dann
nochmal eine kleine Revolution. WebSockets lösten das bis dahin existierende
Problem der bidirektionalen Kommunikation zwischen Client und Server. Denn
bisher konnte der Server immer nur dann Daten liefern, wenn diese durch den
Client durch eine HTTP-Anfrage explizit angefordert wurden. WebSockets erlauben
darüber hinaus aber auch, eine dauerhafte Verbindung offen zu halten, so dass
beide Seiten jederzeit proaktiv Daten übermitteln können. Push-Nachrichten,
Mehrbenutzer-Chats und Browserspiele und viele mehr lassen sich dadurch
wesentlich einfacher als bisher realisieren.

Und der Rest, heißt es so schön, ist Geschichte! 
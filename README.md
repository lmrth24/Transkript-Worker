# YouTube Transkript Worker für Notion

Dieser Worker holt automatisch das Transkript eines YouTube-Videos und fügt es als Toggle-Block in eine Notion-Seite ein. Perfekt, um Video-Inhalte in deine Wissensdatenbank zu bekommen, ohne sie selber abtippen oder durchklicken zu müssen.

**Was du am Ende hast:** Ein Custom Agent in Notion, dem du auf einer Ressourcen-Seite mit hinterlegter YouTube-URL nur "Transkript holen" sagen musst — und Sekunden später ist das komplette Transkript in der Seite.

---

## Was du vorher brauchst

Bevor du loslegst, besorg dir diese drei Dinge. **Bitte arbeite die Reihenfolge wirklich von oben nach unten ab** — wenn du Schritt 2 oder 3 überspringst, wird die spätere Anleitung mit „command not found" abbrechen.

### 1. Einen Supadata-Account

- Geh auf https://supadata.ai und registriere dich
- Im Dashboard findest du deinen persönlichen **API-Key** — den brauchst du gleich
- Der kostenlose Tarif hat **100 Transkript-Abrufe pro Monat**. Für die meisten Kursteilnehmer reicht das locker; für mehr gibt's bezahlte Pläne

### 2. Node.js (Version 22 oder höher) — **muss vorher installiert sein**

Node.js bringt das Programm `npm` mit, das wir später brauchen, um die Notion CLI zu installieren. Ohne Node.js geht gar nichts.

**Schritt A — prüfen, ob Node schon da ist:**

Öffne das Terminal (auf dem Mac: Cmd+Leertaste, „Terminal" tippen, Enter) und führe aus:

```bash
node --version
```

- Wenn eine Zahl wie `v22.x.x` oder `v24.x.x` kommt → super, weiter zu Punkt 3.
- Wenn `command not found: node` kommt **oder** die Zahl kleiner als `v22` ist → weiter mit Schritt B.

**Schritt B — Node.js installieren:**

1. Geh auf https://nodejs.org
2. Lade dir die **LTS-Version** runter (großer grüner Button)
3. Öffne die heruntergeladene Datei und klicke dich durch den Installer (alle Standardeinstellungen sind ok)
4. **Wichtig: Schließ dein Terminal-Fenster komplett und öffne ein neues.** Sonst kennt das Terminal die frisch installierten Befehle noch nicht — und du bekommst „command not found", obwohl alles installiert ist.

**Schritt C — nochmal prüfen:**

```bash
node --version
npm --version
```

Beide Befehle müssen jetzt eine Versionsnummer anzeigen. Erst dann gehst du weiter.

> **Wenn `npm --version` immer noch „command not found" sagt**, obwohl du Node.js gerade installiert hast: Schließ wirklich **alle** Terminal-Fenster (nicht nur den Tab, sondern das Programm beenden mit Cmd+Q), öffne das Terminal frisch und versuch es nochmal. Das ist der häufigste Stolperstein und hat in 99% der Fälle damit zu tun.

### 3. Git (für den Download des Worker-Codes)

**Prüfen:**

```bash
git --version
```

- Wenn eine Versionsnummer kommt → fertig.
- Wenn nicht: Auf dem Mac öffnet sich beim ersten Aufruf von `git` automatisch ein Dialog, der die „Command Line Developer Tools" installiert. Klick auf **Install** und warte ein paar Minuten. Danach Terminal neu öffnen und `git --version` nochmal probieren.
- Alternativ: https://git-scm.com runterladen und installieren.

> **Keine Angst vor dem Terminal**: Du musst für diese Einrichtung ein paar Befehle kopieren und einfügen. Das war's. Du musst nichts selbst programmieren.

---

## Schritt-für-Schritt-Anleitung

### Schritt 1: Notion CLI installieren (einmalig)

Die Notion CLI (`ntn`) ist das Werkzeug, mit dem du den Worker in deinen Notion-Workspace hochlädst.

> **Voraussetzung:** Du hast den Punkt „Node.js" oben erfolgreich abgeschlossen, d.h. `npm --version` zeigt eine Versionsnummer. Wenn nicht: zurück nach oben und das erst fixen.

Öffne das Terminal und führe aus:

```bash
npm install -g ntn
```

> Falls hier `EACCES`/`permission denied`-Fehler kommen, führe stattdessen aus:
> ```bash
> sudo npm install -g ntn
> ```
> und gib dein Mac-Passwort ein, wenn gefragt.

Danach prüfe, ob es geklappt hat:

```bash
ntn --version
```

Sollte eine Versionsnummer anzeigen. Wenn `command not found: ntn` kommt: Terminal komplett schließen (Cmd+Q) und neu öffnen, dann nochmal probieren.

### Schritt 2: Worker-Projekt herunterladen

Geh im Terminal in den Ordner, in dem du das Projekt ablegen möchtest (z.B. Desktop):

```bash
cd ~/Desktop
```

Lade das Repository herunter:

```bash
git clone https://github.com/lmrth24/Transkript-Worker.git transkript-worker
cd transkript-worker
```

### Schritt 3: Abhängigkeiten installieren

Immer noch im `transkript-worker`-Ordner, führe aus:

```bash
npm install
```

Das dauert ein paar Sekunden und installiert alle benötigten Helfer-Pakete.

### Schritt 4: Deinen Supadata-Key eintragen (und optional: Status-Update konfigurieren)

Im Projekt-Ordner findest du eine Datei namens `.env.example`. Mach davon eine Kopie und nenne sie `.env`:

**Mac/Linux:**
```bash
cp .env.example .env
```

**Windows:**
```bash
copy .env.example .env
```

Dann öffne die neue `.env`-Datei in einem Texteditor und ersetze den Platzhalter durch deinen echten Supadata-Key:

```
SUPADATA_API_KEY=sd_deinkeyhier1234567890
```

**Optional: Status-Update nach dem Transkript**

Wenn du möchtest, dass der Worker nach dem Einfügen des Transkripts den Status der Notion-Seite automatisch ändert (z.B. von „Neu" auf „Transkript da"), trag den exakten Namen der Status-Option in dieselbe `.env` ein:

```
STATUS_AFTER_TRANSCRIPT=Transkript da
```

- Lass die Zeile leer (oder lösch sie), wenn du **kein** Status-Update willst.
- Voraussetzung: Deine Datenbank hat eine Property mit dem Namen `Status` (Typ: Status), und darin existiert eine Option, die **exakt so heißt** wie hier eingetragen (Groß-/Kleinschreibung & Leerzeichen müssen passen).
- Wenn die Property oder Option fehlt, ignoriert der Worker das Status-Update einfach — das Transkript wird trotzdem eingefügt.

Speichern und schließen.

> **Wichtig:** Die `.env`-Datei enthält deinen persönlichen Key. Sie wird automatisch vom Hochladen ins Repository ausgeschlossen (durch die `.gitignore`) — dein Key bleibt also auf deinem Rechner.

### Schritt 5: Bei Notion anmelden

Jetzt verbindet sich die CLI mit deinem Notion-Account:

```bash
ntn login
```

Dein Browser öffnet sich. Dort musst du:
1. Dich in Notion einloggen (falls noch nicht geschehen)
2. Den Workspace auswählen, in dem der Worker laufen soll
3. Die Freigabe bestätigen

Zurück im Terminal siehst du dann, dass du eingeloggt bist.

### Schritt 6: Worker in deinen Notion-Workspace hochladen

Der große Moment:

```bash
ntn workers deploy
```

Die CLI fragt dich einmalig, wie der Worker heißen soll — nenn ihn z.B. `Transkript-Worker`. Danach wird das Projekt zu Notion hochgeladen. Das dauert ca. 30 Sekunden.

Wenn du am Ende sowas siehst wie "✔ Worker updated" und darunter "tool fetchTranscript", hat alles geklappt.

### Schritt 7: Deinen Supadata-Key auch zum Worker schicken

Der Worker braucht den Key, um bei Supadata Transkripte abzuholen. Lokal hast du ihn schon in der `.env`, aber der Worker läuft in der Cloud und braucht ihn dort auch:

```bash
ntn workers env push --yes
```

Kurze Bestätigung, fertig.

### Schritt 8: Den Custom Agent in Notion anlegen

Jetzt wechselst du in die Notion-App. Leg dort einen neuen Custom Agent an.
Im Abschnitt **Anweisungen**: Kopiere folgenden Prompt hinein:

```
Du bist ein Assistent, der YouTube-Transkripte in Notion-Ressourcen einfuegt.

Du hast GENAU EIN Werkzeug: das Tool "fetchTranscript".
Nutze ausschliesslich dieses Tool. Nutze KEINEN Code, KEIN Python,
KEINE Web-Requests und keinen Script-Mode.

Wenn du auf einer Seite ausgefuehrt wirst:

1. Ermittle die vollstaendige Notion-URL der aktuellen Seite
   (z.B. https://www.notion.so/349597b29ce2806d99a3d43fb897963f).
   WICHTIG: Nutze NICHT interne Kurzreferenzen wie "notion-151" oder aehnliches.
   Wenn du nur eine solche Kurzreferenz hast, rekonstruiere die vollstaendige URL
   aus dem Seitenkontext.

2. Rufe das Tool "fetchTranscript" genau EINMAL auf mit:
   - pageId: Die vollstaendige Notion-URL der Seite (als String)
   - lang: null

3. Warte auf die Antwort und gib mir eine kurze Bestaetigung in einem Satz zurueck.

Falls das Tool einen Fehler meldet:
- Versuche NICHT, die Aufgabe mit anderen Mitteln zu loesen
- Versuche NICHT, die pageId "zu reparieren" durch mehrfache Aufrufe
- Gib mir stattdessen die exakte Fehlermeldung aus

Stelle keine Rueckfragen, fuehre direkt einmal aus.
```

6. Speichern.

### Schritt 9: Testen!

1. Geh in deine Ressourcen-Datenbank in Notion (oder auf irgendeine Seite, die eine URL-Property mit einer YouTube-URL hat)
2. Öffne einen Eintrag
3. Trigger deinen Custom Agent — entweder per `@` im Seiteninhalt, oder über die Agent-Leiste
4. Warte 10–30 Sekunden
5. Am Ende der Seite sollte ein eingeklappter Toggle-Block **"Transkript"** erscheinen

---

## Voraussetzungen auf der Notion-Seite

Damit der Worker die URL findet, muss die Seite eine **URL-Property** haben, in der die YouTube-URL eingetragen ist. Der Worker sucht in dieser Reihenfolge:

1. Property mit Namen `URL`, `Url`, `url`, `Link`, `YouTube URL` oder `Video URL`
2. Falls nicht gefunden: irgendeine URL-Property mit Wert
3. Falls auch das fehlt: irgendeine Text-Property, die einen Link enthält

Am einfachsten: Nenn deine URL-Property schlicht **URL**.

---

## Was der Worker macht

Wenn du ihn triggerst, läuft Folgendes ab:

1. Er liest die YouTube-URL aus der Property deiner Notion-Seite
2. Er fragt bei Supadata das Transkript an (inkl. Sprach-Auto-Erkennung)
3. Er erstellt einen eingeklappten Toggle-Block **"Transkript"** am Ende der Seite
4. Optional: Er setzt den Status der Seite auf den Wert, den du in der `.env` als `STATUS_AFTER_TRANSCRIPT` eingetragen hast (falls diese Option in deiner Status-Property existiert — sonst ignoriert er das einfach)

---

## Häufige Stolpersteine

**"command not found: npm" oder "command not found: node":**
Node.js ist entweder nicht installiert oder das Terminal kennt es noch nicht.
1. Geh zurück zu „Was du vorher brauchst → Punkt 2" und installier Node.js von https://nodejs.org (LTS-Version).
2. Nach der Installation **alle** Terminal-Fenster schließen (Cmd+Q, nicht nur den Tab) und ein neues öffnen.
3. `node --version` und `npm --version` müssen beide eine Zahl anzeigen, **bevor** du mit Schritt 1 der Anleitung weitermachst.

**"command not found: ntn" nach `npm install -g ntn`:**
Terminal einmal komplett schließen (Cmd+Q) und neu öffnen. Das aktualisiert den Pfad zu frisch installierten Tools.

**"EACCES" oder "permission denied" bei `npm install -g`:**
Versuch's nochmal mit `sudo` davor: `sudo npm install -g ntn`. Du wirst nach deinem Mac-Passwort gefragt — das ist normal.

**"Keine URL in den Properties dieser Seite gefunden":**
Deine Seite hat keine URL-Property oder die Property ist leer. Leg eine URL-Property an und trag die YouTube-URL ein.

**"Kein Transkript für dieses Video verfügbar":**
Das Video hat keine Untertitel (weder manuell noch automatisch generiert). Kommt selten vor, aber passiert.

**"Ungültige pageId":**
Der Agent hat dem Tool keine echte Notion-URL übergeben. Trigger den Agent nochmal — oft klappt's beim zweiten Versuch. Wenn nicht, stell sicher, dass du den oben gezeigten Agent-Prompt genau so übernommen hast.

**Status wird nicht aktualisiert:**
Entweder hast du `STATUS_AFTER_TRANSCRIPT` in der `.env` leer gelassen (dann macht der Worker absichtlich nichts) — oder deine Ressourcen-DB hat keine Property namens `Status` bzw. keine Option mit genau dem Namen, den du eingetragen hast. Tipp-Check: Groß-/Kleinschreibung und Leerzeichen müssen exakt passen. Wenn du die `.env` änderst, musst du anschließend nochmal `ntn workers env push --yes` ausführen, damit der Worker den neuen Wert bekommt.

---

## Wenn etwas nicht funktioniert

Du kannst dir die Logs deines Workers anschauen:

```bash
ntn workers runs list
```

Zeigt die letzten Ausführungen. Für Details zu einem bestimmten Run:

```bash
ntn workers runs logs <run-id>
```

Die `<run-id>` kopierst du aus der Liste.

Hilft das nicht weiter: Stell deine Frage in der **Agent Mastery** Community.

---

## Updates

Wenn es eine neue Version des Workers gibt, führe im Projektordner aus:

```bash
git pull
npm install
ntn workers deploy
```

Deine `.env` und dein Supadata-Key bleiben dabei erhalten.

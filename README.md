# YouTube Transkript Worker für Notion

Dieser Worker holt automatisch das Transkript eines YouTube-Videos und fügt es als Toggle-Block in eine Notion-Seite ein. Perfekt, um Video-Inhalte in deine Wissensdatenbank zu bekommen, ohne sie selber abtippen oder durchklicken zu müssen.

**Was du am Ende hast:** Ein Custom Agent in Notion, dem du auf einer Ressourcen-Seite mit hinterlegter YouTube-URL nur "Transkript holen" sagen musst — und Sekunden später ist das komplette Transkript in der Seite.

---

## Was du vorher brauchst

Bevor du loslegst, besorg dir drei Dinge:

1. **Einen Supadata-Account** (kostenloser Tarif reicht zum Testen)
   - Geh auf https://supadata.ai und registriere dich
   - Im Dashboard findest du deinen persönlichen **API-Key** — den brauchst du gleich
   - Der kostenlose Tarif hat ein monatliches Kontingent; für mehr Transkripte gibt's bezahlte Pläne

2. **Node.js auf deinem Rechner** (Version 22 oder höher)
   - Prüfe, ob du es schon hast: Öffne das Terminal und tippe `node --version`. Wenn eine Zahl größer als `v22.0.0` kommt, bist du fertig.
   - Falls nicht: Auf https://nodejs.org die LTS-Version runterladen und installieren

3. **Git** (für den Download aus dem Repository)
   - Prüfe: `git --version` im Terminal
   - Falls nicht da: Auf https://git-scm.com runterladen und installieren

> **Keine Angst vor dem Terminal**: Du musst für diese Einrichtung ein paar Befehle kopieren und einfügen. Das war's. Du musst nichts selbst programmieren.

---

## Schritt-für-Schritt-Anleitung

### Schritt 1: Notion CLI installieren (einmalig)

Die Notion CLI (`ntn`) ist das Werkzeug, mit dem du den Worker in deinen Notion-Workspace hochlädst.

Öffne das Terminal und führe aus:

```bash
npm install -g ntn
```

Danach prüfe, ob es geklappt hat:

```bash
ntn --version
```

Sollte eine Versionsnummer anzeigen. Wenn nicht, Terminal einmal neu öffnen und nochmal probieren.

### Schritt 2: Worker-Projekt herunterladen

Geh im Terminal in den Ordner, in dem du das Projekt ablegen möchtest (z.B. Desktop):

```bash
cd ~/Desktop
```

Lade das Repository herunter:

```bash
git clone <REPO-URL-EINFUEGEN> transkript-worker
cd transkript-worker
```

(Ersetze `<REPO-URL-EINFUEGEN>` durch die URL, die du aus der Agent Mastery bekommen hast.)

### Schritt 3: Abhängigkeiten installieren

Immer noch im `transkript-worker`-Ordner, führe aus:

```bash
npm install
```

Das dauert ein paar Sekunden und installiert alle benötigten Helfer-Pakete.

### Schritt 4: Deinen Supadata-Key eintragen

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
4. Er setzt den Status der Seite auf **"Bereit für Tina"** (falls diese Option in deiner Status-Property existiert — sonst ignoriert er das einfach)

---

## Häufige Stolpersteine

**"Command not found: ntn" nach `npm install -g ntn`:**
Terminal einmal komplett schließen und neu öffnen. Das aktualisiert den Pfad zu frisch installierten Tools.

**"Keine URL in den Properties dieser Seite gefunden":**
Deine Seite hat keine URL-Property oder die Property ist leer. Leg eine URL-Property an und trag die YouTube-URL ein.

**"Kein Transkript für dieses Video verfügbar":**
Das Video hat keine Untertitel (weder manuell noch automatisch generiert). Kommt selten vor, aber passiert.

**"Ungültige pageId":**
Der Agent hat dem Tool keine echte Notion-URL übergeben. Trigger den Agent nochmal — oft klappt's beim zweiten Versuch. Wenn nicht, stell sicher, dass du den oben gezeigten Agent-Prompt genau so übernommen hast.

**Status wird nicht auf "Bereit für Tina" gesetzt:**
Deine Ressourcen-DB hat entweder keine Status-Property oder keine Option mit genau diesem Namen. Der Worker ignoriert das dann einfach — das Transkript wird trotzdem eingefügt. Wenn du den Status-Flow haben willst, leg die Option "Bereit für Tina" in deiner Status-Property an.

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

# A GUI-based Editor for Plate Diagrams

Ein webbasierter Editor zur Erstellung und Bearbeitung von Plate-Diagrammen für Multilevel-Bayesian-Inference-Modelle.

Entwickelt als Forschungspraktikum (FoPra) an der Universität.

---

## Features

- **Diagrammerstellung** – Knoten (beobachtet, unbeobachtet, deterministisch), Kanten und Plates erstellen
- **Drag & Drop** – Elemente frei auf dem Canvas verschieben
- **Sampling-Statement Generierung** – Automatische Generierung von Sampling Statements basierend auf dem Diagramm
- **JSON Export/Import** – Projekte speichern und wieder laden
- **SVG Export** – Diagramme als SVG-Datei exportieren
- **Undo/Redo** – Änderungen rückgängig machen und wiederherstellen
- **Zoom & Pan** – Ansicht vergrößern, verkleinern und verschieben
- **Properties Panel** – Eigenschaften von Knoten und Kanten bearbeiten
- **Farbliche Anpassung** – Farbe der Knoten individuell anpassen

---

## Voraussetzungen

Stelle sicher, dass folgendes auf deinem System installiert ist:

- [Node.js](https://nodejs.org/) (getestet mit Version v24.11.1)
- npm (wird automatisch mit Node.js installiert)

---

## Installation & Starten

1. **Repository klonen**
   ```bash
   git clone <https://gitlab.uni-marburg.de/almoukdh/plate-diagram-editor.git>
   cd <plate-diagram-editor>
   ```

2. **Abhängigkeiten installieren**
   ```bash
   npm install
   ```

3. **App starten**
   ```bash
   npm start
   ```

Die App öffnet sich automatisch im Browser unter `http://localhost:3000`.

---

## Benutzungsanleitung

### Knoten erstellen
Wähle in der **Sidebar** den gewünschten Knotentyp aus (beobachtet, unbeobachtet oder deterministisch) und klicke auf den Canvas, um ihn zu platzieren.

### Kanten erstellen
Klicke auf einen Knoten und ziehe die Maus zu einem anderen Knoten, um eine Verbindung (Kante) zu erstellen.

### Plate erstellen
Wähle das Plate-Werkzeug in der **Toolbar** aus und zeichne einen Rahmen um die gewünschten Knoten auf dem Canvas.

### Eigenschaften bearbeiten
Klicke auf ein Element (Knoten, Kante oder Plate), um im **Properties Panel** auf der rechten Seite seine Eigenschaften (z.B. Label, Verteilung) zu bearbeiten.

### Sampling Statements anzeigen
Klicke auf den entsprechenden Button, um die automatisch generierten Sampling Statements für das aktuelle Diagramm anzuzeigen.

### Projekt speichern (JSON Export)
Klicke in der **Toolbar** auf *Exportieren* → *JSON*, um das Projekt als `.json`-Datei herunterzuladen.

### Projekt laden (JSON Import)
Klicke auf *Laden* und wähle eine zuvor gespeicherte `.json`-Datei aus.

### SVG Export
Klicke auf *Exportieren* → *SVG*, um das Diagramm als `.svg`-Datei herunterzuladen.

---

## Architektur (Entwicklerhinweise)

Das Projekt ist eine reine **Client-Side React + TypeScript** Anwendung ohne Backend. Die Visualisierung erfolgt über **SVG**.

### Projektstruktur

```
src/
├── App.tsx                  # Hauptkomponente, globaler State
├── Canvas.tsx               # Zeichenfläche (SVG-Canvas)
├── Node.tsx                 # Knoten-Komponente
├── Edge.tsx                 # Kanten-Komponente
├── Plate.tsx                # Plate-Komponente
├── Toolbar.tsx              # Werkzeugleiste oben
├── Sidebar.tsx              # Seitenleiste mit Elementen
├── Header.tsx               # Kopfzeile
├── NodePropertiesPanel.tsx  # Properties Panel (rechts)
├── StatementPanel.tsx       # Sampling Statements Panel
├── exportUtils.ts           # Hilfsfunktionen für JSON/SVG Export
└── index.tsx                # Einstiegspunkt der App
```

### Tech Stack

| Technologie | Verwendung |
|-------------|------------|
| React       | UI-Framework |
| TypeScript  | Typsicherheit |
| SVG         | Diagramm-Visualisierung |
| npm         | Paketverwaltung |

---

## Browser-Kompatibilität

| Browser | Support |
|---------|---------|
| Chrome  |  Vollständig |
| Firefox |  Vollständig |
| Edge    |  Eingeschränkt |
| Safari  |  Eingeschränkt |

> Die App ist für **Desktop-Nutzung** optimiert. Mobile Geräte werden nicht unterstützt.

---

## Beispiel-Diagramme

Im Ordner `examples/` befinden sich fertige Beispiel-Diagramme als `.json`-Dateien, die direkt in den Editor geladen werden können. Um ein Beispiel zu öffnen: App starten → *Laden* klicken → gewünschte `.json`-Datei auswählen.

| Datei | Vorschau |
|-------|---------|
| `example 1/example 1.json` | ![example_1](examples/example%201/example%201.png) |
| `example 2/Main_Example.json` | ![Main_Example](examples/example%202/Main_Example.png) |
| `example 3/Main_Example_color.json` | ![Main_Example_color](examples/example%203/Main_Example_color.png) |
| `example 4/example 4.json` | ![example_4](examples/example%204/example%204.png) |
| `example 5/example 5.json` | ![example_5](examples/example%205/example%205.png) |
| `example 6/example 6.json` | ![example_6](examples/example%206/example%206.png) |

---

## Bekannte Limitierungen

- Tiefstellung von Buchstaben in Sampling Statements eingeschränkt: Unicode unterstützt nicht alle Buchstaben als Tiefstellung, dadurch funktioniert das Kopieren der Statements nur teilweise
- Kein automatisches Layout (Elemente müssen manuell positioniert werden)
- Grid-Snapping nicht implementiert (Platzhalter vorhanden, aber Funktionalität fehlt)
- Kein LaTeX-Syntax Support für Labels


---

## Autor

**Haneen Almoukdad**  
Fortgeschrittenenpraktikum – B.Sc. Data Science  
Betreuer: Prof. Dr. J. Tunnermann, M.Sc. Teresa Dreyer, Prof. Dr. C. Bockisch

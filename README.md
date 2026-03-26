# A GUI-based Editor for Plate Diagrams

Ein webbasierter Editor zur Erstellung und Bearbeitung von Plate-Diagrammen für Multilevel-Bayesian-Inference-Modelle.

Entwickelt als Fortgeschrittenenpraktikum (FoPra) an der Philipps-Universität Marburg.

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

### Dateioperationen

**Neues Projekt** – Klicke auf *New* in der Toolbar, um ein neues leeres Diagramm zu erstellen.

**Projekt speichern** – Klicke auf *Save*, um das aktuelle Projekt als `.json`-Datei herunterzuladen.

**Projekt laden** – Klicke auf *Load* und wähle eine zuvor gespeicherte `.json`-Datei aus.

**Export als PNG** – Klicke auf *Export* → *Export as PNG*, um das Diagramm als `.png`-Datei herunterzuladen.

**Export als SVG** – Klicke auf *Export* → *Export as SVG*, um das Diagramm als `.svg`-Datei herunterzuladen.

---

### Elemente erstellen

**Knoten erstellen** – Wähle in der **Sidebar** den gewünschten Knotentyp aus und klicke auf den Canvas, um ihn zu platzieren. Verfügbare Typen:
- **Observed** – beobachteter Knoten (gefüllter Kreis oder Quadrat)
- **Latent** – unbeobachteter Knoten (leerer Kreis)
- **Deterministic** – deterministischer Knoten (doppelter Kreis)
- **Constant** – konstanter Knoten

**Kanten erstellen** – Klicke auf einen Knoten und ziehe die Maus zu einem anderen Knoten, um eine Verbindung zu erstellen.

**Plate erstellen** – Wähle das Plate-Werkzeug in der **Toolbar** aus und zeichne einen Rahmen um die gewünschten Knoten auf dem Canvas.

---

### Eigenschaften

**Label bearbeiten** – Klicke auf einen Knoten und gib im **Properties Panel** unter *Variable Name* das gewünschte Label ein. Über den **Ω-Button** neben dem Eingabefeld öffnet sich ein Popover mit drei Bereichen:
- **Variablen**: griechische Buchstaben (θ, μ, σ, λ, α, β, γ, δ, φ, ψ, ω, π, ε, η, ν, κ, τ, ρ)
- **Tiefgestellt**: Ziffern und ausgewählte Buchstaben (₀–₉, ₐ, ₑ, ᵢ, ₒ, ᵤ, ₙ, ₖ, ₘ, ₚ, ₛ, ₜ, ₓ)
- **Hochgestellt**: Ziffern und ausgewählte Buchstaben (⁰–⁹, ᵃ, ᵇ, ᶜ, ᵈ, ᵉ, ⁱ, ʲ, ᵏ, ⁿ, ᵒ, ᵖ, ˢ, ᵗ, ˣ)

**Plate-Index bearbeiten** – Klicke auf eine Plate und gib im **Properties Panel** unter *Index* den gewünschten Index ein (z.B. `i`, `j`, `N`). Der Index wird in der unteren rechten Ecke der Plate angezeigt. Über den **Ω-Button** öffnet sich ein Popover mit vier Bereichen:
- **Variablen**: griechische Buchstaben (θ, μ, σ, ...)
- **Indizes**: häufig verwendete Indexbuchstaben (i, j, k, n, N, t, s, p, m, T, S, K)
- **Tiefgestellt**: Ziffern und ausgewählte Buchstaben (₀–₉, ₐ, ₑ, ᵢ, ₒ, ᵤ, ₙ, ₖ, ₘ, ₚ, ₛ, ₜ, ₓ)
- **Hochgestellt**: Ziffern und ausgewählte Buchstaben (⁰–⁹, ᵃ, ᵇ, ᶜ, ᵈ, ᵉ, ⁱ, ʲ, ᵏ, ⁿ, ᵒ, ᵖ, ˢ, ᵗ, ˣ)

**Füllfarbe anpassen** – Klicke auf einen Knoten und wähle im **Properties Panel** unter *Füllfarbe* eine der vordefinierten Farben aus der Farbpalette. Alternativ kann über *Eigene Farbe* ein beliebiger Farbwert gewählt werden. Mit dem *Standard*-Button wird die Farbe auf den Typ-Standard zurückgesetzt.

**Sampling Statement eingeben** – Klicke auf einen Knoten und gib im **Properties Panel** unter *Sampling Statement* das gewünschte Statement manuell ein. Dabei gilt:
- Für **stochastische** Knoten: `~` (z.B. `θ ~ Normal(μ = 0, σ = 1)`)
- Für **deterministische** Knoten: `←` (z.B. `δ ← θ₁ - θ₂`)

Über den **Ω-Button** neben dem Eingabefeld öffnet sich ein Popover mit drei Bereichen:
- **Variablen**: griechische Buchstaben (θ, μ, σ, ...)
- **Tiefgestellt**: Ziffern und ausgewählte Buchstaben (₀–₉, ₐ, ₑ, ᵢ, ₒ, ᵤ, ₙ, ₖ, ₘ, ₚ, ₛ, ₜ, ₓ)
- **Hochgestellt**: Ziffern und ausgewählte Buchstaben (⁰–⁹, ᵃ, ᵇ, ᶜ, ᵈ, ᵉ, ⁱ, ʲ, ᵏ, ⁿ, ᵒ, ᵖ, ˢ, ᵗ, ˣ) Über den **Examples-Button** öffnet sich eine Liste mit vordefinierten Beispiel-Statements, die als Vorlage übernommen werden können:

| Statement | Verteilung |
|-----------|-----------|
| `θ ~ Beta(α = 1, β = 1)` | Beta-Verteilung (Prior) |
| `μ ~ Normal(μ = 0, σ = 1)` | Normalverteilung |
| `k ~ Binomial(p = θ, n = n)` | Binomialverteilung |
| `σ ~ Uniform(a = 0, b = 10)` | Gleichverteilung |
| `λ ~ Gamma(α = 2, β = 1)` | Gamma-Verteilung |
| `x ~ Poisson(λ = λ)` | Poisson-Verteilung |
| `δ ← θ₁ - θ₂` | Deterministisch (Differenz) |
| `y ~ StudentT(ν = ν)` | Student-t-Verteilung |

Ein Klick auf ein Beispiel übernimmt es automatisch und ersetzt den ersten Buchstaben durch das Label des ausgewählten Knotens.

---

### Werkzeuge

**Select-Tool** – Wähle das Select-Tool in der Toolbar aus, um Elemente auf dem Canvas auszuwählen und zu verschieben (Drag & Drop).

**Zoom In / Zoom Out** – Verwende die Zoom-Buttons in der Toolbar, um die Ansicht zu vergrößern oder zu verkleinern.

**Pan (Ansicht verschieben)** – *(wird noch ergänzt)*

**Undo** – Klicke auf den Undo-Button in der Toolbar oder drücke `Strg+Z`, um die letzte Aktion rückgängig zu machen.

**Redo** – Klicke auf den Redo-Button in der Toolbar oder drücke `Strg+Y`, um eine rückgängig gemachte Aktion wiederherzustellen.

**Löschen** – Wähle ein Element aus und klicke auf den Löschen-Button, um es zu löschen.

**Sampling Statements anzeigen** – Im **Sampling Statement Panel** werden automatisch alle generierten Sampling Statements für alle Knoten des aktuellen Diagramms angezeigt. Über den **Copy All**-Button können alle Statements auf einmal in die Zwischenablage kopiert werden.


---

## Architektur (Entwicklerhinweise)

Das Projekt ist eine reine **Client-Side React + TypeScript** Anwendung ohne Backend. Die Visualisierung erfolgt über **SVG**.

### Projektstruktur

```
PLATE-DIAGRAM-EDITOR/
├── docs/                                
│   ├── ICD_Plate_Diagram_Editor.pdf
│   ├── Software_Requirements_Specification.pdf
│   └── Testdokumentation_Plate_Diagram_Editor.pdf
├── examples/                            # Beispiel-Diagramme (JSON, SVG, PNG)
├── public/
│   ├── index.html                       # HTML-Einstiegspunkt
│   ├── manifest.json                    # Web-App Manifest
│   └── robots.txt
├── src/
│   ├── components/
│   │   ├── Canvas/
│   │   │   ├── Canvas.tsx               # Zeichenfläche (SVG-Canvas)
│   │   │   ├── Edge.tsx                 # Kanten-Komponente
│   │   │   ├── Node.tsx                 # Knoten-Komponente
│   │   │   └── Plate.tsx                # Plate-Komponente
│   │   ├── Header/
│   │   │   ├── Header.tsx               # Kopfzeile mit Projektname
│   │   │   └── Header.css
│   │   ├── NodePropertiesPanel/
│   │   │   ├── NodePropertiesPanel.tsx  # Properties Panel (Label, Farbe, Sampling Statement)
│   │   │   └── NodePropertiesPanel.css
│   │   ├── Sidebar/
│   │   │   ├── Sidebar.tsx              # Seitenleiste zum Erstellen von Elementen
│   │   │   └── Sidebar.css
│   │   ├── StatementPanel/
│   │   │   ├── StatementPanel.tsx       # Panel für generierte Sampling Statements
│   │   │   └── StatementPanel.css
│   │   └── Toolbar/
│   │       ├── Toolbar.tsx              # Werkzeugleiste (Zoom, Undo/Redo, Export, etc.)
│   │       └── Toolbar.css
│   ├── types/
│   │   └── index.ts                     # Typen und Datenmodell (DiagramNode, DiagramEdge, etc.)
│   ├── utils/
│   │   └── exportUtils.ts               # Hilfsfunktionen für PNG/SVG/JSON Export
│   ├── App.tsx                          # Hauptkomponente, globaler State, Undo/Redo-Logik
│   ├── App.css
│   └── index.tsx                        # Einstiegspunkt der App
├── .gitignore
├── package.json
├── package-lock.json
└── README.md
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

- **Tiefgestellte griechische Buchstaben nicht verfügbar** – Unicode enthält keine tiefgestellten griechischen Buchstaben (z.B. ist `θᵢ` mit griechischem Index nicht darstellbar). Tiefstellung ist nur für Ziffern und eine begrenzte Auswahl lateinischer Buchstaben möglich (z.B. `θ₁`, `θₙ`).
- **Zoom nur über Toolbar-Buttons** – Ein Zoom per Mausrad ist nicht implementiert; die Ansicht lässt sich ausschließlich über die Zoom-In/Zoom-Out-Buttons in der Toolbar anpassen.
- **Performance-Grenze bei ca. 40 Knoten** – Die Anwendung ist für Diagramme mit bis zu 40 Knoten optimiert. Bei größeren Diagrammen können spürbare Performance-Einbußen auftreten.
- **Eingeschränkte Browser-Unterstützung** – Die App ist vollständig für Chrome und Firefox getestet. Edge und Safari werden nur eingeschränkt unterstützt.
- **Mobile Geräte nicht unterstützt** – Die App ist ausschließlich für die Desktop-Nutzung ausgelegt; Touch-Eingabe und kleine Bildschirme werden nicht berücksichtigt.

---

## Nice to Have

- **Grid-Snapping** – Knoten und Plates rasten beim Verschieben automatisch an einem konfigurierbaren Raster ein. Button und Zustand (`gridSnappingEnabled`) sind bereits vorhanden; die Snap-Logik selbst fehlt noch (siehe *Erweiterungshinweise für Entwickler*).
- **Automatisches Layout** – Elemente werden automatisch angeordnet, sodass manuelle Positionierung entfällt.
- **LaTeX-Syntax für griechische Buchstaben** – Labels und Sampling Statements könnten als LaTeX-Ausdrücke eingegeben und gerendert werden (z.B. `\theta` → θ).
- **Export als LaTeX** – Das fertige Diagramm könnte direkt als LaTeX-Code (z.B. mit dem Paket `tikz`) exportiert werden, um es in wissenschaftliche Dokumente einzubetten.
- **Auswahl der Reihenfolge von Sampling Statements** – Im Statement Panel könnten Nutzer die Anzeigereihenfolge der generierten Statements manuell festlegen oder per Drag & Drop umsortieren.
- **Mehrfachauswahl per Rechteck** – Durch Aufziehen eines Auswahlrahmens könnten mehrere Elemente gleichzeitig selektiert und verschoben werden.

---

## Erweiterungshinweise für Entwickler

### Grid-Snapping weiterführen

Der Zustand und der Toggle-Button für Grid-Snapping sind bereits vollständig vorhanden, aber die Logik, die Positionen tatsächlich einrastet, fehlt noch. Die folgenden Stellen müssen ergänzt werden:

**1. `src/components/Toolbar/Toolbar.tsx` – Button existiert bereits (Zeilen 212–219)**

```tsx
// Grid-Snapping-Button ist vorhanden und gibt gridSnappingEnabled + onToggleGridSnapping weiter.
// Keine Änderung hier nötig.
<button
  className={`toolbar-btn icon-only ${gridSnappingEnabled ? 'active' : ''}`}
  onClick={onToggleGridSnapping}
  title="Grid-Snapping ein/aus"
>
  <Grid3X3 size={ICON_SIZE} />
</button>
```

**2. `src/components/Canvas/Canvas.tsx` – Hier muss die Snap-Logik eingebaut werden**

Eine Hilfsfunktion `snapToGrid` einfügen (z.B. nach `generateId`, ca. Zeile 177):

```tsx
const GRID_SIZE = 20; // Rastergröße in SVG-Einheiten

const snapToGrid = (value: number): number => {
  return Math.round(value / GRID_SIZE) * GRID_SIZE;
};
```

Dann an **drei Stellen** im Canvas die rohen Koordinaten durch gerundete Werte ersetzen, wenn `gridSnappingEnabled` aktiv ist:

- **Knoten platzieren** (`handleCanvasClick`, ca. Zeile 200–210): `x: pos.x` → `x: gridSnappingEnabled ? snapToGrid(pos.x) : pos.x`
- **Knoten verschieben** (`handleMouseMove`, ca. Zeile 431–434): `x: start.x + totalDeltaX` → mit `snapToGrid(...)` wrappen
- **Plate verschieben** (`handleMouseMove`, ca. Zeile 441–447): analog für Plate-Koordinaten

Damit `gridSnappingEnabled` im Canvas bekannt ist, muss es als Prop übergeben werden:

```tsx
// In CanvasProps (ca. Zeile 12) ergänzen:
gridSnappingEnabled: boolean;

// In App.tsx beim Canvas-Aufruf:
<Canvas gridSnappingEnabled={gridSnappingEnabled} ... />
```

---

### Neue Knotentypen oder Sidebar-Elemente hinzufügen

Um einen neuen Knotentyp (z.B. „Factor Node") zur Sidebar und zum Canvas hinzuzufügen, sind Änderungen in **drei Dateien** nötig:

**1. `src/types/index.ts` – Neuen Typ registrieren**

```ts
// ToolType erweitern (ca. Zeile 13):
export type ToolType =
  | 'select'
  | 'node-observed'
  | 'node-unobserved'
  | 'node-deterministic'
  | 'node-square'
  | 'node-factor'   // ← NEU
  | 'edge'
  | 'plate';
```

**2. `src/components/Sidebar/Sidebar.tsx` – Button in der Sidebar ergänzen (nach Zeile 88)**

```tsx
<button
  className={`sidebar-button ${selectedTool === 'node-factor' ? 'selected' : ''}`}
  onClick={() => onToolSelect('node-factor')}
  title="Faktor-Knoten"
>
  <Diamond size={ICON_SIZE} className="sidebar-icon" />
  <span className="sidebar-button-label">Factor</span>
</button>
```

**3. `src/components/Canvas/Canvas.tsx` – Switch-Case ergänzen (ca. Zeile 193)**

```tsx
case 'node-factor': nodeType = 'observed'; nodeShape = 'circle'; break; // Anpassen nach Bedarf
```

Für rein optische Unterschiede (z.B. Rautenform) muss zusätzlich `src/components/Canvas/Node.tsx` angepasst werden, wo die SVG-Form des Knotens gerendert wird.

---

### Neue Toolbar-Schaltfläche hinzufügen

Neue Buttons kommen in `src/components/Toolbar/Toolbar.tsx`. Das Muster ist immer dasselbe:

1. Callback als Prop im `ToolbarProps`-Interface deklarieren (ca. Zeile 26–45).
2. Button in der gewünschten `toolbar-group` ergänzen (nach dem Muster der bestehenden Buttons).
3. Den Callback in `App.tsx` definieren und als Prop an `<Toolbar>` übergeben.

---

## Autor

**Haneen Almoukdad**  
Fortgeschrittenenpraktikum – B.Sc. Data Science  
Betreuer: Prof. Dr. J. Tunnermann, M.Sc. Teresa Dreyer, Prof. Dr. C. Bockisch

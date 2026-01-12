// ===========================================
// DATENMODELL FÜR DEN PLATE DIAGRAM EDITOR
// ===========================================
// Diese Datei definiert die "Formen" unserer Daten.

// ----- KNOTEN-TYPEN -----
export type NodeType = 'observed' | 'unobserved' | 'deterministic';

// Ein Knoten kann rund oder quadratisch sein
export type NodeShape = 'circle' | 'square';

// ----- WERKZEUG-TYPEN -----
export type ToolType = 
  | 'select'
  | 'node-observed'
  | 'node-unobserved'
  | 'node-deterministic'
  | 'node-square'
  | 'edge'
  | 'plate';

// ----- HAUPTSTRUKTUREN -----

// Ein Knoten im Diagramm
// GEÄNDERT: samplingStatement statt distribution + distributionParams
export interface DiagramNode {
  id: string;
  x: number;
  y: number;
  label: string;
  type: NodeType;
  shape: NodeShape;
  samplingStatement: string;  // z.B. "θ ~ Normal(μ = 0, σ = 1)"
  plateId: string | null;
}

// Eine Kante (Verbindung zwischen zwei Knoten)
export interface DiagramEdge {
  id: string;
  fromNodeId: string;
  toNodeId: string;
}

// Ein Plate (rechteckiger Bereich für Wiederholungen)
export interface DiagramPlate {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  parentPlateId: string | null;
}

// ----- PROJEKT-ZUSTAND -----
export interface DiagramState {
  projectName: string;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  plates: DiagramPlate[];
  selectedTool: ToolType;
  selectedElementIds: string[];
  zoomLevel: number;
}

// ----- HILFSFUNKTION -----
export const createEmptyDiagramState = (): DiagramState => ({
  projectName: 'Current Project',
  nodes: [],
  edges: [],
  plates: [],
  selectedTool: 'select',
  selectedElementIds: [],
  zoomLevel: 1,
});

// ----- BEISPIEL-STATEMENTS -----
// Mit expliziten Parameternamen für publikationsreife Darstellung
// Format: Variable ~ Verteilung(Parameter = Wert, ...)
export const EXAMPLE_STATEMENTS = [
  { statement: 'θ ~ Beta(α = 1, β = 1)', description: 'Beta-Verteilung (Prior)' },
  { statement: 'μ ~ Normal(μ = 0, σ = 1)', description: 'Normalverteilung' },
  { statement: 'k ~ Binomial(p = θ, n = n)', description: 'Binomialverteilung' },
  { statement: 'σ ~ Uniform(a = 0, b = 10)', description: 'Gleichverteilung' },
  { statement: 'λ ~ Gamma(α = 2, β = 1)', description: 'Gamma-Verteilung' },
  { statement: 'x ~ Poisson(λ = λ)', description: 'Poisson-Verteilung' },
  { statement: 'δ ← θ₁ - θ₂', description: 'Deterministisch (Differenz)' },
  { statement: 'y ~ StudentT(ν = ν)', description: 'Student-t-Verteilung' },
];
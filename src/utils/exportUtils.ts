// ===== EXPORT UTILITIES =====
// Diese Datei enthält alle Funktionen zum Exportieren des Diagramms als Bild.
// 
// HINTERGRUND:
// In wissenschaftlichen Publikationen werden Plate-Diagramme oft als Bilder
// eingebunden. Wir unterstützen zwei Formate:
// - PNG: Rastergrafik, universell nutzbar (Word, PowerPoint, etc.)
// - SVG: Vektorgrafik, skalierbar ohne Qualitätsverlust (ideal für LaTeX)

import { DiagramNode, DiagramEdge, DiagramPlate } from '../types/index';

// ===== TYPEN =====
export type ExportFormat = 'png' | 'svg';

interface ExportOptions {
  format: ExportFormat;
  includeStatements: boolean;  // Sollen Sampling Statements mit exportiert werden?
  backgroundColor: string;      // Hintergrundfarbe (z.B. 'white' oder 'transparent')
  scale: number;               // Skalierungsfaktor für PNG (z.B. 2 für höhere Auflösung)
}

// ===== HILFSFUNKTIONEN =====

/**
 * Generiert die Sampling Statements aus den Diagramm-Daten.
 * Verwendet den Free-Text-Ansatz: Jeder Node hat ein samplingStatement-Feld.
 */
function generateStatements(nodes: DiagramNode[], _edges: DiagramEdge[]): string[] {
  const statements: string[] = [];
  
  console.log('=== EXPORT: Sammle Statements ===');
  console.log('Anzahl Knoten:', nodes.length);
  
  nodes.forEach(node => {
    console.log(`Knoten "${node.label}": samplingStatement = "${node.samplingStatement}"`);
    
    // Prüfe ob der Node ein Sampling Statement hat
    if (node.samplingStatement && node.samplingStatement.trim() !== '') {
      statements.push(node.samplingStatement.trim());
    }
  });
  
  console.log('Gesammelte Statements:', statements);
  return statements;
}

/**
 * Berechnet die Bounding Box aller Elemente im Diagramm.
 * Das brauchen wir, um das SVG auf die richtige Größe zu schneiden.
 */
function calculateBoundingBox(
  nodes: DiagramNode[],
  plates: DiagramPlate[]
): { minX: number; minY: number; maxX: number; maxY: number } {
  // Starte mit maximalen/minimalen Werten
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  
  const NODE_RADIUS = 22;  // Aus Node.tsx
  
  // Berücksichtige alle Knoten
  nodes.forEach(node => {
    minX = Math.min(minX, node.x - NODE_RADIUS);
    minY = Math.min(minY, node.y - NODE_RADIUS);
    maxX = Math.max(maxX, node.x + NODE_RADIUS);
    maxY = Math.max(maxY, node.y + NODE_RADIUS);
  });
  
  // Berücksichtige alle Plates
  plates.forEach(plate => {
    minX = Math.min(minX, plate.x);
    minY = Math.min(minY, plate.y);
    maxX = Math.max(maxX, plate.x + plate.width);
    maxY = Math.max(maxY, plate.y + plate.height);
  });
  
  // Falls keine Elemente vorhanden sind, setze Standardwerte
  if (minX === Infinity) {
    minX = 0;
    minY = 0;
    maxX = 200;
    maxY = 150;
  }
  
  return { minX, minY, maxX, maxY };
}

/**
 * Erstellt ein neues SVG-Element, das das Diagramm und optional
 * die Sampling Statements enthält.
 */
function createExportSVG(
  originalSvg: SVGSVGElement,
  nodes: DiagramNode[],
  edges: DiagramEdge[],
  plates: DiagramPlate[],
  options: ExportOptions
): SVGSVGElement {
  // 1. Berechne die Bounding Box des Diagramms
  const bbox = calculateBoundingBox(nodes, plates);
  const padding = 30;  // Abstand zum Rand
  
  // 2. Berechne Dimensionen
  const diagramWidth = bbox.maxX - bbox.minX + padding * 2;
  const diagramHeight = bbox.maxY - bbox.minY + padding * 2;
  
  // 3. Generiere Statements wenn gewünscht
  const statements = options.includeStatements 
    ? generateStatements(nodes, edges) 
    : [];
  
  // 4. Berechne Statement-Bereich
  const statementWidth = statements.length > 0 ? 280 : 0;
  const lineHeight = 22;
  const statementHeight = statements.length * lineHeight + 20;
  
  // 5. Gesamtgröße berechnen
  const totalWidth = diagramWidth + statementWidth;
  const totalHeight = Math.max(diagramHeight, statementHeight);
  
  // 6. Neues SVG erstellen
  const exportSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  exportSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  exportSvg.setAttribute('width', String(totalWidth));
  exportSvg.setAttribute('height', String(totalHeight));
  exportSvg.setAttribute('viewBox', `0 0 ${totalWidth} ${totalHeight}`);
  
  // 7. Hintergrund hinzufügen
  const background = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  background.setAttribute('width', '100%');
  background.setAttribute('height', '100%');
  background.setAttribute('fill', options.backgroundColor);
  exportSvg.appendChild(background);
  
  // 8. Diagramm-Gruppe erstellen und verschieben
  const diagramGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  diagramGroup.setAttribute('transform', `translate(${padding - bbox.minX}, ${padding - bbox.minY})`);
  
  // 9. Original-SVG-Inhalt klonen (nur die relevanten Teile)
  // Klone die defs (für Arrowheads)
  const originalDefs = originalSvg.querySelector('defs');
  if (originalDefs) {
    exportSvg.appendChild(originalDefs.cloneNode(true));
  }
  
  // ===== KORRIGIERT: Klone alle Plates, Edges und Nodes =====
  // WICHTIG: Die Klasse heißt "plate", nicht "plate-group"!
  // Wir suchen jetzt nach:
  // - .plate (für Plates)
  // - .edge (für Kanten)  
  // - .node (für Knoten)
  // - g (als Fallback für gruppierte Elemente)
  const elementsToClone = originalSvg.querySelectorAll('.plate, .edge, .node');
  
  elementsToClone.forEach(element => {
    const clonedElement = element.cloneNode(true) as SVGElement;
    
    // Entferne Selection-Styling für den Export (blaue Farbe → grau)
    clonedElement.querySelectorAll('[stroke="#4299e1"]').forEach(el => {
      el.setAttribute('stroke', '#4a5568');
    });
    
    // Entferne auch die Resize-Handles (die kleinen Quadrate an den Ecken)
    // Diese sollen nicht im Export erscheinen
    const resizeHandles = clonedElement.querySelectorAll('rect[style*="resize"]');
    resizeHandles.forEach(handle => handle.remove());
    
    diagramGroup.appendChild(clonedElement);
  });
  
  // ===== VERBESSERTER FALLBACK =====
  // Falls keine Elemente mit Klassen gefunden wurden, 
  // klone alles außer Hintergrund, Hints und Auswahlrechteck
  if (diagramGroup.children.length === 0) {
    console.log('Fallback: Klone alle SVG-Kinder');
    
    Array.from(originalSvg.children).forEach(child => {
      const tagName = child.tagName.toLowerCase();
      
      // Überspringe bereits geklonte defs
      if (tagName === 'defs') return;
      
      // Überspringe den Hintergrund
      if (child.classList?.contains('canvas-background')) return;
      
      // Überspringe reine Text-Elemente (Hints), aber NICHT Node-Labels
      if (tagName === 'text') {
        // Node-Labels haben normalerweise bestimmte Positionen
        // Hints sind zentriert bei x=400
        const xAttr = child.getAttribute('x');
        if (xAttr === '400') return;  // Das ist ein Hint-Text
      }
      
      // Überspringe das Auswahlrechteck (blaues gestricheltes Rechteck)
      if (tagName === 'rect') {
        const fill = child.getAttribute('fill');
        if (fill && fill.includes('rgba(66, 153, 225')) return;
      }
      
      const cloned = child.cloneNode(true) as SVGElement;
      
      // Entferne Selection-Styling
      if (cloned.getAttribute('stroke') === '#4299e1') {
        cloned.setAttribute('stroke', '#4a5568');
      }
      cloned.querySelectorAll('[stroke="#4299e1"]').forEach(el => {
        el.setAttribute('stroke', '#4a5568');
      });
      
      diagramGroup.appendChild(cloned);
    });
  }
  
  exportSvg.appendChild(diagramGroup);
  
  // 10. Sampling Statements hinzufügen
  console.log('=== EXPORT: Statement-Rendering ===');
  console.log('Anzahl Statements:', statements.length);
  console.log('includeStatements Option:', options.includeStatements);
  
  if (statements.length > 0) {
    console.log('Füge Statements zum SVG hinzu...');
    console.log('Position: x =', diagramWidth + 20, ', y =', padding);
    
    const statementsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    statementsGroup.setAttribute('transform', `translate(${diagramWidth + 20}, ${padding})`);
    
    statements.forEach((statement, index) => {
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', '0');
      text.setAttribute('y', String(index * lineHeight + 16));
      text.setAttribute('font-family', "'Times New Roman', serif");
      text.setAttribute('font-size', '14px');
      text.setAttribute('fill', '#000000');  // Explizit schwarze Farbe setzen!
      text.textContent = statement;
      statementsGroup.appendChild(text);
      console.log(`Statement ${index + 1}: "${statement}"`);
    });
    
    exportSvg.appendChild(statementsGroup);
    console.log('Statements erfolgreich hinzugefügt!');
  } else {
    console.log('Keine Statements zum Exportieren vorhanden.');
  }
  
  console.log('=== SVG Dimensionen ===');
  console.log('totalWidth:', totalWidth);
  console.log('totalHeight:', totalHeight);
  
  return exportSvg;
}

/**
 * Konvertiert ein SVG zu PNG mit Canvas.
 */
async function svgToPng(svg: SVGSVGElement, scale: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    // 1. SVG zu String serialisieren
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svg);
    
    // 2. SVG zu Data URL konvertieren
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    
    // 3. Image laden
    const img = new Image();
    img.onload = () => {
      // 4. Canvas erstellen
      const canvas = document.createElement('canvas');
      const width = parseInt(svg.getAttribute('width') || '800');
      const height = parseInt(svg.getAttribute('height') || '600');
      
      canvas.width = width * scale;
      canvas.height = height * scale;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      // 5. Skalieren und zeichnen
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0);
      
      // 6. Zu Blob konvertieren
      canvas.toBlob((blob) => {
        URL.revokeObjectURL(url);
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Could not create PNG blob'));
        }
      }, 'image/png');
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not load SVG image'));
    };
    
    img.src = url;
  });
}

/**
 * Lädt eine Datei herunter.
 */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ===== HAUPT-EXPORT-FUNKTION =====

/**
 * Exportiert das Diagramm als Bild (PNG oder SVG).
 * 
 * @param svgElement - Das SVG-Element des Canvas
 * @param nodes - Alle Knoten im Diagramm
 * @param edges - Alle Kanten im Diagramm
 * @param plates - Alle Plates im Diagramm
 * @param filename - Dateiname ohne Endung
 * @param options - Export-Optionen
 */
export async function exportDiagram(
  svgElement: SVGSVGElement,
  nodes: DiagramNode[],
  edges: DiagramEdge[],
  plates: DiagramPlate[],
  filename: string,
  options: Partial<ExportOptions> = {}
): Promise<void> {
  // Standard-Optionen
  const defaultOptions: ExportOptions = {
    format: 'png',
    includeStatements: true,
    backgroundColor: 'white',
    scale: 2,  // 2x für gute Qualität
  };
  
  const finalOptions = { ...defaultOptions, ...options };
  
  // Erstelle das Export-SVG
  const exportSvg = createExportSVG(
    svgElement,
    nodes,
    edges,
    plates,
    finalOptions
  );
  
  if (finalOptions.format === 'svg') {
    // SVG exportieren
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(exportSvg);
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    downloadBlob(blob, `${filename}.svg`);
  } else {
    // PNG exportieren
    try {
      const pngBlob = await svgToPng(exportSvg, finalOptions.scale);
      downloadBlob(pngBlob, `${filename}.png`);
    } catch (error) {
      console.error('Fehler beim PNG-Export:', error);
      throw error;
    }
  }
}

// ===== VEREINFACHTE EXPORT-FUNKTIONEN =====

/**
 * Exportiert das Diagramm als PNG.
 */
export async function exportAsPng(
  svgElement: SVGSVGElement,
  nodes: DiagramNode[],
  edges: DiagramEdge[],
  plates: DiagramPlate[],
  filename: string = 'plate-diagram'
): Promise<void> {
  return exportDiagram(svgElement, nodes, edges, plates, filename, { format: 'png' });
}

/**
 * Exportiert das Diagramm als SVG.
 */
export async function exportAsSvg(
  svgElement: SVGSVGElement,
  nodes: DiagramNode[],
  edges: DiagramEdge[],
  plates: DiagramPlate[],
  filename: string = 'plate-diagram'
): Promise<void> {
  return exportDiagram(svgElement, nodes, edges, plates, filename, { format: 'svg' });
}
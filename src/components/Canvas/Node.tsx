import React from 'react';
import { DiagramNode } from '../../types';

// ===== NODE KOMPONENTE =====
// Ein einzelner Knoten im Plate-Diagramm.
// Kann verschiedene Formen und Typen haben:
// - observed (gefüllt) / unobserved (leer) / deterministic (doppelter Rand)
// - circle / square

interface NodeProps {
  node: DiagramNode;                           // Die Knoten-Daten
  isSelected: boolean;                         // Ist dieser Knoten ausgewählt?
  isEdgeStart?: boolean;                       // Ist dieser Knoten der Startknoten einer neuen Kante?
  onSelect: (id: string) => void;              // Callback wenn Knoten angeklickt wird
  onDragStart: (id: string, e: React.MouseEvent) => void;  // Drag beginnt
}

const Node: React.FC<NodeProps> = ({ 
  node, 
  isSelected, 
  isEdgeStart = false,  // Default ist false
  onSelect, 
  onDragStart 
}) => {
  // Größe des Knotens
  const size = 22;  // Radius für Kreise, halbe Breite für Quadrate
  
  // ===== FÜLLFARBE =====
  // Priorität: 1. Benutzerdefinierte Farbe (node.fillColor)
  //            2. Lee & Wagenmakers Konvention (typ-basiert)
  //
  // Lee & Wagenmakers (2013) Konventionen:
  //   Observed     → grau gefüllt (schattiert)
  //   Unobserved   → weiß / leer
  //   Deterministic → weiß / leer (doppelter Rand signalisiert den Typ)
  const getDefaultFillColor = (): string => {
    switch (node.type) {
      case 'observed':      return '#a0aec0';  // Grau (schattiert) nach Konvention
      case 'unobserved':    return 'white';     // Leer nach Konvention
      case 'deterministic': return 'white';     // Leer nach Konvention
      default:              return 'white';
    }
  };
  const fillColor = node.fillColor ?? getDefaultFillColor();

  // ===== Dynamische Styling basierend auf Zustand =====
  // Priorität: isEdgeStart > isSelected > normal
  // isEdgeStart verwendet grüne Farbe um anzuzeigen "bereit für Verbindung"
  
  // Strichstärke - Edge-Start und ausgewählte Knoten haben dickeren Rand
  const strokeWidth = (isEdgeStart || isSelected) ? 3 : 2;
  
  // ===== RAHMENFARBE =====
  // Nach Lee & Wagenmakers: immer schwarz/dunkelgrau – keine Benutzerdefinition.
  // Ausnahme: isEdgeStart (grün) und isSelected (blau) für UI-Feedback.
  const getStrokeColor = (): string => {
    if (isEdgeStart) return '#48bb78';
    if (isSelected)  return '#4299e1';
    return '#4a5568';
  };
  const strokeColor = getStrokeColor();

  // ===== EVENT HANDLERS =====
  // WICHTIG: Wir müssen BEIDE Events (mousedown UND click) stoppen,
  // sonst "durchdringt" der Klick zum Canvas!
  
  // MouseDown - für Drag-Operationen
  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();  // Verhindert, dass der Canvas das Event bekommt
    onDragStart(node.id, e);
  };
  
  // Click - für Selektion und Edge-Erstellung
  // DIESE FUNKTION IST ENTSCHEIDEND!
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();  // WICHTIG: Stoppt das Event, bevor es zum Canvas geht
    console.log('🔵 Node.tsx: Click auf Node', node.id);  // Debug
    onSelect(node.id);
  };

  // ----- RENDERING -----
  
  // Kreisförmiger Knoten
  if (node.shape === 'circle') {
    return (
      <g 
        className="node" 
        onMouseDown={handleMouseDown}
        onClick={handleClick}  //  onClick hinzugefügt!
        style={{ cursor: 'pointer' }}
      >
        {/* Glüh-Kreis im Hintergrund wenn Edge-Start */}
        {isEdgeStart && (
          <circle
            cx={node.x}
            cy={node.y}
            r={size + 6}
            fill="none"
            stroke="#48bb78"
            strokeWidth={2}
            strokeDasharray="4,2"
            opacity={0.6}
          />
        )}
        
        {/* Hauptkreis */}
        <circle
          cx={node.x}
          cy={node.y}
          r={size}
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
        />
        
        {/* Zweiter Kreis für deterministische Knoten (doppelter Rand) */}
        {node.type === 'deterministic' && (
          <circle
            cx={node.x}
            cy={node.y}
            r={size - 4}
            fill="none"
            stroke={strokeColor}
            strokeWidth={1}
          />
        )}
        
        {/* Label */}
        <text
          x={node.x}
          y={node.y}
          textAnchor="middle"
          dominantBaseline="central"
          className="node-label"
          style={{
            fontFamily: "'Times New Roman', serif",
            fontSize: '16px',
            fontStyle: 'italic',
            pointerEvents: 'none',  // Text soll keine Maus-Events abfangen
          }}
        >
          {node.label}
        </text>
      </g>
    );
  }
  
  // Quadratischer Knoten
  return (
    <g 
      className="node" 
      onMouseDown={handleMouseDown}
      onClick={handleClick}  //  onClick hinzugefügt!
      style={{ cursor: 'pointer' }}
    >
      {/* Glüh-Rechteck im Hintergrund wenn Edge-Start */}
      {isEdgeStart && (
        <rect
          x={node.x - size - 6}
          y={node.y - size - 6}
          width={(size + 6) * 2}
          height={(size + 6) * 2}
          fill="none"
          stroke="#48bb78"
          strokeWidth={2}
          strokeDasharray="4,2"
          opacity={0.6}
        />
      )}
      
      {/* Hauptquadrat */}
      <rect
        x={node.x - size}
        y={node.y - size}
        width={size * 2}
        height={size * 2}
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
      />
      
      {/* Zweites Quadrat für deterministische Knoten (doppelter Rand) */}
      {node.type === 'deterministic' && (
        <rect
          x={node.x - size + 4}
          y={node.y - size + 4}
          width={(size - 4) * 2}
          height={(size - 4) * 2}
          fill="none"
          stroke={strokeColor}
          strokeWidth={1}
        />
      )}
      
      {/* Label */}
      <text
        x={node.x}
        y={node.y}
        textAnchor="middle"
        dominantBaseline="central"
        className="node-label"
        style={{
          fontFamily: "'Times New Roman', serif",
          fontSize: '16px',
          fontStyle: 'italic',
          pointerEvents: 'none',
        }}
      >
        {node.label}
      </text>
    </g>
  );
};

export default Node;

import React from 'react';
import { DiagramEdge, DiagramNode } from '../../types';

// ===== EDGE KOMPONENTE =====
// Eine gerichtete Kante (Pfeil) zwischen zwei Knoten.
// Die Kante zeigt eine probabilistische Abhängigkeit im Bayesian-Modell.

interface EdgeProps {
  edge: DiagramEdge;                // Die Kanten-Daten
  fromNode: DiagramNode;            // Start-Knoten
  toNode: DiagramNode;              // Ziel-Knoten
  isSelected: boolean;              // Ist diese Kante ausgewählt?
  onSelect: (id: string) => void;   // Callback wenn Kante angeklickt wird
}

const Edge: React.FC<EdgeProps> = ({ edge, fromNode, toNode, isSelected, onSelect }) => {
  // Knoten-Radius (muss mit Node.tsx übereinstimmen)
  const nodeRadius = 22;
  
  // Berechne den Winkel zwischen den beiden Knoten
  const dx = toNode.x - fromNode.x;
  const dy = toNode.y - fromNode.y;
  const angle = Math.atan2(dy, dx);
  
  // Berechne die Länge der Verbindung
  const length = Math.sqrt(dx * dx + dy * dy);
  
  // Start- und Endpunkte: Am Rand der Knoten, nicht im Zentrum
  // So überlappen die Pfeile nicht mit den Knoten
  const startX = fromNode.x + Math.cos(angle) * nodeRadius;
  const startY = fromNode.y + Math.sin(angle) * nodeRadius;
  const endX = toNode.x - Math.cos(angle) * (nodeRadius + 8);  // +8 für Pfeilspitze
  const endY = toNode.y - Math.sin(angle) * (nodeRadius + 8);
  
  // Farben
  const strokeColor = isSelected ? '#4299e1' : '#4a5568';
  const strokeWidth = isSelected ? 2.5 : 1.5;

  // Handler für Klick auf die Kante
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(edge.id);
  };

  return (
    <g className="edge" onClick={handleClick} style={{ cursor: 'pointer' }}>
      {/* Die eigentliche Linie */}
      <line
        x1={startX}
        y1={startY}
        x2={endX}
        y2={endY}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        markerEnd="url(#arrowhead)"  // Referenz zur Pfeilspitzen-Definition
      />
      
      {/* Unsichtbare dickere Linie für einfacheres Klicken */}
      <line
        x1={startX}
        y1={startY}
        x2={endX}
        y2={endY}
        stroke="transparent"
        strokeWidth={10}  // Breiterer Klickbereich
      />
    </g>
  );
};

export default Edge;

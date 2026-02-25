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
  const nodeRadius = 22;
  
  const dx = toNode.x - fromNode.x;
  const dy = toNode.y - fromNode.y;
  const angle = Math.atan2(dy, dx);
  
  const startX = fromNode.x + Math.cos(angle) * nodeRadius;
  const startY = fromNode.y + Math.sin(angle) * nodeRadius;
  const endX = toNode.x - Math.cos(angle) * (nodeRadius + 2);
  const endY = toNode.y - Math.sin(angle) * (nodeRadius + 2);
  
  // Farben nach Lee & Wagenmakers: Kanten sind immer dunkelgrau/schwarz
  const strokeColor = isSelected ? '#4299e1' : '#4a5568';
  const strokeWidth = isSelected ? 2.5 : 1.5;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(edge.id);
  };

  return (
    <g className="edge" onClick={handleClick} style={{ cursor: 'pointer' }}>
      {/* Die eigentliche Linie */}
      <line
        x1={startX} y1={startY}
        x2={endX}   y2={endY}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        markerEnd={isSelected ? 'url(#arrowhead-selected)' : 'url(#arrowhead)'}
      />
      {/* Unsichtbare dickere Linie für einfacheres Klicken */}
      <line
        x1={startX} y1={startY}
        x2={endX}   y2={endY}
        stroke="transparent"
        strokeWidth={10}
      />
    </g>
  );
};

export default Edge;

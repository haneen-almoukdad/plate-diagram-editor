import React from 'react';
import { DiagramPlate } from '../../types';

// ===== PLATE KOMPONENTE =====
// Ein Plate ist ein rechteckiger Bereich, der wiederkehrende Strukturen darstellt.
// In Bayesian-Modellen zeigt ein Plate an, dass die enthaltenen Knoten
// mehrfach vorkommen (z.B. "für jeden Teilnehmer j").

interface PlateProps {
  plate: DiagramPlate;                         // Die Plate-Daten
  isSelected: boolean;                         // Ist dieses Plate ausgewählt?
  isSelectMode: boolean;                       // Ist das Select-Tool aktiv?
  onSelect: (id: string) => void;              // Callback wenn Plate angeklickt wird
  onDragStart: (id: string, e: React.MouseEvent) => void;  // Drag beginnt
  onResizeStart: (id: string, corner: string, e: React.MouseEvent) => void;  // Resize beginnt
}

const Plate: React.FC<PlateProps> = ({ 
  plate, 
  isSelected,
  isSelectMode,  
  onSelect, 
  onDragStart,
  onResizeStart 
}) => {
  // ===== STYLING =====
  // Farben basierend auf Auswahl-Zustand
  const strokeColor = isSelected ? '#4299e1' : '#4a5568';
  const strokeWidth = isSelected ? 2 : 1;
  
  // Radius für abgerundete Ecken
  // 8px ist ein guter Wert für ein modernes, professionelles Aussehen
  const cornerRadius = 8;

  // ===== EVENT HANDLERS =====
  
  // Handler für Klick auf das Plate (für Drag)
  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(plate.id);
    // Drag nur im Select-Modus erlauben
    if (isSelectMode) {
      onDragStart(plate.id, e);
    }
  };
  
  // Handler für Click (wichtig für korrekte Event-Propagation)
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(plate.id);
  };

  // Handler für Resize-Ecken
  // Gibt eine Funktion zurück, die das spezifische Corner-Event behandelt
  const handleResizeMouseDown = (corner: string) => (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(plate.id);
    onResizeStart(plate.id, corner, e);
  };

  // Größe der Resize-Handles (die kleinen Quadrate an den Ecken)
  const handleSize = 8;
  
  // Resize-Handles werden nur angezeigt wenn:
  // 1. Das Plate ausgewählt ist UND
  // 2. Das Select-Tool aktiv ist
  const showResizeHandles = isSelected && isSelectMode;

  return (
    <g className="plate">
      {/* ===== DAS HAUPT-RECHTECK ===== */}
      {/* rx und ry definieren den Radius der abgerundeten Ecken */}
      <rect
        x={plate.x}
        y={plate.y}
        width={plate.width}
        height={plate.height}
        rx={cornerRadius}
        ry={cornerRadius}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        onMouseDown={handleMouseDown}
        onClick={handleClick}
        style={{ cursor: isSelectMode ? 'move' : 'default' }}
      />
      
      {/* ===== LABEL ===== */}
      {/* Wird unten rechts im Plate angezeigt */}
      {/* Zeigt den Index an (z.B. "i", "j", "N") */}
      <text
        x={plate.x + plate.width - 12}
        y={plate.y + plate.height - 10}
        textAnchor="end"
        style={{
          fontFamily: "'Times New Roman', serif",
          fontSize: '14px',
          fontStyle: 'italic',
          fill: '#4a5568',
          pointerEvents: 'none',
        }}
      >
        {plate.label}
      </text>

      {/* ===== RESIZE-HANDLES ===== */}
      {/* Werden nur angezeigt wenn das Plate ausgewählt ist UND Select-Tool aktiv */}
      {showResizeHandles && (
        <>
          {/* Unten-rechts (SE = South-East) */}
          <rect
            x={plate.x + plate.width - handleSize / 2}
            y={plate.y + plate.height - handleSize / 2}
            width={handleSize}
            height={handleSize}
            rx={2}
            ry={2}
            fill="#4299e1"
            stroke="white"
            strokeWidth={1}
            style={{ cursor: 'se-resize' }}
            onMouseDown={handleResizeMouseDown('se')}
          />
          
          {/* Unten-links (SW = South-West) */}
          <rect
            x={plate.x - handleSize / 2}
            y={plate.y + plate.height - handleSize / 2}
            width={handleSize}
            height={handleSize}
            rx={2}
            ry={2}
            fill="#4299e1"
            stroke="white"
            strokeWidth={1}
            style={{ cursor: 'sw-resize' }}
            onMouseDown={handleResizeMouseDown('sw')}
          />
          
          {/* Oben-rechts (NE = North-East) */}
          <rect
            x={plate.x + plate.width - handleSize / 2}
            y={plate.y - handleSize / 2}
            width={handleSize}
            height={handleSize}
            rx={2}
            ry={2}
            fill="#4299e1"
            stroke="white"
            strokeWidth={1}
            style={{ cursor: 'ne-resize' }}
            onMouseDown={handleResizeMouseDown('ne')}
          />
          
          {/* Oben-links (NW = North-West) */}
          <rect
            x={plate.x - handleSize / 2}
            y={plate.y - handleSize / 2}
            width={handleSize}
            height={handleSize}
            rx={2}
            ry={2}
            fill="#4299e1"
            stroke="white"
            strokeWidth={1}
            style={{ cursor: 'nw-resize' }}
            onMouseDown={handleResizeMouseDown('nw')}
          />
        </>
      )}
    </g>
  );
};

export default Plate;

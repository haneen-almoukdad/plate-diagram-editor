import React, { useRef, useState, useCallback } from 'react';
import { DiagramNode, DiagramEdge, DiagramPlate, ToolType } from '../../types';
import Node from './Node.tsx';
import Edge from './Edge.tsx';
import Plate from './Plate.tsx';
import './Canvas.css';

// ===== CANVAS KOMPONENTE =====
// Die Hauptzeichenfläche, auf der das Plate-Diagramm dargestellt wird.
// Unterstützt: Erstellen, Auswählen, Ziehen, Resize und Rechteck-Auswahl

interface CanvasProps {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  plates: DiagramPlate[];
  selectedElementIds: string[];  
  selectedTool: ToolType;
  zoomLevel: number;
  onSelectElement: (id: string | null) => void;  // Für Einzelauswahl
  onSelectMultipleElements: (ids: string[]) => void;  // Für Mehrfachauswahl
  onUpdateNode: (id: string, updates: Partial<DiagramNode>) => void;
  onUpdatePlate: (id: string, updates: Partial<DiagramPlate>) => void;
  onAddNode: (node: DiagramNode) => void;
  onAddPlate: (plate: DiagramPlate) => void;
  onAddEdge: (edge: DiagramEdge) => void;
  svgRef?: React.RefObject<SVGSVGElement>;  
}

const Canvas: React.FC<CanvasProps> = ({
  nodes,
  edges,
  plates,
  selectedElementIds,
  selectedTool,
  zoomLevel,
  onSelectElement,
  onSelectMultipleElements,
  onUpdateNode,
  onUpdatePlate,
  onAddNode,
  onAddPlate,
  onAddEdge,
  svgRef: externalSvgRef,  
}) => {
  // Referenz zum SVG-Element für Koordinatenberechnung
  // Verwendet externe Ref wenn vorhanden, sonst interne
  const internalSvgRef = useRef<SVGSVGElement>(null);
  const svgRef = externalSvgRef || internalSvgRef;
  
  // ===== ZUSTAND FüR DRAG-OPERATIONEN =====
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
  const [dragElementId, setDragElementId] = useState<string | null>(null);
  
  // ===== ZUSTAND FüR KANTEN-ERSTELLUNG =====
  const [edgeStartNodeId, setEdgeStartNodeId] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  
  // ===== ZUSTAND FüR PLATE-RESIZE =====
  const [isResizing, setIsResizing] = useState(false);
  const [resizePlateId, setResizePlateId] = useState<string | null>(null);
  const [resizeCorner, setResizeCorner] = useState<string | null>(null);
  const [resizeStartPos, setResizeStartPos] = useState({ x: 0, y: 0 });
  const [resizeStartPlate, setResizeStartPlate] = useState<DiagramPlate | null>(null);
  
  // ===== ZUSTAND FüR RECHTECK-AUSWAHL =====
  // Speichert ob gerade ein Auswahlrechteck aufgezogen wird
  const [isSelecting, setIsSelecting] = useState(false);
  // Startpunkt des Auswahlrechtecks
  const [selectionStart, setSelectionStart] = useState({ x: 0, y: 0 });
  // Aktueller Endpunkt des Auswahlrechtecks (folgt der Maus)
  const [selectionEnd, setSelectionEnd] = useState({ x: 0, y: 0 });
  
  // Minimale Größe für Plates
  const MIN_PLATE_WIDTH = 60;
  const MIN_PLATE_HEIGHT = 40;
  
  // Hilfsvariable für Select-Modus
  const isSelectMode = selectedTool === 'select';

  // ----- HILFSFUNKTIONEN -----
  
  // Konvertiert Maus-Koordinaten zu SVG-Koordinaten
  const getMousePosition = useCallback((e: React.MouseEvent): { x: number; y: number } => {
    if (!svgRef.current) return { x: 0, y: 0 };
    
    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    
    const x = (e.clientX - rect.left) / zoomLevel;
    const y = (e.clientY - rect.top) / zoomLevel;
    
    return { x, y };
  }, [zoomLevel]);

  // Generiert eine eindeutige ID
  const generateId = (prefix: string): string => {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  // ===== NEU: Berechnet das normalisierte Auswahlrechteck =====
  // Normalisiert bedeutet: x,y ist immer oben-links, width/height sind positiv
  // Das ist nötig, weil der User das Rechteck in jede Richtung ziehen kann
  const getSelectionRect = () => {
    const x = Math.min(selectionStart.x, selectionEnd.x);
    const y = Math.min(selectionStart.y, selectionEnd.y);
    const width = Math.abs(selectionEnd.x - selectionStart.x);
    const height = Math.abs(selectionEnd.y - selectionStart.y);
    return { x, y, width, height };
  };

  // ===== NEU: Prüft ob ein Punkt innerhalb eines Rechtecks liegt =====
  const isPointInRect = (
    px: number, 
    py: number, 
    rect: { x: number; y: number; width: number; height: number }
  ): boolean => {
    return (
      px >= rect.x &&
      px <= rect.x + rect.width &&
      py >= rect.y &&
      py <= rect.y + rect.height
    );
  };

  // ===== NEU: Pröft ob ein Rechteck (Plate) das Auswahlrechteck Überlappt =====
  const doRectsOverlap = (
    rect1: { x: number; y: number; width: number; height: number },
    rect2: { x: number; y: number; width: number; height: number }
  ): boolean => {
    return !(
      rect1.x + rect1.width < rect2.x ||
      rect2.x + rect2.width < rect1.x ||
      rect1.y + rect1.height < rect2.y ||
      rect2.y + rect2.height < rect1.y
    );
  };

  // ===== NEU: Findet alle Elemente innerhalb des Auswahlrechtecks =====
  const getElementsInSelectionRect = (): string[] => {
    const rect = getSelectionRect();
    const selectedIds: string[] = [];

    // Prüfe alle Knoten
    nodes.forEach(node => {
      // Knoten hat einen Radius von 22 (aus Node.tsx)
      const nodeRadius = 22;
      // Prüfe ob der Mittelpunkt des Knotens im Rechteck liegt
      // ODER ob der Knoten das Rechteck überlappt
      const nodeRect = {
        x: node.x - nodeRadius,
        y: node.y - nodeRadius,
        width: nodeRadius * 2,
        height: nodeRadius * 2,
      };
      if (doRectsOverlap(rect, nodeRect)) {
        selectedIds.push(node.id);
      }
    });

    // PrÃ¼fe alle Plates
    plates.forEach(plate => {
      const plateRect = {
        x: plate.x,
        y: plate.y,
        width: plate.width,
        height: plate.height,
      };
      if (doRectsOverlap(rect, plateRect)) {
        selectedIds.push(plate.id);
      }
    });

    // Prüfe alle Kanten
    // Eine Kante wird ausgewählt, wenn BEIDE verbundenen Knoten ausgewählt sind
    // ODER wenn die Linie das Auswahlrechteck schneidet
    edges.forEach(edge => {
      const fromNode = nodes.find(n => n.id === edge.fromNodeId);
      const toNode = nodes.find(n => n.id === edge.toNodeId);
      
      if (fromNode && toNode) {
        // PrÃ¼fe ob beide Endpunkte im Rechteck liegen
        const fromInRect = isPointInRect(fromNode.x, fromNode.y, rect);
        const toInRect = isPointInRect(toNode.x, toNode.y, rect);
        
        if (fromInRect && toInRect) {
          selectedIds.push(edge.id);
        }
      }
    });

    return selectedIds;
  };

  // ----- EVENT HANDLERS -----

  // Klick auf den Canvas (nicht auf ein Element)
  const handleCanvasClick = (e: React.MouseEvent) => {
    // Wenn gerade eine Rechteck-Auswahl beendet wurde, nicht weiter verarbeiten
    if (isSelecting) return;
    
    const pos = getMousePosition(e);
    
    // Edge-Tool Behandlung
    if (selectedTool === 'edge') {
      if (edgeStartNodeId !== null) {
        setEdgeStartNodeId(null);
        console.log('Kanten-Erstellung abgebrochen');
      }
      return;
    }
    
    // Node-Tools: Erstelle neuen Knoten
    if (selectedTool.startsWith('node-')) {
      let nodeType: 'observed' | 'unobserved' | 'deterministic' = 'unobserved';
      let nodeShape: 'circle' | 'square' = 'circle';
      
      switch (selectedTool) {
        case 'node-observed':
          nodeType = 'observed';
          break;
        case 'node-unobserved':
          nodeType = 'unobserved';
          break;
        case 'node-deterministic':
          nodeType = 'deterministic';
          break;
        case 'node-square':
          nodeShape = 'square';
          break;
      }
      
      const newNode: DiagramNode = {
        id: generateId('node'),
        x: pos.x,
        y: pos.y,
        label: 'x',
        type: nodeType,
        shape: nodeShape,
        samplingStatement: '',   // <-- NEU: Leerer String
        plateId: null,
      };

      
      onAddNode(newNode);
      onSelectElement(newNode.id);
    } else if (selectedTool === 'plate') {
      // Plate-Tool: Erstelle neues Plate
      const newPlate: DiagramPlate = {
        id: generateId('plate'),
        x: pos.x - 75,
        y: pos.y - 50,
        width: 150,
        height: 100,
        label: 'i',
        parentPlateId: null,
      };
      
      onAddPlate(newPlate);
      onSelectElement(newPlate.id);
    } else if (selectedTool === 'select') {
      // Select-Tool: Auswahl aufheben (nur wenn nicht gezogen wurde)
      onSelectElement(null);
    }
  };

  // ===== NEU: MouseDown auf Canvas - startet Rechteck-Auswahl =====
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    // Nur im Select-Modus und nur wenn direkt auf Canvas geklickt
    if (!isSelectMode) return;
    
    // Prüfe ob auf ein Element geklickt wurde (dann nicht Rechteck starten)
    const target = e.target as SVGElement;
    if (target.tagName !== 'rect' || !target.classList.contains('canvas-background')) {
      // Wenn auf den weiÃŸen Hintergrund geklickt wurde
      if (target.getAttribute('width') === '100%') {
        const pos = getMousePosition(e);
        setIsSelecting(true);
        setSelectionStart(pos);
        setSelectionEnd(pos);
        console.log('Rechteck-Auswahl gestartet bei:', pos);
      }
    }
  };

  // Handler für Klick auf einen Knoten (für Edge-Erstellung)
  const handleNodeClick = (nodeId: string) => {
    if (selectedTool === 'edge') {
      if (edgeStartNodeId === null) {
        setEdgeStartNodeId(nodeId);
        console.log('Startknoten ausgewÃ¤hlt:', nodeId);
      } else if (edgeStartNodeId === nodeId) {
        setEdgeStartNodeId(null);
        console.log('Kanten-Erstellung abgebrochen');
      } else {
        const edgeExists = edges.some(
          e => e.fromNodeId === edgeStartNodeId && e.toNodeId === nodeId
        );
        
        if (!edgeExists) {
          const newEdge: DiagramEdge = {
            id: generateId('edge'),
            fromNodeId: edgeStartNodeId,
            toNodeId: nodeId,
          };
          onAddEdge(newEdge);
          onSelectElement(newEdge.id);
          console.log('Neue Kante erstellt:', newEdge.id);
        }
        setEdgeStartNodeId(null);
      }
    } else {
      onSelectElement(nodeId);
    }
  };

  // Drag-Start für Knoten
  const handleNodeDragStart = (nodeId: string, e: React.MouseEvent) => {
    if (selectedTool === 'edge') return;
    if (selectedTool !== 'select') return;
    
    setIsDragging(true);
    setDragElementId(nodeId);
    setDragStartPos(getMousePosition(e));
  };

  // Drag-Start für Plates
  const handlePlateDragStart = (plateId: string, e: React.MouseEvent) => {
    if (!isSelectMode) return;
    
    setIsDragging(true);
    setDragElementId(plateId);
    setDragStartPos(getMousePosition(e));
  };

  // Resize-Start für Plates
  const handlePlateResizeStart = (plateId: string, corner: string, e: React.MouseEvent) => {
    if (!isSelectMode) {
      console.log('Resize nicht möglich - bitte Select-Tool auswählen');
      return;
    }
    
    e.stopPropagation();
    
    const plate = plates.find(p => p.id === plateId);
    if (!plate) return;
    
    setIsResizing(true);
    setResizePlateId(plateId);
    setResizeCorner(corner);
    setResizeStartPos(getMousePosition(e));
    setResizeStartPlate({ ...plate });
    
    console.log('Resize gestartet:', plateId, 'Ecke:', corner);
  };

  // Mausbewegung
  const handleMouseMove = (e: React.MouseEvent) => {
    const pos = getMousePosition(e);
    
    // ===== RECHTECK-AUSWAHL =====
    if (isSelecting) {
      setSelectionEnd(pos);
      return;  // Andere Interaktionen während Auswahl ignorieren
    }
    
    // Kanten-Vorschau
    if (selectedTool === 'edge' && edgeStartNodeId !== null) {
      setMousePos(pos);
    }
    
    // Resize-Logik
    if (isResizing && isSelectMode && resizePlateId && resizeCorner && resizeStartPlate) {
      const deltaX = pos.x - resizeStartPos.x;
      const deltaY = pos.y - resizeStartPos.y;
      
      let newX = resizeStartPlate.x;
      let newY = resizeStartPlate.y;
      let newWidth = resizeStartPlate.width;
      let newHeight = resizeStartPlate.height;
      
      switch (resizeCorner) {
        case 'se':
          newWidth = Math.max(MIN_PLATE_WIDTH, resizeStartPlate.width + deltaX);
          newHeight = Math.max(MIN_PLATE_HEIGHT, resizeStartPlate.height + deltaY);
          break;
        case 'sw':
          newWidth = Math.max(MIN_PLATE_WIDTH, resizeStartPlate.width - deltaX);
          newHeight = Math.max(MIN_PLATE_HEIGHT, resizeStartPlate.height + deltaY);
          if (resizeStartPlate.width - deltaX >= MIN_PLATE_WIDTH) {
            newX = resizeStartPlate.x + deltaX;
          }
          break;
        case 'ne':
          newWidth = Math.max(MIN_PLATE_WIDTH, resizeStartPlate.width + deltaX);
          newHeight = Math.max(MIN_PLATE_HEIGHT, resizeStartPlate.height - deltaY);
          if (resizeStartPlate.height - deltaY >= MIN_PLATE_HEIGHT) {
            newY = resizeStartPlate.y + deltaY;
          }
          break;
        case 'nw':
          newWidth = Math.max(MIN_PLATE_WIDTH, resizeStartPlate.width - deltaX);
          newHeight = Math.max(MIN_PLATE_HEIGHT, resizeStartPlate.height - deltaY);
          if (resizeStartPlate.width - deltaX >= MIN_PLATE_WIDTH) {
            newX = resizeStartPlate.x + deltaX;
          }
          if (resizeStartPlate.height - deltaY >= MIN_PLATE_HEIGHT) {
            newY = resizeStartPlate.y + deltaY;
          }
          break;
      }
      
      onUpdatePlate(resizePlateId, {
        x: newX,
        y: newY,
        width: newWidth,
        height: newHeight,
      });
      
      return;
    }
    
    // Drag-Logik
    if (!isDragging || !dragElementId) return;
    
    const deltaX = pos.x - dragStartPos.x;
    const deltaY = pos.y - dragStartPos.y;
    
    const node = nodes.find(n => n.id === dragElementId);
    if (node) {
      onUpdateNode(dragElementId, {
        x: node.x + deltaX,
        y: node.y + deltaY,
      });
    }
    
    const plate = plates.find(p => p.id === dragElementId);
    if (plate) {
      onUpdatePlate(dragElementId, {
        x: plate.x + deltaX,
        y: plate.y + deltaY,
      });
    }
    
    setDragStartPos(pos);
  };

  // Maus losgelassen
  const handleMouseUp = () => {
    // ===== RECHTECK-AUSWAHL BEENDEN =====
    if (isSelecting) {
      // Finde alle Elemente im Auswahlrechteck
      const selectedIds = getElementsInSelectionRect();
      
      // Prüfe ob das Rechteck groß genug war (nicht nur ein Klick)
      const rect = getSelectionRect();
      if (rect.width > 5 || rect.height > 5) {
        // Setze die Auswahl
        onSelectMultipleElements(selectedIds);
        console.log('Rechteck-Auswahl beendet. Ausgewählt:', selectedIds.length, 'Elemente');
      }
      
      setIsSelecting(false);
    }
    
    // Drag beenden
    setIsDragging(false);
    setDragElementId(null);
    
    // Resize beenden
    if (isResizing) {
      console.log('Resize beendet');
      setIsResizing(false);
      setResizePlateId(null);
      setResizeCorner(null);
      setResizeStartPlate(null);
    }
  };

  // ----- RENDERING -----
  
  const getNodeById = (id: string): DiagramNode | undefined => {
    return nodes.find(n => n.id === id);
  };
  
  const edgeStartNode = edgeStartNodeId ? getNodeById(edgeStartNodeId) : null;
  
  // Berechne das Auswahlrechteck für die Darstellung
  const selectionRect = getSelectionRect();

  return (
    <div className="canvas-container">
      <svg
        ref={svgRef}
        className="canvas-svg"
        viewBox="0 0 800 600"
        width={800 * zoomLevel}
        height={600 * zoomLevel}
        onClick={handleCanvasClick}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* ===== DEFINITIONEN ===== */}
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#4a5568" />
          </marker>
          
          <marker
            id="arrowhead-selected"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#4299e1" />
          </marker>
          
          <marker
            id="arrowhead-preview"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#a0aec0" />
          </marker>
        </defs>

        {/* ===== HINTERGRUND ===== */}
        <rect 
          className="canvas-background"
          width="100%" 
          height="100%" 
          fill="white" 
        />

        {/* ===== PLATES ===== */}
        {plates.map(plate => (
          <Plate
            key={plate.id}
            plate={plate}
            isSelected={selectedElementIds.includes(plate.id)}
            isSelectMode={isSelectMode}
            onSelect={onSelectElement}
            onDragStart={handlePlateDragStart}
            onResizeStart={handlePlateResizeStart}
          />
        ))}

        {/* ===== KANTEN ===== */}
        {edges.map(edge => {
          const fromNode = getNodeById(edge.fromNodeId);
          const toNode = getNodeById(edge.toNodeId);
          if (!fromNode || !toNode) return null;
          
          return (
            <Edge
              key={edge.id}
              edge={edge}
              fromNode={fromNode}
              toNode={toNode}
              isSelected={selectedElementIds.includes(edge.id)}
              onSelect={onSelectElement}
            />
          );
        })}
        
        {/* ===== VORSCHAU-LINIE für Kanten ===== */}
        {selectedTool === 'edge' && edgeStartNode && (
          <line
            x1={edgeStartNode.x}
            y1={edgeStartNode.y}
            x2={mousePos.x}
            y2={mousePos.y}
            stroke="#a0aec0"
            strokeWidth={1.5}
            strokeDasharray="5,5"
            markerEnd="url(#arrowhead-preview)"
            style={{ pointerEvents: 'none' }}
          />
        )}

        {/* ===== KNOTEN ===== */}
        {nodes.map(node => (
          <Node
            key={node.id}
            node={node}
            isSelected={selectedElementIds.includes(node.id)}
            isEdgeStart={edgeStartNodeId === node.id}
            onSelect={handleNodeClick}
            onDragStart={handleNodeDragStart}
          />
        ))}

        {/* ===== AUSWAHLRECHTECK ===== */}
        {/* Wird nur angezeigt während der Rechteck-Auswahl */}
        {isSelecting && (
          <rect
            x={selectionRect.x}
            y={selectionRect.y}
            width={selectionRect.width}
            height={selectionRect.height}
            fill="rgba(66, 153, 225, 0.1)"  // Leicht transparentes Blau
            stroke="#4299e1"
            strokeWidth={1}
            strokeDasharray="4,4"  // Gestrichelt
            style={{ pointerEvents: 'none' }}
          />
        )}

        {/* ===== HINWEISE ===== */}
        {nodes.length === 0 && plates.length === 0 && (
          <text
            x="400"
            y="300"
            textAnchor="middle"
            fill="#a0aec0"
            fontSize="14"
            fontFamily="sans-serif"
          >
            Select an item from the sidebar to get started.
          </text>
        )}
        
        {selectedTool === 'edge' && edgeStartNodeId && (
          <text
            x="400"
            y="580"
            textAnchor="middle"
            fill="#4299e1"
            fontSize="12"
            fontFamily="sans-serif"
          >
            Select a target node, or click an empty area to cancel.
          </text>
        )}
        
        {/* ===== AUSWAHL-INFO ===== */}
        {selectedElementIds.length > 1 && (
          <text
            x="400"
            y="20"
            textAnchor="middle"
            fill="#4299e1"
            fontSize="12"
            fontFamily="sans-serif"
          >
            {selectedElementIds.length} Elemente ausgewählt
          </text>
        )}
      </svg>
    </div>
  );
};

export default Canvas;

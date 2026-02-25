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
  onSelectElement: (id: string | null) => void;
  onUpdateNode: (id: string, updates: Partial<DiagramNode>) => void;
  // Silent: nur Position aktualisieren, KEIN History-Eintrag (während des Ziehens)
  onUpdateNodeSilent: (id: string, updates: Partial<DiagramNode>) => void;
  onUpdatePlate: (id: string, updates: Partial<DiagramPlate>) => void;
  // Silent: nur Position/Größe aktualisieren, KEIN History-Eintrag (während des Ziehens)
  onUpdatePlateSilent: (id: string, updates: Partial<DiagramPlate>) => void;
  onAddNode: (node: DiagramNode) => void;
  onAddPlate: (plate: DiagramPlate) => void;
  onAddEdge: (edge: DiagramEdge) => void;
  // Wird aufgerufen wenn Drag oder Resize beendet wird UND das Element sich wirklich bewegt hat
  onDragEnd: () => void;
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
  onUpdateNode,
  onUpdateNodeSilent,
  onUpdatePlate,
  onUpdatePlateSilent,
  onAddNode,
  onAddPlate,
  onAddEdge,
  onDragEnd,
  svgRef: externalSvgRef,  
}) => {
  const internalSvgRef = useRef<SVGSVGElement>(null);
  const svgRef = externalSvgRef || internalSvgRef;
  
  // ===== ZUSTAND FÜR DRAG-OPERATIONEN =====
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
  const [dragElementId, setDragElementId] = useState<string | null>(null);
  // hasMoved: wird true sobald sich das Element wirklich bewegt hat.
  // Verhindert leere History-Einträge bei einem einfachen Klick ohne Ziehen.
  const hasMoved = useRef(false);
  // isDraggingRef: synchroner Guard gegen doppeltes Event-Feuern auf überlappenden SVG-Elementen.
  // isDragging (State) ist beim zweiten Event-Aufruf im selben Frame noch false → reicht nicht.
  const isDraggingRef = useRef(false);

  // ===== STARTPOSITIONEN FÜR PLATE-DRAG =====
  // Beim Drag-Start werden die Ausgangspositionen ALLER betroffenen Elemente
  // einmalig gespeichert. handleMouseMove rechnet dann immer:
  //   neuePosition = startPosition + (aktuellerMausort - dragStartPos)
  // Das ist stabiler als frame-by-frame Delta, weil kein Floating-Point-Fehler
  // oder React-Batching-Problem akkumuliert werden kann.
  const dragStartNodes = useRef<Map<string, { x: number; y: number }>>(new Map());
  const dragStartPlates = useRef<Map<string, { x: number; y: number }>>(new Map());
  
  // ===== ZUSTAND FÜR KANTEN-ERSTELLUNG =====
  const [edgeStartNodeId, setEdgeStartNodeId] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  
  // ===== ZUSTAND FÜR PLATE-RESIZE =====
  const [isResizing, setIsResizing] = useState(false);
  const [resizePlateId, setResizePlateId] = useState<string | null>(null);
  const [resizeCorner, setResizeCorner] = useState<string | null>(null);
  const [resizeStartPos, setResizeStartPos] = useState({ x: 0, y: 0 });
  const [resizeStartPlate, setResizeStartPlate] = useState<DiagramPlate | null>(null);
  
  
  const MIN_PLATE_WIDTH = 60;
  const MIN_PLATE_HEIGHT = 40;
  
  const isSelectMode = selectedTool === 'select';

  // ----- HILFSFUNKTIONEN -----
  
  // ===== EBENEN-HILFSFUNKTIONEN =====
  
  /**
   * Berechnet die Verschachtelungstiefe einer Plate.
   * Tiefe 0 = äußerste Plate (kein parentPlateId)
   * Tiefe 1 = eine Ebene tiefer, Tiefe 2 = zwei Ebenen tiefer, usw.
   */
  const getPlateDepth = useCallback((plateId: string, allPlates: DiagramPlate[]): number => {
    const plate = allPlates.find(p => p.id === plateId);
    if (!plate || !plate.parentPlateId) return 0;
    return 1 + getPlateDepth(plate.parentPlateId, allPlates);
  }, []);

  /**
   * Findet die innerste Plate, die einen bestimmten Punkt enthält.
   * Wird verwendet, wenn ein neuer Knoten platziert wird.
   * Gibt die plateId zurück oder null wenn kein Plate den Punkt enthält.
   */
  const findInnermostPlateAtPoint = useCallback((
    px: number, py: number, allPlates: DiagramPlate[], excludeId?: string
  ): string | null => {
    const candidates = allPlates.filter(p => {
      if (excludeId && p.id === excludeId) return false;
      return px >= p.x && px <= p.x + p.width && py >= p.y && py <= p.y + p.height;
    });
    if (candidates.length === 0) return null;
    // Die tiefste (innerste) Plate wählen
    return candidates.reduce((deepest, p) => {
      return getPlateDepth(p.id, allPlates) >= getPlateDepth(deepest.id, allPlates) ? p : deepest;
    }).id;
  }, [getPlateDepth]);

  /**
   * Findet die innerste Plate, die eine neue Plate vollständig enthält.
   * Wird verwendet, wenn ein neues Plate platziert wird → parentPlateId setzen.
   * Gibt die parentPlateId zurück oder null wenn keine enthaltende Plate gefunden wird.
   */
  const findParentPlateForNewPlate = useCallback((
    newX: number, newY: number, newWidth: number, newHeight: number,
    allPlates: DiagramPlate[], excludeId?: string
  ): string | null => {
    // Eine Plate wird als "enthaltend" betrachtet wenn sie das Zentrum des neuen Plates enthält.
    // (Vollständige Enthaltung wäre zu streng für die UX)
    const centerX = newX + newWidth / 2;
    const centerY = newY + newHeight / 2;
    return findInnermostPlateAtPoint(centerX, centerY, allPlates, excludeId);
  }, [findInnermostPlateAtPoint]);

  /**
   * Sammelt rekursiv alle Nachkommen (child Plates + deren children) einer Plate.
   */
  const getDescendantPlateIds = useCallback((plateId: string, allPlates: DiagramPlate[]): string[] => {
    const directChildren = allPlates.filter(p => p.parentPlateId === plateId).map(p => p.id);
    const allDescendants = [...directChildren];
    directChildren.forEach(childId => {
      allDescendants.push(...getDescendantPlateIds(childId, allPlates));
    });
    return allDescendants;
  }, []);

  const getMousePosition = useCallback((e: React.MouseEvent): { x: number; y: number } => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    // SVG nimmt 100% der Container-Breite ein, viewBox skaliert mit zoomLevel.
    // Mausposition muss in SVG-Koordinaten umgerechnet werden:
    // SVG-Koordinate = Mausposition_relativ / (renderedSize / viewBoxSize)
    const scaleX = rect.width  / (800 / zoomLevel);
    const scaleY = rect.height / (600 / zoomLevel);
    const x = (e.clientX - rect.left) / scaleX;
    const y = (e.clientY - rect.top)  / scaleY;
    return { x, y };
  }, [zoomLevel]);

  const generateId = (prefix: string): string => {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  // ----- EVENT HANDLERS -----

  const handleCanvasClick = (e: React.MouseEvent) => {
    const pos = getMousePosition(e);
    
    if (selectedTool === 'edge') {
      if (edgeStartNodeId !== null) setEdgeStartNodeId(null);
      return;
    }
    
    if (selectedTool.startsWith('node-')) {
      let nodeType: 'observed' | 'unobserved' | 'deterministic' = 'unobserved';
      let nodeShape: 'circle' | 'square' = 'circle';
      
      switch (selectedTool) {
        case 'node-observed':    nodeType = 'observed'; break;
        case 'node-unobserved':  nodeType = 'unobserved'; break;
        case 'node-deterministic': nodeType = 'deterministic'; break;
        case 'node-square':      nodeShape = 'square'; break;
      }
      
      const newNode: DiagramNode = {
        id: generateId('node'),
        x: pos.x, y: pos.y,
        label: 'x',
        type: nodeType,
        shape: nodeShape,
        samplingStatement: '',
        // Automatisch der innersten Plate zuweisen, die diesen Punkt enthält
        plateId: findInnermostPlateAtPoint(pos.x, pos.y, plates),
      };
      onAddNode(newNode);
      onSelectElement(newNode.id);

    } else if (selectedTool === 'plate') {
      const newPlateX = pos.x - 75;
      const newPlateY = pos.y - 50;
      const newPlateW = 150;
      const newPlateH = 100;
      const newPlate: DiagramPlate = {
        id: generateId('plate'),
        x: newPlateX, y: newPlateY,
        width: newPlateW, height: newPlateH,
        label: 'i',
        // Automatisch der innersten enthaltenden Plate zuweisen
        parentPlateId: findParentPlateForNewPlate(newPlateX, newPlateY, newPlateW, newPlateH, plates),
      };
      onAddPlate(newPlate);
      onSelectElement(newPlate.id);

    } else if (selectedTool === 'select') {
      onSelectElement(null);
    }
  };

  const handleNodeClick = (nodeId: string) => {
    if (selectedTool === 'edge') {
      if (edgeStartNodeId === null) {
        setEdgeStartNodeId(nodeId);
      } else if (edgeStartNodeId === nodeId) {
        setEdgeStartNodeId(null);
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
    if (isDraggingRef.current) return;
    isDraggingRef.current = true;
    hasMoved.current = false;
    dragStartNodes.current = new Map();
    dragStartPlates.current = new Map();
    const startPos = getMousePosition(e);
    // Startposition des Knotens selbst speichern
    const n = nodes.find(nd => nd.id === nodeId);
    if (n) dragStartNodes.current.set(nodeId, { x: n.x, y: n.y });
    setIsDragging(true);
    setDragElementId(nodeId);
    setDragStartPos(startPos);
  };

  // Drag-Start für Plates
  const handlePlateDragStart = (plateId: string, e: React.MouseEvent) => {
    if (!isSelectMode) return;
    // ===== GUARD: Keinen zweiten Drag starten wenn bereits einer läuft =====
    // isDraggingRef ist synchron → verhindert dass überlappende Plates beide feuern.
    if (isDraggingRef.current) return;
    isDraggingRef.current = true;
    hasMoved.current = false;
    const startPos = getMousePosition(e);

    const draggedPlate = plates.find(p => p.id === plateId);
    if (!draggedPlate) return;

    // ===== STARTPOSITIONEN EINMALIG SPEICHERN =====
    // Plate selbst + alle Plates die geometrisch INNERHALB liegen (unabhängig von parentPlateId).
    // Das funktioniert auch für alte Plates ohne parentPlateId.
    dragStartPlates.current = new Map();
    dragStartPlates.current.set(plateId, { x: draggedPlate.x, y: draggedPlate.y });

    plates.forEach(p => {
      if (p.id === plateId) return;
      // Eine Plate gilt als "innen" wenn sie VOLLSTÄNDIG im gezogenen Plate liegt.
      // Das ist die einzig zuverlässige Prüfung:
      // - Mittelpunkt-Prüfung schlägt fehl wenn die äußere Plate groß ist
      //   und ihr Zentrum zufällig im Bereich der inneren Plate liegt.
      // - Vollständige Enthaltung ist eindeutig: äußere Plates sind immer größer
      //   und können nie vollständig in der kleineren inneren Plate liegen.
      const fullyInside =
        p.x            >= draggedPlate.x &&
        p.y            >= draggedPlate.y &&
        p.x + p.width  <= draggedPlate.x + draggedPlate.width &&
        p.y + p.height <= draggedPlate.y + draggedPlate.height;
      if (fullyInside) {
        dragStartPlates.current.set(p.id, { x: p.x, y: p.y });
      }
    });

    // Alle Knoten die geometrisch in der gezogenen Plate (oder einer inneren Plate) liegen
    dragStartNodes.current = new Map();
    nodes.forEach(n => {
      const inside =
        n.x >= draggedPlate.x && n.x <= draggedPlate.x + draggedPlate.width &&
        n.y >= draggedPlate.y && n.y <= draggedPlate.y + draggedPlate.height;
      if (inside) {
        dragStartNodes.current.set(n.id, { x: n.x, y: n.y });
      }
    });

    setIsDragging(true);
    setDragElementId(plateId);
    setDragStartPos(startPos);
  };

  // Resize-Start für Plates
  const handlePlateResizeStart = (plateId: string, corner: string, e: React.MouseEvent) => {
    if (!isSelectMode) return;
    e.stopPropagation();
    const plate = plates.find(p => p.id === plateId);
    if (!plate) return;
    hasMoved.current = false; // zurücksetzen
    setIsResizing(true);
    setResizePlateId(plateId);
    setResizeCorner(corner);
    setResizeStartPos(getMousePosition(e));
    setResizeStartPlate({ ...plate });
  };

  // Mausbewegung
  const handleMouseMove = (e: React.MouseEvent) => {
    const pos = getMousePosition(e);
    
    if (selectedTool === 'edge' && edgeStartNodeId !== null) {
      setMousePos(pos);
    }
    
    // ===== RESIZE-LOGIK =====
    // Verwendet onUpdatePlateSilent → KEIN History-Eintrag bei jedem Pixel!
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
          if (resizeStartPlate.width - deltaX >= MIN_PLATE_WIDTH) newX = resizeStartPlate.x + deltaX;
          break;
        case 'ne':
          newWidth = Math.max(MIN_PLATE_WIDTH, resizeStartPlate.width + deltaX);
          newHeight = Math.max(MIN_PLATE_HEIGHT, resizeStartPlate.height - deltaY);
          if (resizeStartPlate.height - deltaY >= MIN_PLATE_HEIGHT) newY = resizeStartPlate.y + deltaY;
          break;
        case 'nw':
          newWidth = Math.max(MIN_PLATE_WIDTH, resizeStartPlate.width - deltaX);
          newHeight = Math.max(MIN_PLATE_HEIGHT, resizeStartPlate.height - deltaY);
          if (resizeStartPlate.width - deltaX >= MIN_PLATE_WIDTH) newX = resizeStartPlate.x + deltaX;
          if (resizeStartPlate.height - deltaY >= MIN_PLATE_HEIGHT) newY = resizeStartPlate.y + deltaY;
          break;
      }
      
      hasMoved.current = true; // tatsächliche Größenänderung
      onUpdatePlateSilent(resizePlateId, { x: newX, y: newY, width: newWidth, height: newHeight });
      return;
    }
    
    // ===== DRAG-LOGIK =====
    // Verwendet onUpdateNodeSilent / onUpdatePlateSilent → KEIN History-Eintrag bei jedem Pixel!
    if (!isDragging || !dragElementId) return;
    
    // ===== TOTALER DELTA VOM DRAG-START =====
    // Wir berechnen immer: aktuellePosition = startPosition + totalDelta
    // Das ist robuster als frame-by-frame Delta, weil kein Fehler akkumuliert.
    const totalDeltaX = pos.x - dragStartPos.x;
    const totalDeltaY = pos.y - dragStartPos.y;

    if (Math.abs(totalDeltaX) > 1 || Math.abs(totalDeltaY) > 1) {
      hasMoved.current = true;
    }

    // ===== KNOTEN-DRAG (einzelner Knoten) =====
    const isNodeDrag = dragStartNodes.current.has(dragElementId) && !dragStartPlates.current.has(dragElementId);
    if (isNodeDrag) {
      const start = dragStartNodes.current.get(dragElementId)!;
      onUpdateNodeSilent(dragElementId, { x: start.x + totalDeltaX, y: start.y + totalDeltaY });
      return;
    }

    // ===== PLATE-DRAG (Plate + alle gespeicherten Kinder) =====
    const isPlateDrag = dragStartPlates.current.has(dragElementId);
    if (isPlateDrag) {
      // Alle Plates an ihre neue Position setzen (Startposition + totalDelta)
      dragStartPlates.current.forEach((startPos, id) => {
        onUpdatePlateSilent(id, { x: startPos.x + totalDeltaX, y: startPos.y + totalDeltaY });
      });
      // Alle betroffenen Knoten mitbewegen
      dragStartNodes.current.forEach((startPos, id) => {
        onUpdateNodeSilent(id, { x: startPos.x + totalDeltaX, y: startPos.y + totalDeltaY });
      });
    }
  };

  // Maus losgelassen
  const handleMouseUp = () => {
    // ===== DRAG BEENDEN =====
    // onDragEnd nur aufrufen wenn das Element sich wirklich bewegt hat!
    // Verhindert leere History-Einträge bei einem einfachen Klick.
    if (isDragging) {
      isDraggingRef.current = false; // Guard zurücksetzen
      setIsDragging(false);
      setDragElementId(null);
      if (hasMoved.current) {
        onDragEnd(); // Nur bei tatsächlicher Bewegung → History-Eintrag
        hasMoved.current = false;
      }
    }
    
    // ===== RESIZE BEENDEN =====
    if (isResizing) {
      setIsResizing(false);
      setResizePlateId(null);
      setResizeCorner(null);
      setResizeStartPlate(null);
      if (hasMoved.current) {
        onDragEnd(); // Nur bei tatsächlicher Größenänderung → History-Eintrag
        hasMoved.current = false;
      }
    }
  };

  // ----- RENDERING -----
  
  const getNodeById = (id: string): DiagramNode | undefined => nodes.find(n => n.id === id);
  const edgeStartNode = edgeStartNodeId ? getNodeById(edgeStartNodeId) : null;

  return (
    <div className="canvas-container">
      <svg
        ref={svgRef}
        className="canvas-svg"
        viewBox={`0 0 ${800 / zoomLevel} ${600 / zoomLevel}`}
        width="100%"
        height="100%"
        onClick={handleCanvasClick}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* ===== DEFINITIONEN ===== */}
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#4a5568" />
          </marker>
          <marker id="arrowhead-selected" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#4299e1" />
          </marker>
          <marker id="arrowhead-preview" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#a0aec0" />
          </marker>
        </defs>

        {/* ===== HINTERGRUND ===== */}
        <rect className="canvas-background" width="100%" height="100%" fill="white" />

        {/* ===== PLATES ===== */}
        {/* Sortiert nach Verschachtelungstiefe: äußere Plates zuerst (niedrigere z-order),
            innere Plates danach (höhere z-order → visuell darüber) */}
        {[...plates]
          .sort((a, b) => getPlateDepth(a.id, plates) - getPlateDepth(b.id, plates))
          .map(plate => (
          <Plate
            key={plate.id}
            plate={plate}
            isSelected={selectedElementIds.includes(plate.id)}
            isSelectMode={isSelectMode}
            depth={getPlateDepth(plate.id, plates)}
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
            x1={edgeStartNode.x} y1={edgeStartNode.y}
            x2={mousePos.x} y2={mousePos.y}
            stroke="#a0aec0" strokeWidth={1.5} strokeDasharray="5,5"
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

        {/* ===== HINWEISE ===== */}
        {nodes.length === 0 && plates.length === 0 && (
          <text x="400" y="300" textAnchor="middle" fill="#a0aec0" fontSize="14" fontFamily="sans-serif">
            Select an item from the sidebar to get started.
          </text>
        )}
        
        {selectedTool === 'edge' && edgeStartNodeId && (
          <text x="400" y="580" textAnchor="middle" fill="#4299e1" fontSize="12" fontFamily="sans-serif">
            Select a target node, or click an empty area to cancel.
          </text>
        )}
        
      </svg>
    </div>
  );
};

export default Canvas;

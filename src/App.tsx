import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
  DiagramState, 
  DiagramNode, 
  DiagramEdge, 
  DiagramPlate, 
  ToolType,
  createEmptyDiagramState 
} from './types/index.ts';
import Header from './components/Header/Header.tsx';
import Toolbar from './components/Toolbar/Toolbar.tsx';
import Sidebar from './components/Sidebar/Sidebar.tsx';
import Canvas from './components/Canvas/Canvas.tsx';
import NodePropertiesPanel from './components/NodePropertiesPanel/NodePropertiesPanel.tsx';
import StatementPanel from './components/StatementPanel/StatementPanel.tsx';
import { exportAsPng, exportAsSvg } from './utils/exportUtils.ts';
import './App.css';

function App() {
  const [diagramState, setDiagramState] = useState<DiagramState>(createEmptyDiagramState());
  const [gridSnappingEnabled, setGridSnappingEnabled] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null!);

  type HistorySnapshot = {
    nodes: DiagramState['nodes'];
    edges: DiagramState['edges'];
    plates: DiagramState['plates'];
  };

  const MAX_HISTORY = 100;
  const history = useRef<HistorySnapshot[]>([{ nodes: [], edges: [], plates: [] }]);
  const historyIndex = useRef<number>(0);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // diagramStateRef: immer aktueller State, ohne Closure-Probleme
  const diagramStateRef = useRef(diagramState);
  useEffect(() => { diagramStateRef.current = diagramState; }, [diagramState]);

  // WICHTIG: pushToHistory wird NIE innerhalb von setDiagramState aufgerufen!
  // React StrictMode ruft State-Updater im Dev-Modus doppelt auf →
  // pushToHistory inside setDiagramState = doppelte History-Einträge = leere Undo-Schritte.
  const pushToHistory = useCallback((snapshot: HistorySnapshot) => {
    // ===== DUPLIKAT-SCHUTZ =====
    // Vor dem Speichern prüfen ob der neue Snapshot identisch mit dem
    // aktuellen History-Kopf ist. Falls ja → nichts tun.
    // Das verhindert alle "leeren" Undo-Schritte die nichts ändern,
    // egal woher sie kommen (StrictMode, Klick ohne Bewegung, etc.)
    const head = history.current[historyIndex.current];
    if (head &&
        JSON.stringify(head.nodes)  === JSON.stringify(snapshot.nodes) &&
        JSON.stringify(head.edges)  === JSON.stringify(snapshot.edges) &&
        JSON.stringify(head.plates) === JSON.stringify(snapshot.plates)) {
      return; // Identischer Zustand → kein neuer Eintrag
    }

    history.current = history.current.slice(0, historyIndex.current + 1);
    history.current.push(snapshot);
    if (history.current.length > MAX_HISTORY) history.current = history.current.slice(-MAX_HISTORY);
    historyIndex.current = history.current.length - 1;
    setCanUndo(historyIndex.current > 0);
    setCanRedo(false);
  }, []);

  // ===== STATE-HANDLER =====

  const handleToolSelect = useCallback((tool: ToolType) => {
    setDiagramState(prev => ({ ...prev, selectedTool: tool }));
  }, []);

  const handleSelectElement = useCallback((id: string | null) => {
    setDiagramState(prev => ({ ...prev, selectedElementIds: id ? [id] : [] }));
  }, []);

  const handleAddNode = useCallback((node: DiagramNode) => {
    const c = diagramStateRef.current;
    const nextNodes = [...c.nodes, node];
    setDiagramState(prev => ({ ...prev, nodes: nextNodes }));
    pushToHistory({ nodes: nextNodes, edges: c.edges, plates: c.plates });
  }, [pushToHistory]);

  const handleUpdateNode = useCallback((id: string, updates: Partial<DiagramNode>) => {
    const c = diagramStateRef.current;
    const nextNodes = c.nodes.map(n => n.id === id ? { ...n, ...updates } : n);
    setDiagramState(prev => ({ ...prev, nodes: nextNodes }));
    pushToHistory({ nodes: nextNodes, edges: c.edges, plates: c.plates });
  }, [pushToHistory]);

  const handleUpdateNodeSilent = useCallback((id: string, updates: Partial<DiagramNode>) => {
    setDiagramState(prev => ({
      ...prev,
      nodes: prev.nodes.map(n => n.id === id ? { ...n, ...updates } : n),
    }));
  }, []);

  const handleAddPlate = useCallback((plate: DiagramPlate) => {
    const c = diagramStateRef.current;
    const nextPlates = [...c.plates, plate];
    setDiagramState(prev => ({ ...prev, plates: nextPlates }));
    pushToHistory({ nodes: c.nodes, edges: c.edges, plates: nextPlates });
  }, [pushToHistory]);

  const handleUpdatePlate = useCallback((id: string, updates: Partial<DiagramPlate>) => {
    const c = diagramStateRef.current;
    const nextPlates = c.plates.map(p => p.id === id ? { ...p, ...updates } : p);
    setDiagramState(prev => ({ ...prev, plates: nextPlates }));
    pushToHistory({ nodes: c.nodes, edges: c.edges, plates: nextPlates });
  }, [pushToHistory]);

  const handleUpdatePlateSilent = useCallback((id: string, updates: Partial<DiagramPlate>) => {
    setDiagramState(prev => ({
      ...prev,
      plates: prev.plates.map(p => p.id === id ? { ...p, ...updates } : p),
    }));
  }, []);

  const handleAddEdge = useCallback((edge: DiagramEdge) => {
    const c = diagramStateRef.current;
    const nextEdges = [...c.edges, edge];
    setDiagramState(prev => ({ ...prev, edges: nextEdges }));
    pushToHistory({ nodes: c.nodes, edges: nextEdges, plates: c.plates });
  }, [pushToHistory]);

  const handleDragEnd = useCallback(() => {
    const c = diagramStateRef.current;
    pushToHistory({ nodes: c.nodes, edges: c.edges, plates: c.plates });
  }, [pushToHistory]);

  // ===== TOOLBAR =====

  const handleNewProject = useCallback(() => {
    if (window.confirm('Start a new project? All unsaved changes will be lost.')) {
      setDiagramState(createEmptyDiagramState());
      history.current = [{ nodes: [], edges: [], plates: [] }];
      historyIndex.current = 0;
      setCanUndo(false);
      setCanRedo(false);
    }
  }, []);

  const handleProjectNameChange = useCallback((newName: string) => {
    setDiagramState(prev => ({ ...prev, projectName: newName }));
  }, []);

  const handleSaveAs = useCallback(() => {
    const jsonString = JSON.stringify(diagramState, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${diagramState.projectName || 'diagram'}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [diagramState]);

  const handleLoadProject = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const loadedData = JSON.parse(content);
        if (!loadedData.nodes || !Array.isArray(loadedData.nodes))
          throw new Error('Ungültige Datei: "nodes" fehlt oder ist kein Array.');
        if (!loadedData.edges || !Array.isArray(loadedData.edges))
          throw new Error('Ungültige Datei: "edges" fehlt oder ist kein Array.');
        if (!loadedData.plates || !Array.isArray(loadedData.plates))
          throw new Error('Ungültige Datei: "plates" fehlt oder ist kein Array.');
        const newState = {
          projectName: loadedData.projectName || 'Loaded Project',
          nodes: loadedData.nodes, edges: loadedData.edges, plates: loadedData.plates,
          selectedTool: 'select' as ToolType, selectedElementIds: [],
          zoomLevel: loadedData.zoomLevel || 1,
        };
        setDiagramState(newState);
        history.current = [{ nodes: newState.nodes, edges: newState.edges, plates: newState.plates }];
        historyIndex.current = 0;
        setCanUndo(false);
        setCanRedo(false);
      } catch (error) {
        if (error instanceof SyntaxError) alert('Fehler: Die Datei enthält kein gültiges JSON.');
        else if (error instanceof Error) alert(`Fehler beim Laden: ${error.message}`);
        else alert('Ein unbekannter Fehler ist aufgetreten.');
      }
    };
    reader.onerror = () => alert('Fehler beim Lesen der Datei.');
    reader.readAsText(file);
  }, []);

  const handleExportPng = useCallback(async () => {
    if (!svgRef.current) { alert('Fehler beim Export.'); return; }
    try { await exportAsPng(svgRef.current, diagramState.nodes, diagramState.edges, diagramState.plates, diagramState.projectName || 'plate-diagram'); }
    catch { alert('Fehler beim PNG-Export.'); }
  }, [diagramState]);

  const handleExportSvg = useCallback(async () => {
    if (!svgRef.current) { alert('Fehler beim Export.'); return; }
    try { await exportAsSvg(svgRef.current, diagramState.nodes, diagramState.edges, diagramState.plates, diagramState.projectName || 'plate-diagram'); }
    catch { alert('Fehler beim SVG-Export.'); }
  }, [diagramState]);

  const handleZoomIn = useCallback(() => {
    setDiagramState(prev => ({ ...prev, zoomLevel: Math.min(prev.zoomLevel + 0.1, 2) }));
  }, []);

  const handleZoomOut = useCallback(() => {
    setDiagramState(prev => ({ ...prev, zoomLevel: Math.max(prev.zoomLevel - 0.1, 0.5) }));
  }, []);

  const handleUndo = useCallback(() => {
    if (historyIndex.current <= 0) return;
    historyIndex.current -= 1;
    const snapshot = history.current[historyIndex.current];
    setDiagramState(prev => ({ ...prev, ...snapshot, selectedElementIds: [] }));
    setCanUndo(historyIndex.current > 0);
    setCanRedo(true);
  }, []);

  const handleRedo = useCallback(() => {
    if (historyIndex.current >= history.current.length - 1) return;
    historyIndex.current += 1;
    const snapshot = history.current[historyIndex.current];
    setDiagramState(prev => ({ ...prev, ...snapshot, selectedElementIds: [] }));
    setCanUndo(true);
    setCanRedo(historyIndex.current < history.current.length - 1);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput = (e.target as HTMLElement).tagName === 'INPUT' ||
                      (e.target as HTMLElement).tagName === 'TEXTAREA';
      if (isInput) return;
      if (e.ctrlKey && !e.shiftKey && e.key === 'z') { e.preventDefault(); handleUndo(); }
      else if (e.ctrlKey && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) { e.preventDefault(); handleRedo(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  const handleDelete = useCallback(() => {
    const c = diagramStateRef.current;
    const selectedIds = c.selectedElementIds;
    if (selectedIds.length === 0) return;

    const nodeIdsToDelete = c.nodes.filter(n => selectedIds.includes(n.id)).map(n => n.id);
    const plateIdsToDelete = c.plates.filter(p => selectedIds.includes(p.id)).map(p => p.id);
    const edgeIdsToDelete = c.edges.filter(e => selectedIds.includes(e.id)).map(e => e.id);

    const nextNodes = c.nodes.filter(n => !nodeIdsToDelete.includes(n.id));
    const nextPlates = c.plates.filter(p => !plateIdsToDelete.includes(p.id));
    const nextEdges = c.edges.filter(e =>
      !edgeIdsToDelete.includes(e.id) &&
      !nodeIdsToDelete.includes(e.fromNodeId) &&
      !nodeIdsToDelete.includes(e.toNodeId)
    );

    setDiagramState(prev => ({ ...prev, nodes: nextNodes, plates: nextPlates, edges: nextEdges, selectedElementIds: [] }));
    pushToHistory({ nodes: nextNodes, edges: nextEdges, plates: nextPlates });
  }, [pushToHistory]);

  const handleAutoLayout = useCallback(() => { console.log('Auto-Layout - TODO'); }, []);

  const handleToggleGridSnapping = useCallback(() => {
    setGridSnappingEnabled(prev => !prev);
  }, []);

  const getSelectedNode = (): DiagramNode | null => {
    if (diagramState.selectedElementIds.length !== 1) return null;
    return diagramState.nodes.find(n => n.id === diagramState.selectedElementIds[0]) || null;
  };

  const getSelectedPlate = (): DiagramPlate | null => {
    if (diagramState.selectedElementIds.length !== 1) return null;
    return diagramState.plates.find(p => p.id === diagramState.selectedElementIds[0]) || null;
  };

  return (
    <div className="plate-diagram-editor">
      <Header projectName={diagramState.projectName} onProjectNameChange={handleProjectNameChange} />
      <Toolbar
        onNewProject={handleNewProject} onSaveAs={handleSaveAs} onLoadProject={handleLoadProject}
        onZoomIn={handleZoomIn} onZoomOut={handleZoomOut}
        onUndo={handleUndo} onRedo={handleRedo} canUndo={canUndo} canRedo={canRedo}
        onDelete={handleDelete} onAutoLayout={handleAutoLayout}
        onExportPng={handleExportPng} onExportSvg={handleExportSvg}
        zoomLevel={diagramState.zoomLevel} selectedTool={diagramState.selectedTool}
        onToolSelect={handleToolSelect} gridSnappingEnabled={gridSnappingEnabled}
        onToggleGridSnapping={handleToggleGridSnapping}
      />
      <main className="editor-main">
        <Sidebar selectedTool={diagramState.selectedTool} onToolSelect={handleToolSelect} />
        <div className="editor-content">
          <div className="editor-workspace">
            <div className="canvas-wrapper">
              <Canvas
                nodes={diagramState.nodes} edges={diagramState.edges} plates={diagramState.plates}
                selectedElementIds={diagramState.selectedElementIds}
                selectedTool={diagramState.selectedTool} zoomLevel={diagramState.zoomLevel}
                onSelectElement={handleSelectElement}
                onUpdateNode={handleUpdateNode} onUpdateNodeSilent={handleUpdateNodeSilent}
                onUpdatePlate={handleUpdatePlate} onUpdatePlateSilent={handleUpdatePlateSilent}
                onAddNode={handleAddNode} onAddPlate={handleAddPlate} onAddEdge={handleAddEdge}
                onDragEnd={handleDragEnd} svgRef={svgRef}
              />
            </div>
            <NodePropertiesPanel
              selectedNode={getSelectedNode()}
              selectedPlate={getSelectedPlate()}
              onUpdateNode={handleUpdateNode}
              onUpdatePlate={handleUpdatePlate}
            />
          </div>
          <StatementPanel nodes={diagramState.nodes} />
        </div>
      </main>
    </div>
  );
}

export default App;

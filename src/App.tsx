import React, { useState, useCallback, useRef } from 'react';
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

// ===== APP KOMPONENTE =====
// Die Hauptkomponente, die alles zusammenhält.
// 
// NEUES LAYOUT:
// - NodePropertiesPanel rechts neben dem Canvas
// - StatementPanel unten für die Übersicht

function App() {
  // ===== ZUSTAND (STATE) =====
  const [diagramState, setDiagramState] = useState<DiagramState>(
    createEmptyDiagramState()
  );
  
  const [gridSnappingEnabled, setGridSnappingEnabled] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null!);

  // ===== ZUSTAND-AKTUALISIERUNGS-FUNKTIONEN =====

  const handleToolSelect = useCallback((tool: ToolType) => {
    setDiagramState(prev => ({
      ...prev,
      selectedTool: tool,
    }));
  }, []);

  const handleSelectElement = useCallback((id: string | null) => {
    setDiagramState(prev => ({
      ...prev,
      selectedElementIds: id ? [id] : [],
    }));
  }, []);

  const handleSelectMultipleElements = useCallback((ids: string[]) => {
    setDiagramState(prev => ({
      ...prev,
      selectedElementIds: ids,
    }));
  }, []);

  const handleAddNode = useCallback((node: DiagramNode) => {
    setDiagramState(prev => ({
      ...prev,
      nodes: [...prev.nodes, node],
    }));
  }, []);

  const handleUpdateNode = useCallback((id: string, updates: Partial<DiagramNode>) => {
    setDiagramState(prev => ({
      ...prev,
      nodes: prev.nodes.map(node =>
        node.id === id ? { ...node, ...updates } : node
      ),
    }));
  }, []);

  const handleAddPlate = useCallback((plate: DiagramPlate) => {
    setDiagramState(prev => ({
      ...prev,
      plates: [...prev.plates, plate],
    }));
  }, []);

  const handleUpdatePlate = useCallback((id: string, updates: Partial<DiagramPlate>) => {
    setDiagramState(prev => ({
      ...prev,
      plates: prev.plates.map(plate =>
        plate.id === id ? { ...plate, ...updates } : plate
      ),
    }));
  }, []);

  const handleAddEdge = useCallback((edge: DiagramEdge) => {
    setDiagramState(prev => ({
      ...prev,
      edges: [...prev.edges, edge],
    }));
  }, []);

  // ===== TOOLBAR-AKTIONEN =====
  
  const handleNewProject = useCallback(() => {
    if (window.confirm('Start a new project? All unsaved changes will be lost.')) {
      setDiagramState(createEmptyDiagramState());
    }
  }, []);

  // ===== NEU: PROJEKTNAME ÄNDERN =====
  const handleProjectNameChange = useCallback((newName: string) => {
    setDiagramState(prev => ({
      ...prev,
      projectName: newName,
    }));
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

  // ===== NEU: PROJEKT LADEN =====
  // Diese Funktion lädt eine JSON-Datei und stellt das Diagramm wieder her.
  // Sie enthält Fehlerbehandlung für ungültige Dateien.
  const handleLoadProject = useCallback((file: File) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const loadedData = JSON.parse(content);
        
        // ===== VALIDIERUNG =====
        // Prüfe ob die wichtigsten Felder vorhanden sind
        if (!loadedData.nodes || !Array.isArray(loadedData.nodes)) {
          throw new Error('Ungültige Datei: "nodes" fehlt oder ist kein Array.');
        }
        if (!loadedData.edges || !Array.isArray(loadedData.edges)) {
          throw new Error('Ungültige Datei: "edges" fehlt oder ist kein Array.');
        }
        if (!loadedData.plates || !Array.isArray(loadedData.plates)) {
          throw new Error('Ungültige Datei: "plates" fehlt oder ist kein Array.');
        }
        
        // ===== ZUSTAND WIEDERHERSTELLEN =====
        // Wir übernehmen nur die Diagramm-Daten, nicht die UI-Einstellungen
        setDiagramState({
          projectName: loadedData.projectName || 'Loaded Project',
          nodes: loadedData.nodes,
          edges: loadedData.edges,
          plates: loadedData.plates,
          // UI-Einstellungen werden zurückgesetzt
          selectedTool: 'select',
          selectedElementIds: [],
          zoomLevel: loadedData.zoomLevel || 1,
        });
        
        console.log('Projekt erfolgreich geladen:', loadedData.projectName);
        
      } catch (error) {
        // ===== FEHLERBEHANDLUNG =====
        console.error('Fehler beim Laden:', error);
        
        if (error instanceof SyntaxError) {
          alert('Fehler: Die Datei enthält kein gültiges JSON.');
        } else if (error instanceof Error) {
          alert(`Fehler beim Laden: ${error.message}`);
        } else {
          alert('Ein unbekannter Fehler ist aufgetreten.');
        }
      }
    };
    
    reader.onerror = () => {
      alert('Fehler beim Lesen der Datei.');
    };
    
    // Datei als Text lesen
    reader.readAsText(file);
  }, []);

  const handleExportPng = useCallback(async () => {
    if (!svgRef.current) {
      alert('Fehler: Das Diagramm konnte nicht exportiert werden.');
      return;
    }
    try {
      await exportAsPng(
        svgRef.current,
        diagramState.nodes,
        diagramState.edges,
        diagramState.plates,
        diagramState.projectName || 'plate-diagram'
      );
    } catch (error) {
      console.error('PNG Export fehlgeschlagen:', error);
      alert('Fehler beim PNG-Export.');
    }
  }, [diagramState]);

  const handleExportSvg = useCallback(async () => {
    if (!svgRef.current) {
      alert('Fehler: Das Diagramm konnte nicht exportiert werden.');
      return;
    }
    try {
      await exportAsSvg(
        svgRef.current,
        diagramState.nodes,
        diagramState.edges,
        diagramState.plates,
        diagramState.projectName || 'plate-diagram'
      );
    } catch (error) {
      console.error('SVG Export fehlgeschlagen:', error);
      alert('Fehler beim SVG-Export.');
    }
  }, [diagramState]);

  const handleZoomIn = useCallback(() => {
    setDiagramState(prev => ({
      ...prev,
      zoomLevel: Math.min(prev.zoomLevel + 0.1, 2),
    }));
  }, []);

  const handleZoomOut = useCallback(() => {
    setDiagramState(prev => ({
      ...prev,
      zoomLevel: Math.max(prev.zoomLevel - 0.1, 0.5),
    }));
  }, []);

  const handleUndo = useCallback(() => {
    console.log('Undo - TODO');
  }, []);

  const handleRedo = useCallback(() => {
    console.log('Redo - TODO');
  }, []);

  const handleDelete = useCallback(() => {
    const selectedIds = diagramState.selectedElementIds;
    if (selectedIds.length === 0) return;

    setDiagramState(prev => {
      const nodeIdsToDelete = prev.nodes
        .filter(n => selectedIds.includes(n.id))
        .map(n => n.id);
      
      const plateIdsToDelete = prev.plates
        .filter(p => selectedIds.includes(p.id))
        .map(p => p.id);
      
      const edgeIdsToDelete = prev.edges
        .filter(e => selectedIds.includes(e.id))
        .map(e => e.id);

      return {
        ...prev,
        nodes: prev.nodes.filter(n => !nodeIdsToDelete.includes(n.id)),
        plates: prev.plates.filter(p => !plateIdsToDelete.includes(p.id)),
        edges: prev.edges.filter(e => 
          !edgeIdsToDelete.includes(e.id) &&
          !nodeIdsToDelete.includes(e.fromNodeId) &&
          !nodeIdsToDelete.includes(e.toNodeId)
        ),
        selectedElementIds: [],
      };
    });
  }, [diagramState.selectedElementIds]);

  const handleAutoLayout = useCallback(() => {
    console.log('Auto-Layout - TODO');
  }, []);

  const handleToggleGridSnapping = useCallback(() => {
    setGridSnappingEnabled(prev => !prev);
  }, []);

  // ===== HILFSFUNKTION: Finde den ausgewählten Knoten =====
  const getSelectedNode = (): DiagramNode | null => {
    if (diagramState.selectedElementIds.length !== 1) {
      return null;
    }
    const selectedId = diagramState.selectedElementIds[0];
    return diagramState.nodes.find(node => node.id === selectedId) || null;
  };

  // ===== RENDERING =====
  return (
    <div className="plate-diagram-editor">
      {/* Header */}
      <Header 
        projectName={diagramState.projectName} 
        onProjectNameChange={handleProjectNameChange}
      />
      
      {/* Toolbar */}
      <Toolbar
        onNewProject={handleNewProject}
        onSaveAs={handleSaveAs}
        onLoadProject={handleLoadProject}  // NEU: Load-Funktion übergeben
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onDelete={handleDelete}
        onAutoLayout={handleAutoLayout}
        onExportPng={handleExportPng}
        onExportSvg={handleExportSvg}
        zoomLevel={diagramState.zoomLevel}
        selectedTool={diagramState.selectedTool}
        onToolSelect={handleToolSelect}
        gridSnappingEnabled={gridSnappingEnabled}
        onToggleGridSnapping={handleToggleGridSnapping}
      />
      
      {/* Hauptbereich */}
      <main className="editor-main">
        {/* Sidebar - Nur Elements */}
        <Sidebar
          selectedTool={diagramState.selectedTool}
          onToolSelect={handleToolSelect}
        />
        
        {/* Content-Bereich */}
        <div className="editor-content">
          {/* Oberer Bereich: Canvas + Properties Panel */}
          <div className="editor-workspace">
            {/* Canvas */}
            <div className="canvas-wrapper">
              <Canvas
                nodes={diagramState.nodes}
                edges={diagramState.edges}
                plates={diagramState.plates}
                selectedElementIds={diagramState.selectedElementIds}
                selectedTool={diagramState.selectedTool}
                zoomLevel={diagramState.zoomLevel}
                onSelectElement={handleSelectElement}
                onSelectMultipleElements={handleSelectMultipleElements}
                onUpdateNode={handleUpdateNode}
                onUpdatePlate={handleUpdatePlate}
                onAddNode={handleAddNode}
                onAddPlate={handleAddPlate}
                onAddEdge={handleAddEdge}
                svgRef={svgRef}
              />
            </div>
            
            {/* Properties Panel rechts */}
            <NodePropertiesPanel
              selectedNode={getSelectedNode()}
              onUpdateNode={handleUpdateNode}
            />
          </div>
          
          {/* Statement Panel unten */}
          <StatementPanel
            nodes={diagramState.nodes}
          />
        </div>
      </main>
    </div>
  );
}

export default App;

import React, { useState, useRef, useEffect } from 'react';
import { 
  FilePlus, 
  Save, 
  Download,
  FileImage,
  FileCode,
  ZoomIn, 
  ZoomOut, 
  Undo2, 
  Redo2, 
  Trash2,
  LayoutGrid,
  ChevronDown,
  MousePointer2,
  Grid3X3
} from 'lucide-react';
import { ToolType } from '../../types/index.ts';
import './Toolbar.css';

// ===== TOOLBAR KOMPONENTE =====
// Die horizontale Werkzeugleiste unter dem Header.
// Enthält: Projektoperationen, Zoom, Undo/Redo, Delete, Select, Grid-Snap, Auto-Layout

interface ToolbarProps {
  onNewProject: () => void;
  onSaveAs: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onDelete: () => void;
  onAutoLayout: () => void;
  onExportPng: () => void;
  onExportSvg: () => void;
  zoomLevel: number;
  selectedTool: ToolType;
  onToolSelect: (tool: ToolType) => void;
  gridSnappingEnabled: boolean;
  onToggleGridSnapping: () => void;
}

const ICON_SIZE = 18;

const Toolbar: React.FC<ToolbarProps> = ({
  onNewProject,
  onSaveAs,
  onZoomIn,
  onZoomOut,
  onUndo,
  onRedo,
  onDelete,
  onAutoLayout,
  onExportPng,
  onExportSvg,
  zoomLevel,
  selectedTool,
  onToolSelect,
  gridSnappingEnabled,
  onToggleGridSnapping,
}) => {
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsExportMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <nav className="toolbar">
      {/* Projekt-Operationen */}
      <div className="toolbar-group">
        <button className="toolbar-btn" onClick={onNewProject} title="Neues Projekt erstellen">
          <FilePlus size={ICON_SIZE} />
          <span className="toolbar-btn-text">New Project</span>
        </button>
        <button className="toolbar-btn" onClick={onSaveAs} title="Projekt speichern (JSON)">
          <Save size={ICON_SIZE} />
          <span className="toolbar-btn-text">Save</span>
        </button>
      </div>

      {/* Export-Dropdown */}
      <div className="toolbar-group" ref={dropdownRef}>
        <div className="toolbar-dropdown">
          <button 
            className="toolbar-btn"
            onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
            title="Als Bild exportieren"
          >
            <Download size={ICON_SIZE} />
            <span className="toolbar-btn-text">Export</span>
            <ChevronDown size={14} className={`toolbar-chevron ${isExportMenuOpen ? 'open' : ''}`} />
          </button>
          
          {isExportMenuOpen && (
            <div className="toolbar-dropdown-menu">
              <button 
                className="toolbar-dropdown-item"
                onClick={() => {
                  onExportPng();
                  setIsExportMenuOpen(false);
                }}
              >
                <FileImage size={ICON_SIZE} className="dropdown-icon png" />
                <div className="toolbar-dropdown-item-content">
                  <span className="toolbar-dropdown-item-label">Export as PNG</span>
                  <span className="toolbar-dropdown-hint">For Word, PowerPoint</span>
                </div>
              </button>
              <button 
                className="toolbar-dropdown-item"
                onClick={() => {
                  onExportSvg();
                  setIsExportMenuOpen(false);
                }}
              >
                <FileCode size={ICON_SIZE} className="dropdown-icon svg" />
                <div className="toolbar-dropdown-item-content">
                  <span className="toolbar-dropdown-item-label">Export as SVG</span>
                  <span className="toolbar-dropdown-hint">For LaTeX, scalable</span>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Zoom-Steuerung */}
      <div className="toolbar-group">
        <button className="toolbar-btn icon-only" onClick={onZoomOut} title="Rauszoomen">
          <ZoomOut size={ICON_SIZE} />
        </button>
        <span className="toolbar-zoom-display">{Math.round(zoomLevel * 100)}%</span>
        <button className="toolbar-btn icon-only" onClick={onZoomIn} title="Reinzoomen">
          <ZoomIn size={ICON_SIZE} />
        </button>
      </div>

      {/* Bearbeitung: Undo, Redo, Delete */}
      <div className="toolbar-group">
        <button className="toolbar-btn icon-only" onClick={onUndo} title="Rückgängig (Ctrl+Z)">
          <Undo2 size={ICON_SIZE} />
        </button>
        <button className="toolbar-btn icon-only" onClick={onRedo} title="Wiederherstellen (Ctrl+Y)">
          <Redo2 size={ICON_SIZE} />
        </button>
        <button className="toolbar-btn icon-only delete" onClick={onDelete} title="Löschen (Delete)">
          <Trash2 size={ICON_SIZE} />
        </button>
      </div>

      {/* Select, Grid-Snapping, Auto-Layout */}
      <div className="toolbar-group">
        <button 
          className={`toolbar-btn icon-only ${selectedTool === 'select' ? 'active' : ''}`}
          onClick={() => onToolSelect('select')} 
          title="Auswahl-Werkzeug (V)"
        >
          <MousePointer2 size={ICON_SIZE} />
          <span className="toolbar-btn-text">Select</span>
        </button>

        <button 
          className={`toolbar-btn icon-only ${gridSnappingEnabled ? 'active' : ''}`}
          onClick={onToggleGridSnapping} 
          title="Grid-Snapping ein/aus"
        >
          <Grid3X3 size={ICON_SIZE} />
          <span className="toolbar-btn-text">Grid-Snapping</span>
        </button>

        <button className="toolbar-btn" onClick={onAutoLayout} title="Automatisches Layout">
          <LayoutGrid size={ICON_SIZE} />
          <span className="toolbar-btn-text">Auto-Layout</span>
        </button>
      </div>
    </nav>
  );
};

export default Toolbar;

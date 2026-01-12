import React from 'react';
import { 
  Square,
  Circle,
  CircleDot,
  Target,
  BoxSelect,
  ArrowRight
} from 'lucide-react';
import { ToolType } from '../../types';
import './Sidebar.css';

// ===== SIDEBAR KOMPONENTE =====
// Die linke Seitenleiste mit den Element-Werkzeugen.
// GEÄNDERT: Select und Grid-Snapping wurden in die Toolbar verschoben.
//           Jetzt enthält die Sidebar nur noch die "Elements"-Sektion.
//
// Icons: Verwendet Lucide React für professionelles Aussehen

interface SidebarProps {
  selectedTool: ToolType;
  onToolSelect: (tool: ToolType) => void;
  // ENTFERNT: gridSnappingEnabled und onToggleGridSnapping
  // Diese sind jetzt in der Toolbar
}

// Icon-Größe als Konstante für Konsistenz
const ICON_SIZE = 18;

const Sidebar: React.FC<SidebarProps> = ({
  selectedTool,
  onToolSelect,
}) => {
  return (
    <aside className="sidebar">
      {/* ===== ELEMENTS SECTION ===== */}
      <div className="sidebar-section">
        <h3 className="sidebar-section-title">Elements</h3>

        {/* Plate erstellen */}
        <button
          className={`sidebar-button ${selectedTool === 'plate' ? 'selected' : ''}`}
          onClick={() => onToolSelect('plate')}
          title="Plate erstellen - Rechteckiger Bereich für Wiederholungen"
        >
          <BoxSelect size={ICON_SIZE} className="sidebar-icon" />
          <span className="sidebar-button-label">Plate</span>
        </button>

        {/* Node (observed) - gefüllter Kreis */}
        <button
          className={`sidebar-button ${selectedTool === 'node-observed' ? 'selected' : ''}`}
          onClick={() => onToolSelect('node-observed')}
          title="Beobachtete Variable - Gefüllter Kreis"
        >
          <CircleDot size={ICON_SIZE} className="sidebar-icon" />
          <span className="sidebar-button-label">Observed</span>
        </button>

        {/* Node (unobserved) - leerer Kreis */}
        <button
          className={`sidebar-button ${selectedTool === 'node-unobserved' ? 'selected' : ''}`}
          onClick={() => onToolSelect('node-unobserved')}
          title="Latente Variable - Leerer Kreis"
        >
          <Circle size={ICON_SIZE} className="sidebar-icon" />
          <span className="sidebar-button-label">Latent</span>
        </button>

        {/* Node (deterministic) - Doppelkreis */}
        <button
          className={`sidebar-button ${selectedTool === 'node-deterministic' ? 'selected' : ''}`}
          onClick={() => onToolSelect('node-deterministic')}
          title="Deterministische Variable - Doppelter Kreis"
        >
          <Target size={ICON_SIZE} className="sidebar-icon" />
          <span className="sidebar-button-label">Deterministic</span>
        </button>

        {/* Node (square) - Quadrat */}
        <button
          className={`sidebar-button ${selectedTool === 'node-square' ? 'selected' : ''}`}
          onClick={() => onToolSelect('node-square')}
          title="Konstante - Quadrat"
        >
          <Square size={ICON_SIZE} className="sidebar-icon" />
          <span className="sidebar-button-label">Constant</span>
        </button>

        {/* Edge - Kante */}
        <button
          className={`sidebar-button ${selectedTool === 'edge' ? 'selected' : ''}`}
          onClick={() => onToolSelect('edge')}
          title="Kante erstellen - Verbindung zwischen Knoten"
        >
          <ArrowRight size={ICON_SIZE} className="sidebar-icon" />
          <span className="sidebar-button-label">Edge</span>
        </button>
      </div>

      {/* ENTFERNT: Tools-Sektion (Select und Grid-Snapping) */}
      {/* Diese Tools sind jetzt in der Toolbar oben */}
    </aside>
  );
};

export default Sidebar;
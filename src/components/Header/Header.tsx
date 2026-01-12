import React from 'react';
import { Workflow } from 'lucide-react';
import './Header.css';

// ===== HEADER KOMPONENTE =====
// Diese Komponente zeigt den Titel der Anwendung an.
// Workflow-Icon repräsentiert die Verbindungen im Plate-Diagramm.
//
// Icons: Verwendet Lucide React für professionelles Aussehen

interface HeaderProps {
  projectName: string;
}

const Header: React.FC<HeaderProps> = ({ projectName }) => {
  return (
    <header className="header">
      <div className="header-brand">
        <Workflow size={22} className="header-logo" />
        <span className="header-title">Plate Diagram Editor</span>
      </div>
      
      {projectName && (
        <span className="header-project-name">{projectName}</span>
      )}
    </header>
  );
};

export default Header;

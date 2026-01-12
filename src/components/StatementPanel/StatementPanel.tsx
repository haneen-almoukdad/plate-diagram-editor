import React, { useState } from 'react';
import { Copy, Check, FileText } from 'lucide-react';
import { DiagramNode } from '../../types/index.ts';
import './StatementPanel.css';

// ===== STATEMENT PANEL KOMPONENTE =====
// Zeigt eine Übersicht aller Sampling Statements an (unten im Editor).
// Die Bearbeitung erfolgt im NodePropertiesPanel rechts.
//
// Dieses Panel ist nur für die ANZEIGE und das Kopieren.

interface StatementPanelProps {
  nodes: DiagramNode[];
}

const StatementPanel: React.FC<StatementPanelProps> = ({ nodes }) => {
  // State für Kopier-Feedback
  const [copied, setCopied] = useState(false);

  // ----- SAMMLE ALLE STATEMENTS -----
  const statements = nodes
    .filter(node => node.samplingStatement && node.samplingStatement.trim() !== '')
    .map(node => node.samplingStatement);

  // Kopier-Funktion mit Feedback
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(statements.join('\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Kopieren fehlgeschlagen:', err);
    }
  };

  // ----- RENDERING -----
  return (
    <div className="statement-panel">
      {/* Header */}
      <div className="statement-panel-header">
        <div className="statement-panel-title-wrapper">
          <FileText size={14} className="statement-panel-icon" />
          <h3 className="statement-panel-title">Sampling Statements</h3>
          {statements.length > 0 && (
            <span className="statement-count">{statements.length}</span>
          )}
        </div>
        
        {/* Kopier-Button */}
        {statements.length > 0 && (
          <button
            className={`statement-copy-btn ${copied ? 'copied' : ''}`}
            onClick={handleCopy}
            title="Alle Statements kopieren"
          >
            {copied ? (
              <>
                <Check size={12} />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy size={12} />
                <span>Copy All</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Statement-Liste */}
      <div className="statement-list-container">
        {statements.length > 0 ? (
          <div className="statement-list">
            {statements.map((statement, index) => (
              <div key={index} className="statement-item">
                {statement}
              </div>
            ))}
          </div>
        ) : (
          <div className="statement-empty">
            No sampling statements defined yet. Select a node and add a statement in the Properties panel.
          </div>
        )}
      </div>
    </div>
  );
};

export default StatementPanel;

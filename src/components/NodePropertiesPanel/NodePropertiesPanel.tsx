import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Settings } from 'lucide-react';
import { DiagramNode, EXAMPLE_STATEMENTS } from '../../types/index.ts';
import './NodePropertiesPanel.css';

// ===== NODE PROPERTIES PANEL =====
// Dieses Panel erscheint rechts neben dem Canvas und zeigt
// die Eigenschaften des aktuell ausgewählten Knotens.
// Der Nutzer kann hier Label und Sampling Statement bearbeiten.

interface NodePropertiesPanelProps {
  selectedNode: DiagramNode | null;  // Der ausgewählte Knoten (oder null)
  onUpdateNode: (id: string, updates: Partial<DiagramNode>) => void;
}

const NodePropertiesPanel: React.FC<NodePropertiesPanelProps> = ({
  selectedNode,
  onUpdateNode
}) => {
  // State für Beispiele ein/ausblenden
  const [showExamples, setShowExamples] = useState(false);

  // ----- HANDLER FÜR ÄNDERUNGEN -----
  
  // Label ändern
  const handleLabelChange = (newLabel: string) => {
    if (selectedNode) {
      onUpdateNode(selectedNode.id, { label: newLabel });
    }
  };

  // Sampling Statement ändern
  const handleStatementChange = (newStatement: string) => {
    if (selectedNode) {
      onUpdateNode(selectedNode.id, { samplingStatement: newStatement });
    }
  };

  // Beispiel-Statement übernehmen
  const handleExampleClick = (statement: string) => {
    if (selectedNode) {
      // Ersetze das erste Zeichen im Beispiel mit dem aktuellen Label
      const firstChar = statement.charAt(0);
      const adjustedStatement = statement.replace(firstChar, selectedNode.label);
      onUpdateNode(selectedNode.id, { samplingStatement: adjustedStatement });
    }
  };

  // ----- RENDERING -----
  return (
    <div className="node-properties-panel">
      {/* Header */}
      <div className="properties-header">
        <Settings size={16} className="properties-icon" />
        <h3 className="properties-title">Properties</h3>
      </div>

      <div className="properties-content">
        {selectedNode ? (
          // ===== KNOTEN AUSGEWÄHLT =====
          <>
            {/* Knoten-Info Badge */}
            <div className="node-type-badge">
              <span className={`badge ${selectedNode.type}`}>
                {selectedNode.type === 'observed' ? 'Observed' :
                 selectedNode.type === 'unobserved' ? 'Latent' :
                 'Deterministic'}
              </span>
              <span className={`badge ${selectedNode.shape}`}>
                {selectedNode.shape === 'circle' ? 'Continuous' : 'Discrete'}
              </span>
            </div>

            {/* Label-Eingabe */}
            <div className="property-group">
              <label className="property-label">Variable Name</label>
              <input
                type="text"
                value={selectedNode.label}
                onChange={(e) => handleLabelChange(e.target.value)}
                placeholder="z.B. θ, μ, σ"
                className="property-input property-input-label"
              />
              <p className="property-hint">
                Griechische Buchstaben: θ μ σ λ α β γ δ
              </p>
            </div>

            {/* Sampling Statement Eingabe */}
            <div className="property-group">
              <label className="property-label">Sampling Statement</label>
              <input
                type="text"
                value={selectedNode.samplingStatement || ''}
                onChange={(e) => handleStatementChange(e.target.value)}
                placeholder="z.B. θ ~ Normal(0, 1)"
                className="property-input property-input-statement"
              />
              <p className="property-hint">
                Stochastisch: <strong>~</strong> &nbsp;|&nbsp; Deterministisch: <strong>←</strong>
              </p>
            </div>

            {/* Beispiele (aufklappbar) */}
            <div className="property-group">
              <button 
                className="examples-toggle"
                onClick={() => setShowExamples(!showExamples)}
              >
                {showExamples ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                <span>Examples</span>
              </button>
              
              {showExamples && (
                <div className="examples-list">
                  {EXAMPLE_STATEMENTS.map((example, index) => (
                    <div
                      key={index}
                      className="example-item"
                      onClick={() => handleExampleClick(example.statement)}
                    >
                      <span className="example-statement">{example.statement}</span>
                      <span className="example-desc">{example.description}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Live-Vorschau */}
            {selectedNode.samplingStatement && (
              <div className="property-group">
                <label className="property-label">Preview</label>
                <div className="statement-preview">
                  {selectedNode.samplingStatement}
                </div>
              </div>
            )}
          </>
        ) : (
          // ===== KEIN KNOTEN AUSGEWÄHLT =====
          <div className="no-selection">
            <div className="no-selection-icon">
              <Settings size={32} strokeWidth={1.5} />
            </div>
            <p className="no-selection-text">Select a node to edit its properties</p>
            <p className="no-selection-hint">Click on a node in the canvas</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NodePropertiesPanel;

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, ChevronRight, Settings, RotateCcw } from 'lucide-react';
import { DiagramNode, DiagramPlate, EXAMPLE_STATEMENTS } from '../../types/index.ts';
import './NodePropertiesPanel.css';

// ===== GRIECHISCHE BUCHSTABEN =====
const GREEK_VARIABLES = ['θ', 'μ', 'σ', 'λ', 'α', 'β', 'γ', 'δ', 'φ', 'ψ', 'ω', 'π', 'ε', 'η', 'ν', 'κ', 'τ', 'ρ'];
const GREEK_INDICES   = ['i', 'j', 'k', 'n', 'N', 't', 's', 'p', 'm', 'T', 'S', 'K'];

// ===== FARBPALETTE =====
const NODE_COLOR_SWATCHES = [
  { color: '#a0aec0', label: 'Grau (Observed)' },
  { color: '#ffffff', label: 'Weiß (Latent)'   },
  { color: '#bfdbfe', label: 'Hellblau'         },
  { color: '#bbf7d0', label: 'Hellgrün'         },
  { color: '#fef9c3', label: 'Hellgelb'         },
  { color: '#fde68a', label: 'Gelb'             },
  { color: '#fed7aa', label: 'Lachs'            },
  { color: '#e9d5ff', label: 'Hellviolett'      },
  { color: '#fecdd3', label: 'Hellrot'          },
  { color: '#d1fae5', label: 'Mintgrün'         },
];

// ===== GREEK POPOVER KOMPONENTE =====
interface GreekPopoverProps {
  inputRef: React.RefObject<HTMLInputElement | null>;
  onInsert: (char: string) => void;
  showIndex?: boolean;
}

const GreekPopover: React.FC<GreekPopoverProps> = ({ inputRef, onInsert, showIndex = false }) => {
  const [open, setOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Klick außerhalb → schließen
  useEffect(() => {
    if (!open) return;
    const handleOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  // Zeichen an Cursor-Position einfügen
  const handleInsert = (char: string) => {
    const input = inputRef.current;
    if (!input) return;

    const start = input.selectionStart ?? input.value.length;
    const end   = input.selectionEnd   ?? input.value.length;
    const newValue = input.value.slice(0, start) + char + input.value.slice(end);

    // React controlled input: nativeInputValueSetter nötig um onChange zu triggern
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype, 'value'
    )?.set;
    nativeInputValueSetter?.call(input, newValue);
    input.dispatchEvent(new Event('input', { bubbles: true }));

    // Cursor nach dem eingefügten Zeichen
    requestAnimationFrame(() => {
      input.focus();
      input.setSelectionRange(start + char.length, start + char.length);
    });

    setOpen(false);
    onInsert(char);
  };

  return (
    <div className="greek-popover-wrapper" ref={popoverRef}>
      <button
        className="greek-trigger-btn"
        onClick={() => setOpen(o => !o)}
        title="Griechische Buchstaben einfügen"
        type="button"
      >
        Ω
      </button>

      {open && (
        <div className="greek-popover">
          <div className="greek-popover-section-label">Variablen</div>
          <div className="greek-popover-grid">
            {GREEK_VARIABLES.map(ch => (
              <button key={ch} className="greek-char-btn" onClick={() => handleInsert(ch)}>
                {ch}
              </button>
            ))}
          </div>

          {showIndex && (
            <>
              <div className="greek-popover-section-label greek-popover-section-label--second">Indizes</div>
              <div className="greek-popover-grid">
                {GREEK_INDICES.map(ch => (
                  <button key={ch} className="greek-char-btn index" onClick={() => handleInsert(ch)}>
                    {ch}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

// ===== HAUPTKOMPONENTE =====

interface NodePropertiesPanelProps {
  selectedNode: DiagramNode | null;
  selectedPlate: DiagramPlate | null;
  onUpdateNode: (id: string, updates: Partial<DiagramNode>) => void;
  onUpdatePlate: (id: string, updates: Partial<DiagramPlate>) => void;
}

const NodePropertiesPanel: React.FC<NodePropertiesPanelProps> = ({
  selectedNode,
  selectedPlate,
  onUpdateNode,
  onUpdatePlate,
}) => {
  const [showExamples, setShowExamples] = useState(false);

  // Refs für Input-Felder → werden an GreekPopover übergeben
  const labelInputRef      = useRef<HTMLInputElement>(null);
  const statementInputRef  = useRef<HTMLInputElement>(null);
  const plateIndexInputRef = useRef<HTMLInputElement>(null);

  // ----- HANDLER FÜR KNOTEN -----

  const handleLabelChange = (newLabel: string) => {
    if (selectedNode) onUpdateNode(selectedNode.id, { label: newLabel });
  };

  const handleStatementChange = (newStatement: string) => {
    if (selectedNode) onUpdateNode(selectedNode.id, { samplingStatement: newStatement });
  };

  // Nach Popover-Einfügung: React state mit aktuellem Input-Wert synchronisieren
  const handleLabelInsert = useCallback(() => {
    if (selectedNode && labelInputRef.current)
      onUpdateNode(selectedNode.id, { label: labelInputRef.current.value });
  }, [selectedNode, onUpdateNode]);

  const handleStatementInsert = useCallback(() => {
    if (selectedNode && statementInputRef.current)
      onUpdateNode(selectedNode.id, { samplingStatement: statementInputRef.current.value });
  }, [selectedNode, onUpdateNode]);

  const handlePlateIndexInsert = useCallback(() => {
    if (selectedPlate && plateIndexInputRef.current)
      onUpdatePlate(selectedPlate.id, { label: plateIndexInputRef.current.value });
  }, [selectedPlate, onUpdatePlate]);

  const handleExampleClick = (statement: string) => {
    if (selectedNode) {
      const firstChar = statement.charAt(0);
      const adjusted  = statement.replace(firstChar, selectedNode.label);
      onUpdateNode(selectedNode.id, { samplingStatement: adjusted });
    }
  };

  const handleNodeFillColorChange = (color: string) => { if (selectedNode) onUpdateNode(selectedNode.id, { fillColor: color }); };
  const handleNodeFillColorReset  = ()               => { if (selectedNode) onUpdateNode(selectedNode.id, { fillColor: undefined }); };

  // ----- HANDLER FÜR PLATE -----

  const handlePlateLabelChange = (newLabel: string) => {
    if (selectedPlate) onUpdatePlate(selectedPlate.id, { label: newLabel });
  };

  // ----- RENDERING -----
  return (
    <div className="node-properties-panel">
      <div className="properties-header">
        <Settings size={16} className="properties-icon" />
        <h3 className="properties-title">Properties</h3>
      </div>

      <div className="properties-content">

        {/* ===== KNOTEN AUSGEWÄHLT ===== */}
        {selectedNode && (
          <>
            <div className="node-type-badge">
              <span className={`badge ${selectedNode.type}`}>
                {selectedNode.type === 'observed' ? 'Observed' :
                 selectedNode.type === 'unobserved' ? 'Latent' : 'Deterministic'}
              </span>
              <span className={`badge ${selectedNode.shape}`}>
                {selectedNode.shape === 'circle' ? 'Continuous' : 'Discrete'}
              </span>
            </div>

            {/* Variable Name */}
            <div className="property-group">
              <label className="property-label">Variable Name</label>
              <div className="input-with-greek">
                <input
                  ref={labelInputRef}
                  type="text"
                  value={selectedNode.label}
                  onChange={(e) => handleLabelChange(e.target.value)}
                  placeholder="z.B. θ, μ, σ"
                  className="property-input property-input-label"
                />
                <GreekPopover inputRef={labelInputRef} onInsert={handleLabelInsert} showIndex={false} />
              </div>
            </div>

            {/* Füllfarbe */}
            <div className="property-group">
              <div className="property-label-row">
                <label className="property-label">Füllfarbe</label>
                {selectedNode.fillColor && (
                  <button className="color-reset-btn" onClick={handleNodeFillColorReset} title="Auf Standard zurücksetzen">
                    <RotateCcw size={11} /><span>Standard</span>
                  </button>
                )}
              </div>
              <div className="color-swatches">
                {NODE_COLOR_SWATCHES.map(({ color, label }) => (
                  <button
                    key={color}
                    className={`color-swatch ${(selectedNode.fillColor ?? '') === color ? 'active' : ''}`}
                    style={{ backgroundColor: color }}
                    title={label}
                    onClick={() => handleNodeFillColorChange(color)}
                  />
                ))}
              </div>
              <div className="color-picker-row">
                <input type="color" className="color-picker-input"
                  value={selectedNode.fillColor ?? '#ffffff'}
                  onChange={(e) => handleNodeFillColorChange(e.target.value)}
                  title="Eigene Farbe wählen"
                />
                <span className="color-picker-label">Eigene Farbe</span>
              </div>
            </div>

            {/* Sampling Statement */}
            <div className="property-group">
              <label className="property-label">Sampling Statement</label>
              <div className="input-with-greek">
                <input
                  ref={statementInputRef}
                  type="text"
                  value={selectedNode.samplingStatement || ''}
                  onChange={(e) => handleStatementChange(e.target.value)}
                  placeholder="z.B. θ ~ Normal(0, 1)"
                  className="property-input property-input-statement"
                />
                <GreekPopover inputRef={statementInputRef} onInsert={handleStatementInsert} showIndex={false} />
              </div>
              <p className="property-hint">
                Stochastisch: <strong>~</strong> &nbsp;|&nbsp; Deterministisch: <strong>←</strong>
              </p>
            </div>

            {/* Beispiele */}
            <div className="property-group">
              <button className="examples-toggle" onClick={() => setShowExamples(!showExamples)}>
                {showExamples ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                <span>Examples</span>
              </button>
              {showExamples && (
                <div className="examples-list">
                  {EXAMPLE_STATEMENTS.map((example, index) => (
                    <div key={index} className="example-item" onClick={() => handleExampleClick(example.statement)}>
                      <span className="example-statement">{example.statement}</span>
                      <span className="example-desc">{example.description}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selectedNode.samplingStatement && (
              <div className="property-group">
                <label className="property-label">Preview</label>
                <div className="statement-preview">{selectedNode.samplingStatement}</div>
              </div>
            )}
          </>
        )}

        {/* ===== PLATE AUSGEWÄHLT ===== */}
        {selectedPlate && !selectedNode && (
          <>
            <div className="node-type-badge">
              <span className="badge unobserved">Plate</span>
            </div>

            <div className="property-group">
              <label className="property-label">Index</label>
              <div className="input-with-greek">
                <input
                  ref={plateIndexInputRef}
                  type="text"
                  value={selectedPlate.label}
                  onChange={(e) => handlePlateLabelChange(e.target.value)}
                  placeholder="z.B. i, j, N"
                  className="property-input property-input-label"
                />
                <GreekPopover inputRef={plateIndexInputRef} onInsert={handlePlateIndexInsert} showIndex={true} />
              </div>
              <p className="property-hint">
                The index is located in the lower-right corner of the panel.
              </p>
            </div>
          </>
        )}

        {/* ===== NICHTS AUSGEWÄHLT ===== */}
        {!selectedNode && !selectedPlate && (
          <div className="no-selection">
            <div className="no-selection-icon">
              <Settings size={32} strokeWidth={1.5} />
            </div>
            <p className="no-selection-text">Select a node or plate to edit its properties</p>
            <p className="no-selection-hint">Click on an element in the canvas</p>
          </div>
        )}

      </div>
    </div>
  );
};

export default NodePropertiesPanel;

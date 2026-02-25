import React, { useState, useRef, useEffect } from 'react';
import { Workflow, Pencil } from 'lucide-react';
import './Header.css';

// ===== HEADER KOMPONENTE =====
// Diese Komponente zeigt den Titel der Anwendung an.
// NEU: Der Projektname ist jetzt editierbar (Click-to-Edit)

interface HeaderProps {
  projectName: string;
  onProjectNameChange: (newName: string) => void;  // Callback für Namensänderung
}

const Header: React.FC<HeaderProps> = ({ projectName, onProjectNameChange }) => {
  // ===== ZUSTAND FÜR EDIT-MODUS =====
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(projectName);
  const inputRef = useRef<HTMLInputElement>(null);

  // Wenn projectName sich extern ändert (z.B. beim Laden), aktualisiere editValue
  useEffect(() => {
    setEditValue(projectName);
  }, [projectName]);

  // Fokussiere das Input-Feld wenn Edit-Modus aktiviert wird
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();  // Text markieren
    }
  }, [isEditing]);

  // ===== EVENT HANDLERS =====

  // Startet den Edit-Modus
  const handleStartEdit = () => {
    setIsEditing(true);
    setEditValue(projectName);
  };

  // Speichert die Änderung
  const handleSave = () => {
    const trimmedValue = editValue.trim();
    if (trimmedValue) {
      onProjectNameChange(trimmedValue);
    } else {
      // Leerer Name nicht erlaubt - zurück zum alten Wert
      setEditValue(projectName);
    }
    setIsEditing(false);
  };

  // Abbrechen mit Escape
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditValue(projectName);  // Änderung verwerfen
      setIsEditing(false);
    }
  };

  // Speichern wenn Fokus verloren geht
  const handleBlur = () => {
    handleSave();
  };

  return (
    <header className="header">
      <div className="header-brand">
        <Workflow size={22} className="header-logo" />
        <span className="header-title">Plate Diagram Editor</span>
      </div>
      
      {/* ===== EDITIERBARER PROJEKTNAME ===== */}
      <div className="header-project-container">
        {isEditing ? (
          // Edit-Modus: Input-Feld anzeigen
          <input
            ref={inputRef}
            type="text"
            className="header-project-input"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            maxLength={50}  // Maximale Länge begrenzen
          />
        ) : (
          // Anzeige-Modus: Klickbarer Text
          <button 
            className="header-project-name"
            onClick={handleStartEdit}
            title="Klicken zum Bearbeiten"
          >
            <span>{projectName}</span>
            <Pencil size={12} className="header-edit-icon" />
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;

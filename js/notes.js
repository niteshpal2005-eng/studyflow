// StudyFlow Notes Module
import storage from './storage.js';

let activeNoteId = null;

export const NotesModule = {
  init() {
    this.cacheDOM();
    this.bindEvents();
    this.loadNotes();
  },

  cacheDOM() {
    this.notesListEl = document.getElementById('notes-list');
    this.noteSearchInput = document.getElementById('note-search');
    this.createNoteBtn = document.getElementById('create-note-btn');
    
    this.noteEditorContainer = document.getElementById('note-editor-container');
    this.noteTitleInput = document.getElementById('note-title-input');
    this.noteCategoryInput = document.getElementById('note-category-input');
    this.noteTextarea = document.getElementById('note-textarea');
    this.notePreviewPane = document.getElementById('note-preview-pane');
    this.deleteNoteBtn = document.getElementById('delete-note-btn');
  },

  bindEvents() {
    if (this.createNoteBtn) {
      this.createNoteBtn.addEventListener('click', () => this.createNewNote());
    }

    if (this.noteSearchInput) {
      this.noteSearchInput.addEventListener('input', () => this.renderNotesList());
    }

    if (this.noteTitleInput) {
      this.noteTitleInput.addEventListener('input', () => {
        this.updateActiveNote('title', this.noteTitleInput.value);
      });
    }

    if (this.noteCategoryInput) {
      this.noteCategoryInput.addEventListener('change', () => {
        this.updateActiveNote('category', this.noteCategoryInput.value);
      });
      this.noteCategoryInput.addEventListener('input', () => {
        this.updateActiveNote('category', this.noteCategoryInput.value);
      });
    }

    if (this.noteTextarea) {
      this.noteTextarea.addEventListener('input', () => {
        const text = this.noteTextarea.value;
        this.updateActiveNote('content', text);
        this.renderPreview(text);
      });
    }

    if (this.deleteNoteBtn) {
      this.deleteNoteBtn.addEventListener('click', () => this.deleteActiveNote());
    }
  },

  loadNotes() {
    const notes = storage.getNotes();
    if (notes.length > 0 && !activeNoteId) {
      activeNoteId = notes[0].id;
    }
    this.renderNotesList();
    this.renderEditor();
  },

  createNewNote() {
    const newNote = {
      id: 'note_' + Date.now(),
      title: 'Untitled Note',
      content: '',
      category: 'General',
      updatedAt: new Date().toISOString()
    };

    const notes = storage.getNotes();
    notes.unshift(newNote); // Put at top of list
    storage.saveNotes(notes);

    activeNoteId = newNote.id;
    if (this.noteSearchInput) this.noteSearchInput.value = '';
    
    this.renderNotesList();
    this.renderEditor();
  },

  deleteActiveNote() {
    if (!activeNoteId) return;
    if (!confirm('Are you sure you want to delete this note?')) return;

    const notes = storage.getNotes();
    const filtered = notes.filter(n => n.id !== activeNoteId);
    storage.saveNotes(filtered);

    activeNoteId = filtered.length > 0 ? filtered[0].id : null;
    this.loadNotes();
  },

  updateActiveNote(key, value) {
    if (!activeNoteId) return;

    const notes = storage.getNotes();
    const updated = notes.map(note => {
      if (note.id === activeNoteId) {
        return {
          ...note,
          [key]: value,
          updatedAt: new Date().toISOString()
        };
      }
      return note;
    });

    storage.saveNotes(updated);
    
    // Partially update note item card in the list to avoid complete list re-render on each keystroke
    const noteCard = document.querySelector(`.note-item[data-id="${activeNoteId}"]`);
    if (noteCard) {
      if (key === 'title') {
        const titleEl = noteCard.querySelector('.note-item-title');
        if (titleEl) titleEl.textContent = value || 'Untitled Note';
      } else if (key === 'content') {
        const previewEl = noteCard.querySelector('.note-item-preview');
        if (previewEl) previewEl.textContent = value || 'Empty note content...';
      }
      
      const metaEl = noteCard.querySelector('.note-item-meta span:first-child');
      if (metaEl && key === 'category') {
        metaEl.textContent = value;
      }
    }
  },

  renderNotesList() {
    if (!this.notesListEl) return;
    const notes = storage.getNotes();
    const query = this.noteSearchInput ? this.noteSearchInput.value.toLowerCase().trim() : '';

    this.notesListEl.innerHTML = '';

    const filtered = notes.filter(note => {
      return (
        note.title.toLowerCase().includes(query) ||
        note.content.toLowerCase().includes(query) ||
        note.category.toLowerCase().includes(query)
      );
    });

    if (filtered.length === 0) {
      this.notesListEl.innerHTML = `
        <p style="padding: 2rem; text-align: center; color: var(--text-muted);">
          No notes match your search.
        </p>
      `;
      return;
    }

    filtered.forEach(note => {
      const noteEl = document.createElement('div');
      noteEl.className = `note-item ${note.id === activeNoteId ? 'active' : ''}`;
      noteEl.dataset.id = note.id;
      
      const formattedDate = new Date(note.updatedAt).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric'
      });

      noteEl.innerHTML = `
        <div class="note-item-title">${this.escapeHTML(note.title) || 'Untitled Note'}</div>
        <div class="note-item-preview">${this.escapeHTML(note.content) || 'Empty note content...'}</div>
        <div class="note-item-meta">
          <span style="background: rgba(255,255,255,0.05); padding: 0.1rem 0.4rem; border-radius: 4px;">${this.escapeHTML(note.category)}</span>
          <span>${formattedDate}</span>
        </div>
      `;

      noteEl.addEventListener('click', () => {
        activeNoteId = note.id;
        this.renderNotesList();
        this.renderEditor();
      });

      this.notesListEl.appendChild(noteEl);
    });
  },

  renderEditor() {
    if (!this.noteEditorContainer) return;

    if (!activeNoteId) {
      this.noteEditorContainer.style.display = 'none';
      return;
    }

    this.noteEditorContainer.style.display = 'flex';
    const notes = storage.getNotes();
    const note = notes.find(n => n.id === activeNoteId);

    if (!note) return;

    this.noteTitleInput.value = note.title;
    this.noteCategoryInput.value = note.category;
    this.noteTextarea.value = note.content;
    
    this.renderPreview(note.content);
  },

  renderPreview(text) {
    if (this.notePreviewPane) {
      this.notePreviewPane.innerHTML = this.parseMarkdown(text);
    }
  },

  parseMarkdown(md) {
    if (!md) return '<p style="color: var(--text-muted); font-style: italic;">No preview available...</p>';
    
    // Basic HTML Entity Encoding
    let html = md
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    
    // Headings
    html = html.replace(/^# (.*?)$/gm, '<h1>$1</h1>');
    html = html.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
    html = html.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
    
    // Bold & Italics
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');
    html = html.replace(/_(.*?)_/g, '<em>$1</em>');
    
    // Inline Code
    html = html.replace(/`(.*?)`/g, '<code>$1</code>');
    
    // Paragraphs and Lists
    const lines = html.split('\n');
    let inList = false;
    const processedLines = [];
    
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].trim();
      
      const isBullet = line.startsWith('* ') || line.startsWith('- ');
      
      if (isBullet) {
        if (!inList) {
          processedLines.push('<ul style="margin-left: 1.5rem; margin-bottom: 0.75rem;">');
          inList = true;
        }
        processedLines.push(`<li style="margin-bottom: 0.25rem;">${line.substring(2)}</li>`);
      } else {
        if (inList) {
          processedLines.push('</ul>');
          inList = false;
        }
        
        if (line.trim()) {
          // If it isn't an H tag, wrap in paragraph
          if (!line.startsWith('<h1') && !line.startsWith('<h2') && !line.startsWith('<h3')) {
            processedLines.push(`<p style="margin-bottom: 0.75rem;">${line}</p>`);
          } else {
            processedLines.push(line);
          }
        } else {
          processedLines.push('');
        }
      }
    }
    
    if (inList) {
      processedLines.push('</ul>');
    }
    
    return processedLines.join('\n');
  },

  escapeHTML(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
};
export default NotesModule;

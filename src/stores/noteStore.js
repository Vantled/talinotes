import { defineStore } from 'pinia';
import { storageService } from '../services/storageService';
import { Preferences } from '@capacitor/preferences';

const FOLDERS_KEY = 'talinotes_folders';
const RECENTLY_DELETED_RETENTION_DAYS = 30;

export const useNoteStore = defineStore('notes', {
  state: () => ({
    notes: [],
    currentNote: null,
    loading: false,
    error: null,
    folders: [{ id: 'default', name: 'All Notes', noteIds: [] }],
    recentlyDeleted: [],
  }),

  getters: {
    getNoteById: (state) => (id) => {
      return state.notes.find(note => note.id === id);
    },
    getNotesByCategory: (state) => (category) => {
      return state.notes.filter(note => note.category === category);
    },
    getNotesByFolder: (state) => (folderId) => {
      if (folderId === 'default') {
        return state.notes;
      }
      const folder = state.folders.find(f => f.id === folderId);
      if (!folder) return [];
      return state.notes.filter(note => folder.noteIds.includes(note.id));
    }
  },

  actions: {
    async initialize() {
      this.purgeExpiredRecentlyDeleted();
      try {
        await this.loadFolders();
        await this.fetchNotes();
      } catch (error) {
        console.error('Error initializing store:', error);
        this.error = 'Failed to initialize app';
      }
    },

    async loadFolders() {
      try {
        const { value } = await Preferences.get({ key: FOLDERS_KEY });
        if (value) {
          const loadedFolders = JSON.parse(value);
          // Ensure default folder exists
          if (!loadedFolders.find(f => f.id === 'default')) {
            loadedFolders.unshift({ id: 'default', name: 'All Notes', noteIds: [] });
          }
          this.folders = loadedFolders;
          console.log('Folders loaded:', this.folders.length);
        } else {
          // If no folders, create default
          this.folders = [{ id: 'default', name: 'All Notes', noteIds: [] }];
          await this.saveFolders();
          console.log('Default folder created');
        }
      } catch (error) {
        console.error('Error loading folders:', error);
        // Ensure default folder exists even if there's an error
        if (!this.folders.find(f => f.id === 'default')) {
          this.folders = [{ id: 'default', name: 'All Notes', noteIds: [] }];
        }
        throw error;
      }
    },

    async saveFolders() {
      try {
        // Ensure default folder exists before saving
        if (!this.folders.find(f => f.id === 'default')) {
          this.folders.unshift({ id: 'default', name: 'All Notes', noteIds: [] });
        }
        await Preferences.set({ key: FOLDERS_KEY, value: JSON.stringify(this.folders) });
        console.log('Folders saved:', this.folders.length);
      } catch (error) {
        console.error('Error saving folders:', error);
        throw error;
      }
    },

    async fetchNotes() {
      this.loading = true;
      try {
        this.notes = await storageService.getNotes();
        this.recentlyDeleted = await storageService.getRecentlyDeleted();
        this.error = null;
        console.log('Notes fetched:', this.notes.length);
      } catch (error) {
        this.error = 'Failed to fetch notes';
        console.error('Error fetching notes:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async addNote(note, folderId = 'default') {
      this.loading = true;
      try {
        const newNote = await storageService.addNote(note);
        if (newNote) {
          this.notes.push(newNote);
          await this.moveNoteToFolder(newNote.id, folderId);
          this.error = null;
          console.log('Note added:', newNote.id);
          return newNote;
        } else {
          throw new Error('Failed to add note');
        }
      } catch (error) {
        this.error = 'Failed to add note';
        console.error('Error adding note:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async updateNote(note) {
      this.loading = true;
      try {
        const success = await storageService.updateNote(note);
        if (success) {
          await this.fetchNotes();
          this.error = null;
          console.log('Note updated:', note.id);
        } else {
          throw new Error('Failed to update note');
        }
      } catch (error) {
        this.error = 'Failed to update note';
        console.error('Error updating note:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async deleteNote(noteId) {
      this.loading = true;
      try {
        const note = this.notes.find(n => n.id === noteId);
        if (note) {
          // Remove from notes
          this.notes = this.notes.filter(n => n.id !== noteId);
          // Remove from folders
          this.folders.forEach(folder => {
            const idx = folder.noteIds.indexOf(noteId);
            if (idx !== -1) folder.noteIds.splice(idx, 1);
          });
          // Add to recentlyDeleted
          this.recentlyDeleted.unshift({ ...note, deletedAt: Date.now() });
          await storageService.deleteNote(noteId);
          await this.saveFolders();
          this.error = null;
          console.log('Note moved to recently deleted:', noteId);
        } else {
          throw new Error('Note not found');
        }
      } catch (error) {
        this.error = 'Failed to delete note';
        console.error('Error deleting note:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    purgeExpiredRecentlyDeleted() {
      const now = Date.now();
      this.recentlyDeleted = this.recentlyDeleted.filter(item => {
        const days = (now - item.deletedAt) / (1000 * 60 * 60 * 24);
        return days < RECENTLY_DELETED_RETENTION_DAYS;
      });
    },

    daysRemaining(item) {
      const now = Date.now();
      const days = RECENTLY_DELETED_RETENTION_DAYS - Math.floor((now - item.deletedAt) / (1000 * 60 * 60 * 24));
      return days > 0 ? days : 0;
    },

    async restoreNote(noteId) {
      this.purgeExpiredRecentlyDeleted();
      const idx = this.recentlyDeleted.findIndex(n => n.id === noteId);
      if (idx !== -1) {
        const note = { ...this.recentlyDeleted[idx] };
        delete note.deletedAt;
        this.notes.unshift(note);
        // Add back to default folder
        const defaultFolder = this.folders.find(f => f.id === 'default');
        if (defaultFolder && !defaultFolder.noteIds.includes(note.id)) {
          defaultFolder.noteIds.push(note.id);
        }
        this.recentlyDeleted.splice(idx, 1);
        // Save changes to storage
        await this.saveNotes();
        await this.saveFolders();
        return true;
      }
      return false;
    },

    async permanentDeleteNote(noteId) {
      const idx = this.recentlyDeleted.findIndex(n => n.id === noteId);
      if (idx !== -1) {
        this.recentlyDeleted.splice(idx, 1);
        await this.saveNotes();
        return true;
      }
      return false;
    },

    async searchNotes(query) {
      this.loading = true;
      try {
        const results = await storageService.searchNotes(query);
        this.notes = results;
        this.error = null;
      } catch (error) {
        this.error = 'Failed to search notes';
        console.error(error);
      } finally {
        this.loading = false;
      }
    },

    setCurrentNote(note) {
      this.currentNote = note;
    },

    clearCurrentNote() {
      this.currentNote = null;
    },

    async addFolder(name = 'New Folder') {
      try {
        const id = Date.now().toString();
        this.folders.push({ id, name, noteIds: [] });
        await this.saveFolders();
        console.log('Folder added:', id);
      } catch (error) {
        console.error('Error adding folder:', error);
        throw error;
      }
    },

    async renameFolder(folderId, newName) {
      try {
        if (folderId === 'default') return; // Don't rename default folder
        const folder = this.folders.find(f => f.id === folderId);
        if (folder) {
          folder.name = newName;
          await this.saveFolders();
          console.log('Folder renamed:', folderId);
        }
      } catch (error) {
        console.error('Error renaming folder:', error);
        throw error;
      }
    },

    async deleteFolder(folderId) {
      try {
        if (folderId === 'default') return; // Don't delete default
        const idx = this.folders.findIndex(f => f.id === folderId);
        if (idx !== -1) {
          // Move notes to default folder
          const folder = this.folders[idx];
          const defaultFolder = this.folders.find(f => f.id === 'default');
          if (defaultFolder) {
            defaultFolder.noteIds.push(...folder.noteIds);
          }
          this.folders.splice(idx, 1);
          await this.saveFolders();
          console.log('Folder deleted:', folderId);
        }
      } catch (error) {
        console.error('Error deleting folder:', error);
        throw error;
      }
    },

    async moveNoteToFolder(noteId, targetFolderId) {
      try {
        // If moving to default folder, just remove from other folders
        if (targetFolderId === 'default') {
          this.folders.forEach(folder => {
            if (folder.id !== 'default') {
              const idx = folder.noteIds.indexOf(noteId);
              if (idx !== -1) folder.noteIds.splice(idx, 1);
            }
          });
        } else {
          // Remove from all folders
          this.folders.forEach(folder => {
            const idx = folder.noteIds.indexOf(noteId);
            if (idx !== -1) folder.noteIds.splice(idx, 1);
          });

          // Add to target folder
          const target = this.folders.find(f => f.id === targetFolderId);
          if (target && !target.noteIds.includes(noteId)) {
            target.noteIds.push(noteId);
          }
        }

        // Save changes
        await this.saveFolders();
        console.log('Note moved to folder:', noteId, targetFolderId);
        return true;
      } catch (error) {
        console.error('Error moving note:', error);
        throw error;
      }
    },

    async saveNotes() {
      try {
        await storageService.saveNotes(this.notes, this.recentlyDeleted);
      } catch (error) {
        console.error('Error saving notes:', error);
        throw error;
      }
    }
  }
}); 
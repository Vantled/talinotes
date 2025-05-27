import { Preferences } from '@capacitor/preferences';

const NOTES_KEY = 'talinotes_notes';
const RECENTLY_DELETED_KEY = 'talinotes_recently_deleted';

export const storageService = {
  async addNote(note) {
    try {
      const notes = await this.getNotes();
      const newNote = { 
        ...note, 
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      const updatedNotes = [...notes, newNote];
      await Preferences.set({ key: NOTES_KEY, value: JSON.stringify(updatedNotes) });
      console.log('Note saved successfully:', newNote.id);
      return newNote;
    } catch (error) {
      console.error('Error saving note:', error);
      throw error; // Propagate error to caller
    }
  },

  async getNotes() {
    try {
      const { value } = await Preferences.get({ key: NOTES_KEY });
      const notes = value ? JSON.parse(value) : [];
      console.log('Retrieved notes:', notes.length);
      return notes;
    } catch (error) {
      console.error('Error getting notes:', error);
      throw error; // Propagate error to caller
    }
  },

  async updateNote(updatedNote) {
    try {
      const notes = await this.getNotes();
      const index = notes.findIndex(note => note.id === updatedNote.id);
      if (index !== -1) {
        notes[index] = { 
          ...updatedNote,
          updatedAt: new Date().toISOString()
        };
        await Preferences.set({ key: NOTES_KEY, value: JSON.stringify(notes) });
        console.log('Note updated successfully:', updatedNote.id);
        return true;
      }
      console.warn('Note not found for update:', updatedNote.id);
      return false;
    } catch (error) {
      console.error('Error updating note:', error);
      throw error; // Propagate error to caller
    }
  },

  async deleteNote(noteId) {
    try {
      const notes = await this.getNotes();
      const filteredNotes = notes.filter(note => note.id !== noteId);
      await Preferences.set({ key: NOTES_KEY, value: JSON.stringify(filteredNotes) });
      console.log('Note deleted successfully:', noteId);
      return true;
    } catch (error) {
      console.error('Error deleting note:', error);
      throw error; // Propagate error to caller
    }
  },

  async searchNotes(query) {
    try {
      const notes = await this.getNotes();
      const searchQuery = query.toLowerCase();
      return notes.filter(note => 
        note.title.toLowerCase().includes(searchQuery) ||
        note.content.toLowerCase().includes(searchQuery)
      );
    } catch (error) {
      console.error('Error searching notes:', error);
      throw error; // Propagate error to caller
    }
  },

  async saveNotes(notes, recentlyDeleted) {
    await Preferences.set({ key: NOTES_KEY, value: JSON.stringify(notes) });
    await Preferences.set({ key: RECENTLY_DELETED_KEY, value: JSON.stringify(recentlyDeleted) });
  },

  async getRecentlyDeleted() {
    const { value } = await Preferences.get({ key: RECENTLY_DELETED_KEY });
    return value ? JSON.parse(value) : [];
  }
}; 
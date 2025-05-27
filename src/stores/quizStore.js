import { defineStore } from 'pinia';
import { Preferences } from '@capacitor/preferences';
import { aiService } from '../services/aiService';

const QUIZZES_KEY = 'talinotes_quizzes';
const QUIZ_FOLDERS_KEY = 'talinotes_quiz_folders';
const RECENTLY_DELETED_RETENTION_DAYS = 30;

export const useQuizStore = defineStore('quizzes', {
  state: () => ({
    quizzes: [],
    currentQuiz: null,
    loading: false,
    error: null,
    folders: [{ id: 'default', name: 'All Quizzes', quizIds: [] }],
    recentlyDeleted: [],
    activeFolderId: 'default',
  }),

  getters: {
    getQuizById: (state) => (id) => {
      return state.quizzes.find(quiz => quiz.id === id);
    },
    getQuizzesByNoteId: (state) => (noteId) => {
      return state.quizzes.filter(quiz => quiz.noteId === noteId);
    },
    getQuizzesByFolder: (state) => (folderId) => {
      if (folderId === 'default') {
        return state.quizzes;
      }
      const folder = state.folders.find(f => f.id === folderId);
      if (!folder) return [];
      return state.quizzes.filter(quiz => folder.quizIds.includes(quiz.id));
    }
  },

  actions: {
    async initialize() {
      this.purgeExpiredRecentlyDeleted();
      await this.loadFolders();
      await this.loadQuizzes();
    },

    async loadFolders() {
      try {
        const { value } = await Preferences.get({ key: QUIZ_FOLDERS_KEY });
        if (value) {
          const loadedFolders = JSON.parse(value);
          if (!loadedFolders.find(f => f.id === 'default')) {
            loadedFolders.unshift({ id: 'default', name: 'All Quizzes', quizIds: [] });
          }
          this.folders = loadedFolders;
        } else {
          this.folders = [{ id: 'default', name: 'All Quizzes', quizIds: [] }];
          await this.saveFolders();
        }
      } catch (error) {
        if (!this.folders.find(f => f.id === 'default')) {
          this.folders = [{ id: 'default', name: 'All Quizzes', quizIds: [] }];
        }
        throw error;
      }
    },

    async saveFolders() {
      if (!this.folders.find(f => f.id === 'default')) {
        this.folders.unshift({ id: 'default', name: 'All Quizzes', quizIds: [] });
      }
      await Preferences.set({ key: QUIZ_FOLDERS_KEY, value: JSON.stringify(this.folders) });
    },

    async loadQuizzes() {
      this.loading = true;
      try {
        const { value } = await Preferences.get({ key: QUIZZES_KEY });
        if (value) {
          this.quizzes = JSON.parse(value);
        }
      } catch (error) {
        this.error = 'Failed to load quizzes';
        console.error('Error loading quizzes:', error);
      } finally {
        this.loading = false;
      }
    },

    async saveQuizzes() {
      try {
        await Preferences.set({
          key: QUIZZES_KEY,
          value: JSON.stringify(this.quizzes)
        });
      } catch (error) {
        this.error = 'Failed to save quizzes';
        console.error('Error saving quizzes:', error);
      }
    },

    async addQuiz(quiz, folderId = 'default') {
      this.quizzes.push(quiz);
      await this.saveQuizzes();
      await this.moveQuizToFolder(quiz.id, folderId);
    },

    async updateQuiz(quiz) {
      const index = this.quizzes.findIndex(q => q.id === quiz.id);
      if (index !== -1) {
        this.quizzes[index] = quiz;
        await this.saveQuizzes();
      }
    },

    async deleteQuiz(quizId) {
      const quiz = this.quizzes.find(q => q.id === quizId);
      if (quiz) {
        // Remove from quizzes
        this.quizzes = this.quizzes.filter(q => q.id !== quizId);
        // Remove from folders
        this.folders.forEach(folder => {
          const idx = folder.quizIds.indexOf(quizId);
          if (idx !== -1) folder.quizIds.splice(idx, 1);
        });
        // Add to recentlyDeleted
        this.recentlyDeleted.unshift({ ...quiz, deletedAt: Date.now() });
        await this.saveQuizzes();
        await this.saveFolders();
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

    async restoreQuiz(quizId) {
      this.purgeExpiredRecentlyDeleted();
      const idx = this.recentlyDeleted.findIndex(q => q.id === quizId);
      if (idx !== -1) {
        const quiz = { ...this.recentlyDeleted[idx] };
        delete quiz.deletedAt;
        this.quizzes.unshift(quiz);
        // Add back to default folder
        const defaultFolder = this.folders.find(f => f.id === 'default');
        if (defaultFolder && !defaultFolder.quizIds.includes(quiz.id)) {
          defaultFolder.quizIds.push(quiz.id);
        }
        this.recentlyDeleted.splice(idx, 1);
        // Save changes to storage
        await this.saveQuizzes();
        await this.saveFolders();
        return true;
      }
      return false;
    },

    setCurrentQuiz(quiz) {
      this.currentQuiz = quiz;
    },

    clearCurrentQuiz() {
      this.currentQuiz = null;
    },

    async addFolder(name = 'New Folder') {
      const id = Date.now().toString();
      this.folders.push({ id, name, quizIds: [] });
      await this.saveFolders();
    },

    async renameFolder(folderId, newName) {
      if (folderId === 'default') return;
      const folder = this.folders.find(f => f.id === folderId);
      if (folder) {
        folder.name = newName;
        await this.saveFolders();
      }
    },

    async deleteFolder(folderId) {
      if (folderId === 'default') return;
      const idx = this.folders.findIndex(f => f.id === folderId);
      if (idx !== -1) {
        // Move quizzes to default folder
        const folder = this.folders[idx];
        const defaultFolder = this.folders.find(f => f.id === 'default');
        if (defaultFolder) {
          defaultFolder.quizIds.push(...folder.quizIds);
        }
        this.folders.splice(idx, 1);
        await this.saveFolders();
      }
    },

    async moveQuizToFolder(quizId, targetFolderId) {
      if (targetFolderId === 'default') {
        this.folders.forEach(folder => {
          if (folder.id !== 'default') {
            const idx = folder.quizIds.indexOf(quizId);
            if (idx !== -1) folder.quizIds.splice(idx, 1);
          }
        });
      } else {
        this.folders.forEach(folder => {
          const idx = folder.quizIds.indexOf(quizId);
          if (idx !== -1) folder.quizIds.splice(idx, 1);
        });
        const target = this.folders.find(f => f.id === targetFolderId);
        if (target && !target.quizIds.includes(quizId)) {
          target.quizIds.push(quizId);
        }
      }
      await this.saveFolders();
    },

    setActiveFolder(folderId) {
      this.activeFolderId = folderId;
    },

    async generateQuizFromNote(note, folderId = 'default') {
      this.loading = true;
      this.error = null;
      try {
        if (!note || !note.content) {
          throw new Error('Invalid note: missing content');
        }
        const content = note.content.replace(/<[^>]*>/g, ' ').trim();
        if (!content) {
          throw new Error('No text content found in note');
        }
        const questions = await aiService.generateQuiz(content);
        if (!questions || !Array.isArray(questions) || questions.length === 0) {
          throw new Error('No questions were generated');
        }
        const quiz = {
          id: crypto.randomUUID(),
          noteId: note.id,
          title: `Quiz for ${note.title}`,
          questions,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        await this.addQuiz(quiz, folderId);
        return quiz;
      } catch (error) {
        this.error = error.message || 'Failed to generate quiz';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async permanentDeleteQuiz(quizId) {
      const idx = this.recentlyDeleted.findIndex(q => q.id === quizId);
      if (idx !== -1) {
        this.recentlyDeleted.splice(idx, 1);
        await this.saveQuizzes();
        return true;
      }
      return false;
    }
  }
}); 
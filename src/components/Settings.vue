<template>
  <div class="max-w-xl mx-auto bg-white dark:bg-gray-900 rounded-xl shadow-sm p-4">
    <!-- Appearance Section -->
    <section class="mb-8">
      <h2 class="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">Appearance</h2>
      <div class="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-lg px-4 py-3">
        <span class="text-gray-700 dark:text-gray-200 font-medium">Dark Mode</span>
        <label class="inline-flex items-center cursor-pointer relative">
          <input type="checkbox" class="sr-only peer" :checked="isDarkMode" @change="handleToggleDarkMode" aria-label="Toggle dark mode" />
          <div class="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:bg-blue-600 dark:peer-checked:bg-blue-500 transition-colors duration-300 relative"></div>
          <div class="absolute left-0 top-0 ml-1 mt-1 w-4 h-4 bg-white dark:bg-gray-200 rounded-full shadow transform transition-transform duration-300" :class="isDarkMode ? 'translate-x-5' : ''"></div>
        </label>
      </div>
    </section>

    <!-- Storage Section -->
    <section class="mb-8">
      <h2 class="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">Storage & Performance</h2>
      <div class="flex space-x-2 mb-4">
        <button
          :class="['px-4 py-2 rounded-t-lg font-medium focus:outline-none', storageTab === 'storage' ? 'bg-blue-600 text-white dark:bg-blue-700' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200']"
          @click="storageTab = 'storage'"
        >Storage</button>
        <button
          :class="['px-4 py-2 rounded-t-lg font-medium focus:outline-none', storageTab === 'deleted' ? 'bg-blue-600 text-white dark:bg-blue-700' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200']"
          @click="handleDeletedTabClick"
        >Recently Deleted</button>
      </div>
      <div v-if="storageTab === 'storage'">
        <div class="bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-3 flex items-center justify-between mb-3">
          <div>
            <div class="font-semibold text-gray-800 dark:text-gray-200">Storage Used</div>
            <div class="text-xs text-gray-500 dark:text-gray-400">{{ notesCount }} notes • {{ quizzesCount }} quizzes</div>
          </div>
          <div class="text-sm font-semibold text-gray-600 dark:text-gray-300">{{ storageSize }} KB</div>
        </div>
        <button
          @click="handleClearStorage"
          class="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none font-medium"
          aria-label="Clear Cache & Temporary Files"
        >
          <svg class="w-5 h-5 mr-1 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M8 7V5a4 4 0 018 0v2"/></svg>
          Clear Cache & Temporary Files
        </button>
      </div>
      <div v-else class="bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-3">
        <h3 class="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">Recently Deleted Notes</h3>
        <ul v-if="noteStore.recentlyDeleted.length" class="mb-4 divide-y divide-gray-200 dark:divide-gray-700">
          <li v-for="note in noteStore.recentlyDeleted" :key="note.id" class="py-2 flex items-center justify-between">
            <div>
              <div class="font-medium text-gray-900 dark:text-gray-100">{{ note.title || 'Untitled Note' }}</div>
              <div class="text-xs text-gray-500 dark:text-gray-400">Deleted {{ formatDate(note.deletedAt) }}</div>
            </div>
            <div class="flex gap-2">
              <button @click="handleRestoreNote(note)" class="px-3 py-1 rounded bg-blue-600 dark:bg-blue-700 text-white hover:bg-blue-700 dark:hover:bg-blue-800 text-xs font-semibold" aria-label="Restore Note">Restore</button>
              <button @click="handlePermanentDelete(note)" class="px-3 py-1 rounded bg-red-600 dark:bg-red-700 text-white hover:bg-red-700 dark:hover:bg-red-800 text-xs font-semibold" aria-label="Permanently Delete Note">Delete</button>
            </div>
          </li>
        </ul>
        <div v-else class="text-gray-400 dark:text-gray-500 text-sm mb-4">No recently deleted notes.</div>
        <h3 class="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">Recently Deleted Quizzes</h3>
        <ul v-if="quizStore.recentlyDeleted.length" class="divide-y divide-gray-200 dark:divide-gray-700">
          <li v-for="quiz in quizStore.recentlyDeleted" :key="quiz.id" class="py-2 flex items-center justify-between">
            <div>
              <div class="font-medium text-gray-900 dark:text-gray-100">{{ quiz.title || 'Untitled Quiz' }}</div>
              <div class="text-xs text-gray-500 dark:text-gray-400">Deleted {{ formatDate(quiz.deletedAt) }}</div>
            </div>
            <div class="flex gap-2">
              <button @click="handleRestoreQuiz(quiz)" class="px-3 py-1 rounded bg-blue-600 dark:bg-blue-700 text-white hover:bg-blue-700 dark:hover:bg-blue-800 text-xs font-semibold" aria-label="Restore Quiz">Restore</button>
              <button @click="handlePermanentDeleteQuiz(quiz)" class="px-3 py-1 rounded bg-red-600 dark:bg-red-700 text-white hover:bg-red-700 dark:hover:bg-red-800 text-xs font-semibold" aria-label="Permanently Delete Quiz">Delete</button>
            </div>
          </li>
        </ul>
        <div v-else-if="!quizStore.recentlyDeleted.length" class="text-gray-400 dark:text-gray-500 text-sm">No recently deleted quizzes.</div>
      </div>
    </section>

    <!-- Help & Information Section -->
    <section>
      <h2 class="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">Help & Information</h2>
      <div class="space-y-3">
        <button
          @click="handleAboutClickModal"
          class="w-full flex items-center px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-left hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none"
          aria-label="About Talinotes"
        >
          <span class="font-medium text-black dark:text-gray-100">About</span>
        </button>
        <button
          @click="showHowToUseModal = true"
          class="w-full flex items-center px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-left hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none"
          aria-label="How to Use Talinotes"
        >
          <span class="font-medium text-black dark:text-gray-100">How to Use</span>
        </button>
      </div>
      <div class="text-center text-xs text-gray-400 dark:text-gray-500 mt-8">
        Talinotes v1.0.0<br />
        2025 Talinotes. Final Project for Mobile Computing<br />
        Under the class of Prof. Alejandro V. Matute Jr.
      </div>
    </section>

    <!-- About Modal -->
    <div v-if="showAboutModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div class="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 w-full max-w-md relative">
        <button @click="showAboutModal = false" class="absolute top-2 right-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200" aria-label="Close Modal">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
        <h3 class="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">About Talinotes</h3>
        <p class="text-gray-700 dark:text-gray-200 mb-2">
          Talinotes is a modern note-taking app with AI-powered quiz generation. Effortlessly create, organize, and review notes, and turn your content into interactive quizzes to boost your learning and retention.
        </p>
        <p class="text-xs text-gray-400 dark:text-gray-500 mt-4">Version 1.0.0 &copy; © 2025 Talinotes. Final Project for Mobile Computing<br />
          Under the class of Prof. Alejandro V. Matute Jr.</p>
      </div>
    </div>

    <!-- How to Use Modal -->
    <div v-if="showHowToUseModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div class="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 w-full max-w-md relative">
        <button @click="showHowToUseModal = false" class="absolute top-2 right-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200" aria-label="Close Modal">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
        <h3 class="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">How to Use Talinotes</h3>
        <div class="space-y-4">
          <div class="text-left">
            <h4 class="font-medium text-gray-900 dark:text-gray-100 mb-2">Notes & Folders</h4>
            <ul class="list-disc pl-5 text-gray-700 dark:text-gray-200 space-y-2 text-sm">
              <li>Create and organize notes in folders for better organization</li>
              <li>Double-tap a folder to access actions (rename, delete, etc.)</li>
              <li>Long-press a note to access quick actions</li>
              <li>Use the search bar to find notes quickly</li>
            </ul>
          </div>

          <div class="text-left">
            <h4 class="font-medium text-gray-900 dark:text-gray-100 mb-2">Note Taking</h4>
            <ul class="list-disc pl-5 text-gray-700 dark:text-gray-200 space-y-2 text-sm">
              <li>Tap a note to view or edit its content</li>
              <li>Use markdown formatting for rich text editing</li>
              <li>Add tags to categorize your notes</li>
              <li>Pin important notes for quick access</li>
            </ul>
          </div>

          <div class="text-left">
            <h4 class="font-medium text-gray-900 dark:text-gray-100 mb-2">Quiz Generation</h4>
            <ul class="list-disc pl-5 text-gray-700 dark:text-gray-200 space-y-2 text-sm">
              <li>Generate quizzes from your notes with AI assistance</li>
              <li>Customize quiz difficulty and question types</li>
              <li>Review your quiz history and performance</li>
              <li>Share quizzes with other users</li>
            </ul>
          </div>

          <div class="text-left">
            <h4 class="font-medium text-gray-900 dark:text-gray-100 mb-2">App Settings</h4>
            <ul class="list-disc pl-5 text-gray-700 dark:text-gray-200 space-y-2 text-sm">
              <li>Toggle between light and dark mode</li>
              <li>Manage storage and clear cache</li>
              <li>Restore recently deleted notes</li>
              <li>Configure backup settings</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Hidden Dynamic Config Modal -->
    <div v-if="showConfigModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div class="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 w-full max-w-md relative">
        <button @click="showConfigModal = false" class="absolute top-2 right-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200" aria-label="Close Modal">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
        <h3 class="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Dynamic Configuration</h3>
        
        <!-- Profile Management -->
        <div class="mb-4">
          <div class="flex items-center justify-between mb-2">
            <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300">Configuration Profiles</h4>
            <button @click="showSaveProfileModal = true" class="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
              Save Current as Profile
            </button>
          </div>
          <div class="space-y-2">
            <div v-for="(profile, name) in profiles" :key="name" class="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div class="flex items-center gap-2">
                <span class="text-sm text-gray-900 dark:text-gray-100">{{ name }}</span>
                <span v-if="name === activeProfile" class="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">Active</span>
              </div>
              <div class="flex gap-2">
                <button 
                  v-if="name !== activeProfile"
                  @click="handleLoadProfile(name)" 
                  class="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                >
                  Load
                </button>
                <button @click="handleDeleteProfile(name)" class="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300">
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Current Server URLs</h4>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-600 dark:text-gray-400">Backend Server:</span>
              <span class="text-gray-900 dark:text-gray-100 font-mono">{{ config.BACKEND_URL || 'Not configured' }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600 dark:text-gray-400">Python Service:</span>
              <span class="text-gray-900 dark:text-gray-100 font-mono">{{ config.PYTHON_SERVICE_URL || 'Not configured' }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600 dark:text-gray-400">LM Studio:</span>
              <span class="text-gray-900 dark:text-gray-100 font-mono">{{ config.LM_STUDIO_URL || 'Not configured' }}</span>
            </div>
          </div>
        </div>

        <form @submit.prevent="handleSaveConfig" class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100">Backend Server URL</label>
            <input v-model="localConfig.BACKEND_URL" type="text" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100">Python Service URL</label>
            <input v-model="localConfig.PYTHON_SERVICE_URL" type="text" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100">LM Studio URL</label>
            <input v-model="localConfig.LM_STUDIO_URL" type="text" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" />
          </div>
          <div class="flex gap-2 mt-4">
            <button type="submit" class="flex-1 px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-800">Save</button>
            <button type="button" @click="handleResetConfig" class="flex-1 px-4 py-2 bg-gray-500 dark:bg-gray-700 text-white rounded-md hover:bg-gray-600 dark:hover:bg-gray-800">Reset</button>
          </div>
        </form>
        <div v-if="configMessage" class="mt-4 text-center text-sm" :class="configMessageType === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
          {{ configMessage }}
        </div>
      </div>
    </div>

    <!-- Save Profile Modal -->
    <div v-if="showSaveProfileModal" class="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-40">
      <div class="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 w-full max-w-xs mx-4 relative">
        <button @click="showSaveProfileModal = false" class="absolute top-2 right-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200" aria-label="Close Modal">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
        <h3 class="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Save Profile</h3>
        <form @submit.prevent="handleSaveProfile" class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100">Profile Name</label>
            <input v-model="newProfileName" type="text" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" placeholder="e.g., Home Network" />
          </div>
          <div class="flex justify-end gap-2">
            <button type="button" @click="showSaveProfileModal = false" class="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">Cancel</button>
            <button type="submit" class="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-800">Save</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Permanent Delete Confirmation Modal for Note -->
    <teleport to="body">
      <div v-if="showPermanentDeleteConfirm" class="fixed inset-0 z-[10000] flex items-center justify-center bg-black bg-opacity-40">
        <div class="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 w-full max-w-xs mx-4 relative border border-gray-200 dark:border-gray-700">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Permanently Delete Note?</h3>
          <p class="text-gray-700 dark:text-gray-300 mb-4">Are you sure you want to permanently delete this note? This action cannot be undone.</p>
          <div class="flex justify-end gap-2">
            <button @click="handleCancelPermanentDelete" class="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-black dark:text-gray-100 font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-all">Cancel</button>
            <button @click="handleConfirmPermanentDelete" class="px-4 py-2 rounded bg-red-600 text-white font-semibold hover:bg-red-700 transition-all">Delete</button>
          </div>
        </div>
      </div>
    </teleport>

    <!-- Permanent Delete Confirmation Modal for Quiz -->
    <teleport to="body">
      <div v-if="showPermanentDeleteConfirmQuiz" class="fixed inset-0 z-[10000] flex items-center justify-center bg-black bg-opacity-40">
        <div class="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 w-full max-w-xs mx-4 relative border border-gray-200 dark:border-gray-700">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Permanently Delete Quiz?</h3>
          <p class="text-gray-700 dark:text-gray-300 mb-4">Are you sure you want to permanently delete this quiz? This action cannot be undone.</p>
          <div class="flex justify-end gap-2">
            <button @click="handleCancelPermanentDeleteQuiz" class="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-black dark:text-gray-100 font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-all">Cancel</button>
            <button @click="handleConfirmPermanentDeleteQuiz" class="px-4 py-2 rounded bg-red-600 text-white font-semibold hover:bg-red-700 transition-all">Delete</button>
          </div>
        </div>
      </div>
    </teleport>

    <!-- Restore Confirmation Modal for Note -->
    <teleport to="body">
      <div v-if="showRestoreConfirmNote" class="fixed inset-0 z-[10000] flex items-center justify-center bg-black bg-opacity-40">
        <div class="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 w-full max-w-xs mx-4 relative border border-gray-200 dark:border-gray-700">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Restore Note?</h3>
          <p class="text-gray-700 dark:text-gray-300 mb-4">Are you sure you want to restore this note?</p>
          <div class="flex justify-end gap-2">
            <button @click="handleCancelRestoreNote" class="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-black dark:text-gray-100 font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-all">Cancel</button>
            <button @click="handleConfirmRestoreNote" class="px-4 py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-all">Restore</button>
          </div>
        </div>
      </div>
    </teleport>

    <!-- Restore Confirmation Modal for Quiz -->
    <teleport to="body">
      <div v-if="showRestoreConfirmQuiz" class="fixed inset-0 z-[10000] flex items-center justify-center bg-black bg-opacity-40">
        <div class="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 w-full max-w-xs mx-4 relative border border-gray-200 dark:border-gray-700">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Restore Quiz?</h3>
          <p class="text-gray-700 dark:text-gray-300 mb-4">Are you sure you want to restore this quiz?</p>
          <div class="flex justify-end gap-2">
            <button @click="handleCancelRestoreQuiz" class="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-black dark:text-gray-100 font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-all">Cancel</button>
            <button @click="handleConfirmRestoreQuiz" class="px-4 py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-all">Restore</button>
          </div>
        </div>
      </div>
    </teleport>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, onUnmounted, watch, nextTick } from 'vue';
import { useDarkMode } from '../useDarkMode';
import { config, updateConfig, resetConfig } from '../config';
import { configService } from '../services/configService';
import { useNoteStore } from '../stores/noteStore';
import { useQuizStore } from '../stores/quizStore';
import { useUiStore } from '../stores/uiStore';

// Appearance
const { isDarkMode, toggleDarkMode } = useDarkMode();
const handleToggleDarkMode = toggleDarkMode;

// Storage
const noteStore = useNoteStore();
const quizStore = useQuizStore();
const notesCount = computed(() => noteStore.notes.length);
const quizzesCount = computed(() => quizStore.quizzes.length);
const storageSize = computed(() => {
  // Estimate: 1 note = 1 KB, 1 quiz = 2 KB (adjust as needed)
  return (notesCount.value * 1 + quizzesCount.value * 2).toFixed(2);
});

const handleClearStorage = () => {
  // TODO: Implement real cache clearing
  alert('Cache & temporary files cleared!');
};

// Modals
const showAboutModal = ref(false);
const showHowToUseModal = ref(false);

// Hidden Dynamic Config Modal
const showConfigModal = ref(false);
const deletedClickCount = ref(0);
let deletedClickTimeout = null;

const handleAboutClickModal = () => {
  showAboutModal.value = true;
};

const handleDeletedTabClick = () => {
  storageTab.value = 'deleted';
  // Count clicks for hidden config
  deletedClickCount.value++;
  if (deletedClickTimeout) clearTimeout(deletedClickTimeout);
  deletedClickTimeout = setTimeout(() => {
    if (deletedClickCount.value >= 5) {
      showConfigModal.value = true;
    }
    deletedClickCount.value = 0;
  }, 800);
};

// Dynamic Config
const localConfig = ref({
  BACKEND_URL: '',
  PYTHON_SERVICE_URL: '',
  LM_STUDIO_URL: ''
});
const configMessage = ref('');
const configMessageType = ref('');

const uiStore = useUiStore();

// Profile Management
const profiles = ref({});
const showSaveProfileModal = ref(false);
const newProfileName = ref('');
const activeProfile = ref(null);

const loadProfiles = async () => {
  profiles.value = await configService.getProfiles();
  activeProfile.value = await configService.getActiveProfile();
  // If there is an active profile, set localConfig to its config
  if (activeProfile.value && profiles.value[activeProfile.value]) {
    localConfig.value = { ...profiles.value[activeProfile.value] };
    Object.assign(config, profiles.value[activeProfile.value]);
  }
};

const handleSaveProfile = async () => {
  try {
    if (!newProfileName.value.trim()) {
      throw new Error('Profile name is required');
    }
    await configService.saveProfile(newProfileName.value, localConfig.value);
    await configService.setActiveProfile(newProfileName.value);
    await loadProfiles();
    showSaveProfileModal.value = false;
    newProfileName.value = '';
    uiStore.showToast('Profile saved and activated', 'success');
  } catch (error) {
    uiStore.showToast(error.message || 'Failed to save profile', 'error');
  }
};

const handleLoadProfile = async (name) => {
  try {
    await configService.setActiveProfile(name);
    // Set localConfig to the selected profile's config
    const profilesObj = await configService.getProfiles();
    if (profilesObj[name]) {
      localConfig.value = { ...profilesObj[name] };
      Object.assign(config, profilesObj[name]);
    }
    await loadProfiles();
    uiStore.showToast('Profile loaded successfully', 'success');
  } catch (error) {
    uiStore.showToast(error.message || 'Failed to load profile', 'error');
  }
};

const handleDeleteProfile = async (name) => {
  try {
    await configService.deleteProfile(name);
    await loadProfiles();
    uiStore.showToast('Profile deleted successfully', 'success');
  } catch (error) {
    uiStore.showToast(error.message || 'Failed to delete profile', 'error');
  }
};

const handleResetConfig = async () => {
  try {
    await configService.resetConfig();
    localConfig.value = { ...config };
    await loadProfiles();
    uiStore.showToast('Configuration reset to defaults', 'success');
  } catch (error) {
    uiStore.showToast(error.message || 'Failed to reset configuration', 'error');
  }
};

onMounted(async () => {
  await loadProfiles();
});

const storageTab = ref('storage');

const formatDate = (ts) => {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

// Confirmation modals state
const showPermanentDeleteConfirm = ref(false);
const showPermanentDeleteConfirmQuiz = ref(false);
const showRestoreConfirmNote = ref(false);
const showRestoreConfirmQuiz = ref(false);
const noteToPermanentDelete = ref(null);
const quizToPermanentDelete = ref(null);
const noteToRestore = ref(null);
const quizToRestore = ref(null);

const handlePermanentDelete = (note) => {
  noteToPermanentDelete.value = note;
  showPermanentDeleteConfirm.value = true;
};
const handlePermanentDeleteQuiz = (quiz) => {
  quizToPermanentDelete.value = quiz;
  showPermanentDeleteConfirmQuiz.value = true;
};
const handleRestoreNote = (note) => {
  noteToRestore.value = note;
  showRestoreConfirmNote.value = true;
};
const handleRestoreQuiz = (quiz) => {
  quizToRestore.value = quiz;
  showRestoreConfirmQuiz.value = true;
};
const handleCancelPermanentDelete = () => {
  showPermanentDeleteConfirm.value = false;
  noteToPermanentDelete.value = null;
};
const handleCancelPermanentDeleteQuiz = () => {
  showPermanentDeleteConfirmQuiz.value = false;
  quizToPermanentDelete.value = null;
};
const handleCancelRestoreNote = () => {
  showRestoreConfirmNote.value = false;
  noteToRestore.value = null;
};
const handleCancelRestoreQuiz = () => {
  showRestoreConfirmQuiz.value = false;
  quizToRestore.value = null;
};
const handleConfirmPermanentDelete = async () => {
  try {
    const note = noteToPermanentDelete.value;
    if (!note) return;
    const success = await noteStore.permanentDeleteNote(note.id);
    showPermanentDeleteConfirm.value = false;
    noteToPermanentDelete.value = null;
    setTimeout(() => {
      if (success) {
        uiStore.showToast('Note permanently deleted', 'success');
      } else {
        uiStore.showToast('Failed to permanently delete note', 'error');
      }
    }, 100);
  } catch (e) {
    showPermanentDeleteConfirm.value = false;
    noteToPermanentDelete.value = null;
    setTimeout(() => {
      uiStore.showToast('Failed to permanently delete note', 'error');
    }, 100);
  }
};
const handleConfirmPermanentDeleteQuiz = async () => {
  try {
    const quiz = quizToPermanentDelete.value;
    if (!quiz) return;
    const success = await quizStore.permanentDeleteQuiz(quiz.id);
    showPermanentDeleteConfirmQuiz.value = false;
    quizToPermanentDelete.value = null;
    setTimeout(() => {
      if (success) {
        uiStore.showToast('Quiz permanently deleted', 'success');
      } else {
        uiStore.showToast('Failed to permanently delete quiz', 'error');
      }
    }, 100);
  } catch (e) {
    showPermanentDeleteConfirmQuiz.value = false;
    quizToPermanentDelete.value = null;
    setTimeout(() => {
      uiStore.showToast('Failed to permanently delete quiz', 'error');
    }, 100);
  }
};
const handleConfirmRestoreNote = async () => {
  try {
    const note = noteToRestore.value;
    if (!note) return;
    const success = await noteStore.restoreNote(note.id);
    showRestoreConfirmNote.value = false;
    noteToRestore.value = null;
    setTimeout(() => {
      if (success) {
        uiStore.showToast('Note restored successfully', 'success');
      } else {
        uiStore.showToast('Failed to restore note', 'error');
      }
    }, 100);
  } catch (e) {
    showRestoreConfirmNote.value = false;
    noteToRestore.value = null;
    setTimeout(() => {
      uiStore.showToast('Failed to restore note', 'error');
    }, 100);
  }
};
const handleConfirmRestoreQuiz = async () => {
  try {
    const quiz = quizToRestore.value;
    if (!quiz) return;
    const success = await quizStore.restoreQuiz(quiz.id);
    showRestoreConfirmQuiz.value = false;
    quizToRestore.value = null;
    setTimeout(() => {
      if (success) {
        uiStore.showToast('Quiz restored successfully', 'success');
      } else {
        uiStore.showToast('Failed to restore quiz', 'error');
      }
    }, 100);
  } catch (e) {
    showRestoreConfirmQuiz.value = false;
    quizToRestore.value = null;
    setTimeout(() => {
      uiStore.showToast('Failed to restore quiz', 'error');
    }, 100);
  }
};

// Tutorial Tour
const showTutorial = ref(false);
const currentTutorialStep = ref(0);

const tutorialSteps = [
  {
    title: 'Welcome to Talinotes!',
    description: 'Let\'s take a quick tour of the main features. We\'ll show you how to create notes, generate quizzes, and more.',
    target: null,
    position: null,
    contentPosition: { top: 0, left: 0 },
    page: 'home'
  },
  {
    title: 'Creating Notes',
    description: 'Tap the + button to create a new note. You can organize notes in folders and use markdown for formatting.',
    target: 'create-note-button',
    position: null,
    contentPosition: { top: 100, left: 0 },
    page: 'notes'
  },
  {
    title: 'Managing Folders',
    description: 'Double-tap a folder to rename or delete it. Long-press to access more options like moving notes.',
    target: 'folder-list',
    position: null,
    contentPosition: { top: 200, left: 0 },
    page: 'notes'
  },
  {
    title: 'Note Actions',
    description: 'Long-press any note to access quick actions like pinning, sharing, or generating a quiz.',
    target: 'note-actions',
    position: null,
    contentPosition: { top: 300, left: 0 },
    page: 'notes'
  },
  {
    title: 'Quiz Generation',
    description: 'Select a note and tap the quiz icon to generate an AI-powered quiz based on your content.',
    target: 'quiz-button',
    position: null,
    contentPosition: { top: 400, left: 0 },
    page: 'notes'
  },
  {
    title: 'Settings & Customization',
    description: 'Access settings to toggle dark mode, manage storage, and configure your preferences.',
    target: 'settings-button',
    position: null,
    contentPosition: { top: 500, left: 0 },
    page: 'settings'
  }
];

const emit = defineEmits(['navigate']);

const startTutorial = () => {
  showHowToUseModal.value = false;
  showTutorial.value = true;
  currentTutorialStep.value = 0;
  // Navigate to the first page
  emit('navigate', tutorialSteps[0].page);
  // Wait for DOM to update
  setTimeout(updateTutorialPositions, 100);
};

const nextTutorialStep = () => {
  if (currentTutorialStep.value < tutorialSteps.length - 1) {
    const nextStep = tutorialSteps[currentTutorialStep.value + 1];
    // Navigate to the next page if needed
    if (nextStep.page !== tutorialSteps[currentTutorialStep.value].page) {
      emit('navigate', nextStep.page);
    }
    currentTutorialStep.value++;
    // Update positions after step change and navigation
    setTimeout(updateTutorialPositions, 300);
  }
};

const previousTutorialStep = () => {
  if (currentTutorialStep.value > 0) {
    const prevStep = tutorialSteps[currentTutorialStep.value - 1];
    // Navigate to the previous page if needed
    if (prevStep.page !== tutorialSteps[currentTutorialStep.value].page) {
      emit('navigate', prevStep.page);
    }
    currentTutorialStep.value--;
    // Update positions after step change and navigation
    setTimeout(updateTutorialPositions, 300);
  }
};

const endTutorial = () => {
  showTutorial.value = false;
  currentTutorialStep.value = 0;
};

// Add window resize handler to update positions
onMounted(() => {
  window.addEventListener('resize', updateTutorialPositions);
});

onUnmounted(() => {
  window.removeEventListener('resize', updateTutorialPositions);
});

const props = defineProps({
  tutorialPageReady: Boolean,
  showTutorial: Boolean,
  currentTutorialStep: Number,
  tutorialSteps: Array
});

// Watch for tutorial page readiness to update modal/spotlight after navigation
watch(() => props.tutorialPageReady, async () => {
  await nextTick();
  if (props.showTutorial && props.tutorialSteps[props.currentTutorialStep].page === 'settings') {
    updateTutorialPositions();
  }
});

// Tutorial spotlight/modal logic
const updateTutorialPositions = () => {
  const currentStep = props.tutorialSteps[props.currentTutorialStep];
  if (currentStep.target) {
    const element = document.querySelector(`[data-tutorial="${currentStep.target}"]`);
    if (element) {
      const rect = element.getBoundingClientRect();
      currentStep.position = {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height
      };
    }
  }
};

const handleSaveConfig = async () => {
  try {
    // Validate all fields
    if (!localConfig.value.BACKEND_URL || !localConfig.value.PYTHON_SERVICE_URL || !localConfig.value.LM_STUDIO_URL) {
      uiStore.showToast('All fields are required', 'error');
      return;
    }
    // Only allow saving if a profile is active
    if (!activeProfile.value) {
      uiStore.showToast('No active profile selected', 'error');
      return;
    }
    // Save config to the active profile only
    await configService.saveProfile(activeProfile.value, localConfig.value);
    await configService.setActiveProfile(activeProfile.value); // This updates global config too
    await loadProfiles();
    // Reload config from storage and update localConfig and global config
    const loadedConfig = await configService.getConfig();
    localConfig.value = { ...loadedConfig };
    Object.assign(config, loadedConfig);
    console.log('Config after save:', loadedConfig);
    uiStore.showToast('Profile configuration saved', 'success');
  } catch (error) {
    uiStore.showToast(error.message || 'Failed to save configuration', 'error');
  }
};
</script>

<style scoped>
.material-icons {
  font-size: 20px;
  vertical-align: middle;
}
</style> 
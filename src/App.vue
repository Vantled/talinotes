<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick, provide, watch } from 'vue';
import { Keyboard } from '@capacitor/keyboard';
import SearchBar from './components/SearchBar.vue';
import NoteList from './components/NoteList.vue';
import NoteEditor from './components/NoteEditor.vue';
import QuizList from './components/QuizList.vue';
import QuizPractice from './components/QuizPractice.vue';
import QuizGenerator from './components/QuizGenerator.vue';
import Settings from './components/Settings.vue';
import { useNoteStore } from './stores/noteStore';
import { useQuizStore } from './stores/quizStore';
import { useUiStore } from './stores/uiStore';
import AppToast from './components/AppToast.vue';
import { hapticsService } from './services/hapticsService';

const noteStore = useNoteStore();
const quizStore = useQuizStore();
const uiStore = useUiStore();
const showEditor = ref(false);
const isEditing = ref(false);
const activeTab = ref('notes');
const activeFolderId = ref(noteStore.folders[0]?.id || 'default');
const isKeyboardOpen = ref(false);
const showFolderMenuId = ref(null);
const folderPopoverPosition = ref({ top: '90px', left: '32px' });
const showQuizPractice = ref(false);
const showQuizGenerator = ref(false);
const selectedNote = ref(null);
const toast = ref({ visible: false, message: '', type: 'success' });
let lastTapTime = 0;
let lastTapFolderId = null;
let toastTimeout = null;
const titleTapCount = ref(0);
const titleTapTimeout = ref(null);
const showDeleteFolderConfirm = ref(false);
const folderToDelete = ref(null);
const tutorialPageReady = ref(false);
const showTutorial = ref(false);
const currentTutorialStep = ref(0);
const tutorialSteps = [
  {
    title: 'Welcome to Talinotes!',
    description: 'Let\'s take a quick tour of the main features. We\'ll show you how to create notes, generate quizzes, and more.',
    target: null,
    position: null,
    contentPosition: { top: 0, left: 0 },
    page: 'settings'
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
    page: 'quizzes'
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

const tabOrder = ['notes', 'quizzes', 'settings'];
const previousTabIndex = ref(tabOrder.indexOf(activeTab.value));
const transitionName = ref('slide-left');

watch(activeTab, (newTab, oldTab) => {
  const newIndex = tabOrder.indexOf(newTab);
  const oldIndex = tabOrder.indexOf(oldTab);
  if (newIndex > oldIndex) {
    transitionName.value = 'slide-left';
  } else if (newIndex < oldIndex) {
    transitionName.value = 'slide-right';
  }
  previousTabIndex.value = newIndex;
});

const handleEdit = (note) => {
  isEditing.value = true;
  noteStore.setCurrentNote(note);
  showEditor.value = true;
};

const handleCreate = async () => {
  await hapticsService.medium();
  isEditing.value = false;
  noteStore.clearCurrentNote();
  showEditor.value = true;
};

const handleCancel = async () => {
  await hapticsService.light();
  showEditor.value = false;
  noteStore.clearCurrentNote();
};

const handleSaved = async () => {
  await hapticsService.success();
  showEditor.value = false;
  noteStore.clearCurrentNote();
};

const handleFolderTap = async (folder, event) => {
  const now = Date.now();
  if (folder.id === 'default') {
    await hapticsService.light();
    activeFolderId.value = folder.id;
    return;
  }
  if (lastTapFolderId === folder.id && (now - lastTapTime < 350)) {
    // Double tap detected
    await hapticsService.medium();
    showFolderMenuId.value = folder.id;
    
    try {
      // Get the button element from the event target
      const btn = event.target;
      console.log('📁 Notes Folder Menu - Event:', {
        type: event.type,
        target: event.target?.tagName,
        currentTarget: event.currentTarget?.tagName,
        hasButton: !!btn,
        buttonClasses: btn?.className
      });

      if (btn) {
        // Wait for next tick to ensure DOM is updated
        await nextTick();
        
        const rect = btn.getBoundingClientRect();
        console.log('📁 Notes Folder Menu - Button Position:', JSON.stringify({
          top: rect.top,
          bottom: rect.bottom,
          left: rect.left,
          right: rect.right,
          width: rect.width,
          height: rect.height,
          windowHeight: window.innerHeight,
          windowWidth: window.innerWidth
        }));
        
        const menuPosition = {
          top: `${rect.bottom + 8}px`,
          left: `${Math.min(rect.left, window.innerWidth - 180)}px`,
          width: '10rem'
        };
        folderPopoverPosition.value = menuPosition;
        
        console.log('📁 Notes Folder Menu - Calculated Position:', JSON.stringify({
          top: menuPosition.top,
          left: menuPosition.left,
          width: menuPosition.width,
          windowWidth: window.innerWidth,
          adjustedLeft: Math.min(rect.left, window.innerWidth - 180)
        }));
      } else {
        console.log('📁 Notes Folder Menu - No button element found');
      }
    } catch (error) {
      console.log('📁 Notes Folder Menu - Error calculating position:', error.message);
    }
    
    lastTapTime = 0;
    lastTapFolderId = null;
    console.log('📁 Notes Folder Menu - Double tap detected for folder:', folder.name);
  } else {
    // Single tap: select folder
    await hapticsService.light();
    activeFolderId.value = folder.id;
    lastTapTime = now;
    lastTapFolderId = folder.id;
  }
};

const handleRenameFolder = (folder) => {
  const newName = window.prompt('Rename folder', folder.name);
  if (newName && newName.trim() && newName !== folder.name) {
    if (activeTab.value === 'notes') {
      noteStore.renameFolder(folder.id, newName.trim());
    } else {
      quizStore.renameFolder(folder.id, newName.trim());
    }
  }
  showFolderMenuId.value = null;
};

const handleDeleteFolder = (folder) => {
  if (folder.id === 'default') return;
  folderToDelete.value = folder;
  showDeleteFolderConfirm.value = true;
};

const handleConfirmDeleteFolder = async () => {
  if (folderToDelete.value) {
    if (activeTab.value === 'notes') {
      await noteStore.deleteFolder(folderToDelete.value.id);
    } else {
      await quizStore.deleteFolder(folderToDelete.value.id);
    }
    folderToDelete.value = null;
    uiStore.showToast('Folder deleted', 'success');
  }
  showDeleteFolderConfirm.value = false;
  showFolderMenuId.value = null;
};

const handleCancelDeleteFolder = () => {
  showDeleteFolderConfirm.value = false;
  folderToDelete.value = null;
  showFolderMenuId.value = null;
};

const handleCloseFolderMenu = (e) => {
  try {
    // Only close if click is outside the menu
    const isOutside = !e.target.closest('.folder-menu-popover');
    console.log('📁 Folder Menu - Click event:', {
      target: e.target?.tagName,
      isOutside,
      menuOpen: !!showFolderMenuId.value
    });
    
    if (isOutside) {
      console.log('📁 Folder Menu - Closing menu, clicked outside');
      showFolderMenuId.value = null;
    } else {
      console.log('📁 Folder Menu - Clicked inside menu, keeping open');
    }
  } catch (error) {
    console.log('📁 Folder Menu - Error handling click:', error.message);
  }
};

const handleDragOver = (e) => {
  e.preventDefault();
};

const handleDrop = (folderId, e) => {
  e.preventDefault();
  const noteId = e.dataTransfer.getData('text/plain');
  if (noteId) {
    noteStore.moveNoteToFolder(noteId, folderId);
  }
};

const handleGenerateQuiz = async (note) => {
  uiStore.startQuizProgress();
  try {
    await quizStore.generateQuizFromNote(note);
    uiStore.finishQuizProgress();
    uiStore.showToast('Quiz generated!', 'success');
  } catch (error) {
    uiStore.finishQuizProgress();
    uiStore.showToast(error.message || 'Failed to generate quiz', 'error');
  }
};

const handleStartQuiz = (quiz) => {
  showQuizGenerator.value = false;
  showQuizPractice.value = true;
};

const handleFinishQuiz = () => {
  showQuizPractice.value = false;
  quizStore.clearCurrentQuiz();
};

const handleCancelQuiz = () => {
  showQuizGenerator.value = false;
  selectedNote.value = null;
  quizStore.clearCurrentQuiz();
};

const filteredNotes = () => {
  return noteStore.getNotesByFolder(activeFolderId.value);
};

const handleTitleTap = async () => {
  await hapticsService.light();
  titleTapCount.value++;
  
  if (titleTapTimeout.value) {
    clearTimeout(titleTapTimeout.value);
  }
  
  titleTapTimeout.value = setTimeout(async () => {
    if (titleTapCount.value === 3) {
      await hapticsService.success();
      activeTab.value = 'settings';
      uiStore.showToast('Developer settings unlocked', 'success');
    }
    titleTapCount.value = 0;
  }, 1000);
};

// Quiz folder handling
const handleQuizFolderTap = async (folder, event) => {
  const now = Date.now();
  if (lastTapFolderId === folder.id && (now - lastTapTime < 350)) {
    // Double tap detected
    await hapticsService.medium();
    handleQuizFolderMenu(folder, event);
    lastTapTime = 0;
    lastTapFolderId = null;
  } else {
    // Single tap: select folder
    await hapticsService.light();
    quizStore.setActiveFolder(folder.id);
    lastTapTime = now;
    lastTapFolderId = folder.id;
  }
};

const handleQuizFolderMenu = (folder, event) => {
  showFolderMenuId.value = folder.id;
  folderMenuTarget = folder;
  
  try {
    // Get the button element from the event target
    const btn = event.target;
    console.log('📝 Quiz Folder Menu - Event:', {
      type: event.type,
      target: event.target?.tagName,
      currentTarget: event.currentTarget?.tagName,
      hasButton: !!btn,
      buttonClasses: btn?.className
    });

    if (btn) {
      nextTick(() => {
        const rect = btn.getBoundingClientRect();
        console.log('📝 Quiz Folder Menu - Button Position:', JSON.stringify({
          top: rect.top,
          bottom: rect.bottom,
          left: rect.left,
          right: rect.right,
          width: rect.width,
          height: rect.height,
          windowHeight: window.innerHeight,
          windowWidth: window.innerWidth
        }));
        
        const menuPosition = {
          top: `${rect.bottom + 8}px`,
          left: `${Math.min(rect.left, window.innerWidth - 180)}px`,
          width: '10rem'
        };
        folderPopoverPosition.value = menuPosition;
        
        console.log('📝 Quiz Folder Menu - Calculated Position:', JSON.stringify({
          top: menuPosition.top,
          left: menuPosition.left,
          width: menuPosition.width,
          windowWidth: window.innerWidth,
          adjustedLeft: Math.min(rect.left, window.innerWidth - 180)
        }));
      });
    } else {
      console.log('📝 Quiz Folder Menu - No button element found');
    }
  } catch (error) {
    console.log('📝 Quiz Folder Menu - Error calculating position:', error.message);
  }
};

const handleQuizDrop = async (folderId, event) => {
  event.preventDefault();
  const quizId = event.dataTransfer.getData('text/plain');
  if (quizId) {
    await quizStore.moveQuizToFolder(quizId, folderId);
  }
};

// Helper to get the correct folder object by id for the active tab
const getActiveFolderById = (id) => {
  if (activeTab.value === 'notes') {
    return noteStore.folders.find(f => f.id === id);
  } else {
    return quizStore.folders.find(f => f.id === id);
  }
};

// Tutorial navigation handler
const handleTutorialNavigation = async (page) => {
  if (page === 'notes') activeTab.value = 'notes';
  else if (page === 'settings') activeTab.value = 'settings';
  else if (page === 'quizzes') activeTab.value = 'quizzes';
  await nextTick();
  tutorialPageReady.value = !tutorialPageReady.value; // toggle to trigger watcher
};

const startTutorial = () => {
  showTutorial.value = true;
  currentTutorialStep.value = 0;
  handleTutorialNavigation(tutorialSteps[0].page);
};
const nextTutorialStep = () => {
  if (currentTutorialStep.value < tutorialSteps.length - 1) {
    const nextStep = tutorialSteps[currentTutorialStep.value + 1];
    if (nextStep.page !== tutorialSteps[currentTutorialStep.value].page) {
      handleTutorialNavigation(nextStep.page);
    }
    currentTutorialStep.value++;
  }
};
const previousTutorialStep = () => {
  if (currentTutorialStep.value > 0) {
    const prevStep = tutorialSteps[currentTutorialStep.value - 1];
    if (prevStep.page !== tutorialSteps[currentTutorialStep.value].page) {
      handleTutorialNavigation(prevStep.page);
    }
    currentTutorialStep.value--;
  }
};
const endTutorial = () => {
  showTutorial.value = false;
  currentTutorialStep.value = 0;
};

onMounted(async () => {
  try {
    await noteStore.initialize();
  } catch (error) {
    console.error('Failed to initialize app:', error);
  }
  if (Keyboard && Keyboard.addListener) {
    Keyboard.addListener('keyboardWillShow', () => { isKeyboardOpen.value = true; });
    Keyboard.addListener('keyboardWillHide', () => { isKeyboardOpen.value = false; });
  } else {
    // Fallback: window resize
    const onResize = () => {
      isKeyboardOpen.value = window.innerHeight < 600;
    };
    window.addEventListener('resize', onResize);
  }
  // Ensure activeFolderId is always valid
  if (!noteStore.folders.find(f => f.id === activeFolderId.value)) {
    activeFolderId.value = noteStore.folders[0]?.id || 'default';
  }
  // Initialize config when app starts
  initializeConfig().catch(console.error);
});
onBeforeUnmount(() => {
  if (Keyboard && Keyboard.removeAllListeners) Keyboard.removeAllListeners();
  window.removeEventListener('resize', () => {});
  if (titleTapTimeout.value) {
    clearTimeout(titleTapTimeout.value);
  }
});
</script>

<template>
  <div class="bg-white dark:bg-gray-900 dark:text-gray-100 min-h-screen h-full w-full flex flex-col safe-area-inset">
    <!-- Global Quiz Generation Progress Bar (toast style) -->
    <div
      v-if="uiStore.isGeneratingQuiz"
      class="fixed top-16 right-4 z-[9999] flex items-center gap-3 px-4 py-2 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700"
      style="min-width: 200px;"
    >
      <span class="text-xs font-semibold text-blue-700 dark:text-blue-300">{{ Math.floor(uiStore.quizProgress) }}%</span>
      <div class="flex-1 h-2 bg-blue-100 dark:bg-blue-900 rounded-full overflow-hidden">
        <div class="h-2 bg-blue-600 dark:bg-blue-400 transition-all duration-200" :style="{ width: uiStore.quizProgress + '%' }"></div>
      </div>
      <span class="ml-2 text-xs text-gray-500 dark:text-gray-400">Generating Quiz...</span>
    </div>
    <AppToast
      :visible="uiStore.toast.visible"
      :message="uiStore.toast.message"
      :type="uiStore.toast.type"
    />
    <div v-if="!showEditor && !showQuizPractice && !showQuizGenerator">
      <div class="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-900" style="height: env(safe-area-inset-top);"></div>
      <!-- Header -->
      <header class="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30 w-full flex items-center justify-between h-16 px-4">
        <div class="flex items-center space-x-2">
          <h1 
            @click="handleTitleTap"
            class="text-xl font-bold text-gray-900 dark:text-gray-100 mt-1 cursor-pointer"
          >Talinotes</h1>
        </div>
      </header>

      <!-- Folder Tabs Bar -->
      <nav v-if="activeTab === 'notes'" class="bg-white dark:bg-gray-900 px-4 pt-2 pb-2 border-b border-gray-100 dark:border-gray-700 flex items-center space-x-2 sticky top-16 z-20 overflow-x-auto">
        <template v-for="folder in noteStore.folders" :key="folder.id">
          <div 
            class="relative inline-block"
            @dragover="handleDragOver"
            @drop="handleDrop(folder.id, $event)"
          >
            <button
              :class="[
                'px-4 py-1.5 rounded-full font-medium text-sm transition whitespace-nowrap user-select-none touch-manipulation',
                activeFolderId === folder.id ? 'bg-blue-600 text-white shadow' : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
              ]"
              @click="(e) => handleFolderTap(folder, e)"
              @touchend.prevent="(e) => handleFolderTap(folder, e)"
              @contextmenu.prevent
              :style="{ WebkitUserSelect: 'none' }"
              ref="el => folder.id === showFolderMenuId ? (window._folderTabEl = el) : null"
            >
              {{ folder.name }}
            </button>
          </div>
        </template>
        <button
          class="w-9 h-9 flex items-center justify-center rounded-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition user-select-none ml-2"
          @click="noteStore.addFolder()"
          aria-label="Add Folder"
          tabindex="0"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>
        </button>
      </nav>

      <!-- Quiz Folder Tabs Bar -->
      <nav v-if="activeTab === 'quizzes'" class="bg-white dark:bg-gray-900 px-4 pt-2 pb-2 border-b border-gray-100 dark:border-gray-700 flex items-center space-x-2 sticky top-16 z-20 overflow-x-auto">
        <template v-for="folder in quizStore.folders" :key="folder.id">
          <div 
            class="relative inline-block"
            @dragover.prevent="() => {}"
            @drop="handleQuizDrop(folder.id, $event)"
          >
            <button
              :class="[
                'px-4 py-1.5 rounded-full font-medium text-sm transition whitespace-nowrap user-select-none touch-manipulation',
                quizStore.activeFolderId === folder.id ? 'bg-blue-600 text-white shadow' : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
              ]"
              @click="(e) => handleQuizFolderTap(folder, e)"
              @contextmenu.prevent="handleQuizFolderMenu(folder, $event)"
              :style="{ WebkitUserSelect: 'none' }"
            >
              {{ folder.name }}
            </button>
          </div>
        </template>
        <button
          class="w-9 h-9 flex items-center justify-center rounded-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition user-select-none ml-2"
          @click="quizStore.addFolder()"
          aria-label="Add Folder"
          tabindex="0"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>
        </button>
      </nav>
    </div>

    <!-- Popover and overlay rendered at body root -->
    <teleport to="body">
      <div v-if="showFolderMenuId">
        <div @click="handleCloseFolderMenu" class="fixed inset-0 z-[1000]"></div>
        <div
          class="folder-menu-popover fixed z-[1001] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg"
          :style="{ top: folderPopoverPosition.top, left: folderPopoverPosition.left, width: folderPopoverPosition.width }"
        >
          <button @click="handleRenameFolder(getActiveFolderById(showFolderMenuId))" class="w-full text-left px-4 py-2 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 user-select-none">Rename</button>
          <button @click="handleDeleteFolder(getActiveFolderById(showFolderMenuId))" class="w-full text-left px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 font-semibold user-select-none">Delete</button>
        </div>
      </div>
      <div v-if="showDeleteFolderConfirm" class="fixed inset-0 z-[10000] flex items-center justify-center bg-black bg-opacity-40">
        <div class="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 w-full max-w-xs mx-4 relative border border-gray-200 dark:border-gray-700">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Delete Folder?</h3>
          <p class="text-gray-700 dark:text-gray-300 mb-4">Are you sure you want to delete this folder? All items will be moved to the default folder.</p>
          <div class="flex justify-end gap-2">
            <button @click="handleCancelDeleteFolder" class="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-black dark:text-gray-100 font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-all">Cancel</button>
            <button @click="handleConfirmDeleteFolder" class="px-4 py-2 rounded bg-red-600 text-white font-semibold hover:bg-red-700 transition-all">Delete</button>
          </div>
        </div>
      </div>
    </teleport>

    <!-- Main Content -->
    <transition :name="transitionName" mode="out-in">
      <main :key="activeTab" class="flex-1 w-full max-w-2xl mx-auto px-2 pb-24 pt-2 mb-4 flex flex-col bg-white dark:bg-gray-900">
        <div v-if="activeTab === 'notes'">
          <div v-if="!showEditor">
            <!-- Removed <SearchBar /> here -->
          </div>
          <div v-if="showEditor" class="mb-4">
            <NoteEditor
              :edit-mode="isEditing"
              :is-keyboard-open="isKeyboardOpen"
              :note="isEditing ? noteStore.currentNote : null"
              @cancel="handleCancel"
              @saved="handleSaved"
            />
          </div>
          <div v-else>
            <NoteList
              :notes="filteredNotes()"
              @edit="handleEdit"
              @generate-quiz="handleGenerateQuiz"
              :tutorial-page-ready="tutorialPageReady"
              :show-tutorial="showTutorial"
              :current-tutorial-step="currentTutorialStep"
              :tutorial-steps="tutorialSteps"
              @tutorial-next="nextTutorialStep"
              @tutorial-prev="previousTutorialStep"
              @tutorial-end="endTutorial"
            />
          </div>
        </div>
        <div v-else-if="activeTab === 'quizzes'">
          <div v-if="showQuizGenerator">
            <QuizGenerator
              :note="selectedNote"
              @start-quiz="handleStartQuiz"
              @cancel="handleCancelQuiz"
            />
          </div>
          <div v-else-if="showQuizPractice">
            <QuizPractice
              @finish="handleFinishQuiz"
            />
          </div>
          <div v-else>
            <QuizList
              @generate="handleGenerateQuiz"
              @start="handleStartQuiz"
              :tutorial-page-ready="tutorialPageReady"
              :show-tutorial="showTutorial"
              :current-tutorial-step="currentTutorialStep"
              :tutorial-steps="tutorialSteps"
              @tutorial-next="nextTutorialStep"
              @tutorial-prev="previousTutorialStep"
              @tutorial-end="endTutorial"
            />
          </div>
        </div>
        <div v-else-if="activeTab === 'settings'" class="flex flex-col items-center justify-center h-full">
          <div class="w-full">
            <Settings
              @navigate="handleTutorialNavigation"
              :tutorial-page-ready="tutorialPageReady"
              :show-tutorial="showTutorial"
              :current-tutorial-step="currentTutorialStep"
              :tutorial-steps="tutorialSteps"
              @tutorial-next="nextTutorialStep"
              @tutorial-prev="previousTutorialStep"
              @tutorial-end="endTutorial"
              @start-tutorial="startTutorial"
            />
          </div>
        </div>
      </main>
    </transition>

    <!-- Floating Action Button -->
    <button
      v-if="activeTab === 'notes' && !showEditor"
      @click="handleCreate"
      class="fixed bottom-32 right-6 z-40 w-20 h-20 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg hover:bg-blue-700 focus:outline-none"
      style="box-shadow: 0 4px 16px rgba(0,0,0,0.12);"
    >
      <svg class="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
      </svg>
    </button>

    <!-- Bottom Navigation -->
    <nav v-if="!isKeyboardOpen && !showEditor && !showQuizPractice && !showQuizGenerator" class="bottom-navbar fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex justify-around items-center min-h-[80px] py-4 pb-safe-bottom shadow-lg" style="box-shadow: 0 0 12px 0 rgba(0,0,0,0.06);">
      <button @click="activeTab = 'notes'" class="flex flex-col items-center flex-1 py-2 focus:outline-none" :class="activeTab === 'notes' ? 'text-blue-600' : 'text-gray-500'">
        <!-- Notepad icon for Notes -->
        <svg class="w-6 h-6 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 4v16c0 1.104.896 2 2 2h10c1.104 0 2-.896 2-2V4M9 2v4m6-4v4M9 10h6M9 14h6" />
        </svg>
        <span class="text-xs">Notes</span>
      </button>
      <button @click="activeTab = 'quizzes'" class="flex flex-col items-center flex-1 py-2 focus:outline-none" :class="activeTab === 'quizzes' ? 'text-blue-600' : 'text-gray-500'">
        <!-- Quiz/question mark in circle icon for Quizzes -->
        <svg class="w-6 h-6 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" stroke-width="2" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 16h.01M12 12a2 2 0 10-2-2" />
        </svg>
        <span class="text-xs">Quizzes</span>
      </button>
      <button @click="activeTab = 'settings'" class="flex flex-col items-center flex-1 py-2 focus:outline-none" :class="activeTab === 'settings' ? 'text-blue-600' : 'text-gray-500'">
        <!-- Outlined Material Design gear icon for Settings (matches other icons) -->
        <svg class="w-6 h-6 mb-0.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="3" />
          <path stroke-linecap="round" stroke-linejoin="round" d="M19.14,12.94c.04-.31.06-.63.06-.94s-.02-.63-.06-.94l2.03-1.58a.5.5,0,0,0,.12-.65l-1.92-3.32a.5.5,0,0,0-.61-.23l-2.39,1a7.03,7.03,0,0,0-1.63-.95l-.36-2.53A.5.5,0,0,0,14,2h-4a.5.5,0,0,0-.5.42l-.36,2.53a7.03,7.03,0,0,0-1.63.95l-2.39-1a.5.5,0,0,0-.61.23l-1.92,3.32a.5.5,0,0,0,.12.65l2.03,1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03,1.58a.5.5,0,0,0-.12.65l1.92,3.32a.5.5,0,0,0,.61.23l2.39-1a7.03,7.03,0,0,0,1.63.95l.36,2.53A.5.5,0,0,0,10,22h4a.5.5,0,0,0,.5-.42l.36-2.53a7.03,7.03,0,0,0,1.63-.95l2.39,1a.5.5,0,0,0,.61-.23l1.92-3.32a.5.5,0,0,0-.12-.65ZM12,15.5A3.5,3.5,0,1,1,15.5,12,3.5,3.5,0,0,1,12,15.5Z"/>
        </svg>
        <span class="text-xs">Settings</span>
      </button>
    </nav>
  </div>
</template>

<style>
@import 'tailwindcss/base';
@import 'tailwindcss/components';
@import 'tailwindcss/utilities';

html, body, #app {
  width: 100%;
  min-width: 100vw;
  height: 100%;
  min-height: 100vh;
  margin: 0;
  padding: 0;
}

body.modal-open .bottom-navbar {
  display: none !important;
}

/* Safe area insets for iOS */
.safe-area-inset {
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}

.h-safe-top {
  height: env(safe-area-inset-top);
}

.pb-safe-bottom {
  padding-bottom: env(safe-area-inset-bottom);
}

.max-w-4xl {
  max-width: 56rem;
}

/* Prevent overscroll bounce */
html, body {
  overscroll-behavior: none;
  -webkit-overflow-scrolling: touch;
}

/* Smooth scrolling */
* {
  -webkit-tap-highlight-color: transparent;
  scroll-behavior: smooth;
}

/* Responsive typography */
@media (max-width: 640px) {
  html {
    font-size: 14px;
  }
}

@media (min-width: 641px) {
  html {
    font-size: 16px;
  }
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.slide-left-enter-active, .slide-left-leave-active {
  transition: all 0.3s cubic-bezier(.4,0,.2,1);
}
.slide-left-enter-from {
  opacity: 0;
  transform: translateX(30px);
}
.slide-left-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}
.slide-right-enter-active, .slide-right-leave-active {
  transition: all 0.3s cubic-bezier(.4,0,.2,1);
}
.slide-right-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}
.slide-right-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

/* Modal Animations */
.modal-fade-enter-active, .modal-fade-leave-active {
  transition: opacity 0.25s cubic-bezier(.4,0,.2,1);
}
.modal-fade-enter-from, .modal-fade-leave-to {
  opacity: 0;
}
.modal-scale-enter-active {
  transition: transform 0.25s cubic-bezier(.4,0,.2,1), opacity 0.25s cubic-bezier(.4,0,.2,1);
}
.modal-scale-enter-from {
  opacity: 0;
  transform: scale(0.95);
}
.modal-scale-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

/* Dropdown Animations */
.dropdown-fade-enter-active, .dropdown-fade-leave-active {
  transition: opacity 0.2s cubic-bezier(.4,0,.2,1);
}
.dropdown-fade-enter-from, .dropdown-fade-leave-to {
  opacity: 0;
}
.dropdown-slide-enter-active {
  transition: transform 0.2s cubic-bezier(.4,0,.2,1), opacity 0.2s cubic-bezier(.4,0,.2,1);
}
.dropdown-slide-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}
.dropdown-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>


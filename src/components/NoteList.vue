<template>
  <div class="bg-white dark:bg-gray-900 rounded-xl shadow-sm">
    <SearchBar />
    <!-- Loading State -->
    <div v-if="noteStore.loading" class="flex justify-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
    </div>

    <!-- Error State -->
    <div v-else-if="noteStore.error" class="text-center py-8">
      <div class="text-red-500 mb-2">
        <svg class="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <p class="text-red-500">{{ noteStore.error }}</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="noteStore.notes.length === 0" class="text-center py-12">
      <div class="text-gray-400 dark:text-gray-500 mb-4">
        <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <p class="text-gray-500 dark:text-gray-400 text-lg mb-2">No notes found</p>
      <p class="text-gray-400 dark:text-gray-500">Create your first note to get started!</p>
    </div>

    <!-- Notes List -->
    <ul v-else class="divide-y divide-gray-200 dark:divide-gray-700">
      <li
        v-for="note in notes || noteStore.notes"
        :key="note.id"
        class="relative overflow-hidden"
        draggable="true"
        @dragstart="handleDragStart(note, $event)"
        @dragend="handleDragEnd"
        :data-tutorial="note.id === notes?.[0]?.id ? 'note-item' : undefined"
      >
        <!-- Note content -->
        <div
          class="px-4 py-4 cursor-pointer bg-white dark:bg-gray-800 transition-all duration-200 group select-none flex items-center relative z-20 hover:bg-gray-50 dark:hover:bg-gray-700"
          @click="editNote(note)"
          :class="draggingNoteId === note.id ? 'dragging' : ''"
        >
          <div class="flex-1 min-w-0">
            <div class="text-base font-semibold text-black dark:text-gray-100 truncate text-left">{{ note.title }}</div>
            <div class="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2 text-left">{{ stripHtml(note.content) }}</div>
          </div>
          <div class="ml-4 flex flex-col items-end">
            <div class="text-xs text-gray-400 dark:text-gray-500 mb-1">
              {{
                (note.createdAt || note.updatedAt)
                  ? new Date(note.createdAt || note.updatedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
                  : ''
              }}
            </div>
            <!-- Three-dot menu -->
            <div class="relative">
              <button 
                @click.stop="toggleMenu(note.id, $event)" 
                class="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
                :data-tutorial="note.id === notes?.[0]?.id ? 'note-actions' : undefined"
                ref="menuButtonRef"
              >
                <svg class="w-6 h-6 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="6" r="1.5" />
                  <circle cx="12" cy="12" r="1.5" />
                  <circle cx="12" cy="18" r="1.5" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Overlay menu using teleport -->
        <teleport to="body">
          <div v-if="menuOpen === note.id" class="fixed inset-0 z-[9999]">
            <div :style="menuPosition" ref="actionMenuRef" class="absolute w-44 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700 z-[10000]">
              <button @click="menuGenerateQuiz(note)" class="w-full text-left px-4 py-2 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">Generate Quiz</button>
              <button @click="menuDelete(note)" class="w-full text-left px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 font-semibold">Delete</button>
            </div>
          </div>
        </teleport>
      </li>
    </ul>

    <teleport to="body">
      <div v-if="showDeleteConfirm" class="fixed inset-0 z-[10000] flex items-center justify-center bg-black bg-opacity-40">
        <div class="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 w-full max-w-xs mx-4 relative border border-gray-200 dark:border-gray-700">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Delete Note?</h3>
          <p class="text-gray-700 dark:text-gray-300 mb-4">Are you sure you want to delete this note? You can restore it from Recently Deleted.</p>
          <div class="flex justify-end gap-2">
            <button @click="handleCancelDelete" class="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-black dark:text-gray-100 font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-all">Cancel</button>
            <button @click="handleConfirmDelete" class="px-4 py-2 rounded bg-red-600 text-white font-semibold hover:bg-red-700 transition-all">Delete</button>
          </div>
        </div>
      </div>
    </teleport>

    <!-- Tutorial Tour (only for notes tab steps) -->
    <div v-if="props.showTutorial && props.tutorialSteps[props.currentTutorialStep].page === 'notes'" class="fixed inset-0 z-[100]">
      <div class="absolute inset-0 bg-black bg-opacity-50"></div>
      <!-- Spotlight Overlay -->
      <div class="absolute inset-0">
        <div
          v-if="props.tutorialSteps[props.currentTutorialStep].target"
          class="absolute transition-all duration-300 ease-in-out"
          :style="{
            top: props.tutorialSteps[props.currentTutorialStep].position?.top + 'px',
            left: props.tutorialSteps[props.currentTutorialStep].position?.left + 'px',
            width: props.tutorialSteps[props.currentTutorialStep].position?.width + 'px',
            height: props.tutorialSteps[props.currentTutorialStep].position?.height + 'px',
            borderRadius: '8px',
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.75)',
            zIndex: 1
          }"
        ></div>
      </div>
      <!-- Tutorial Content -->
      <div class="absolute inset-0 flex items-center justify-center">
        <div class="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 w-full max-w-md relative">
          <div class="text-center mb-4">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">{{ props.tutorialSteps[props.currentTutorialStep].title }}</h3>
            <p class="text-gray-700 dark:text-gray-200 mt-2">{{ props.tutorialSteps[props.currentTutorialStep].description }}</p>
          </div>
          <div class="flex justify-between mt-6">
            <button
              v-if="props.currentTutorialStep > 0"
              @click="$emit('tutorial-prev')"
              class="px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            >
              Previous
            </button>
            <button
              @click="props.currentTutorialStep === props.tutorialSteps.length - 1 ? $emit('tutorial-end') : $emit('tutorial-next')"
              class="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800"
            >
              {{ props.currentTutorialStep === props.tutorialSteps.length - 1 ? 'Finish' : 'Next' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref, onBeforeUnmount, computed, watch, nextTick } from 'vue';
import { useNoteStore } from '../stores/noteStore';
import { useUiStore } from '../stores/uiStore';
import SearchBar from './SearchBar.vue';
import { useUiStore as useGlobalUiStore } from '../stores/uiStore';

const noteStore = useNoteStore();
const uiStore = useUiStore();
const menuOpen = ref(null);
const menuPosition = ref({});
const draggedNote = ref(null);
const draggingNoteId = ref(null);
const showDeleteConfirm = ref(false);
const noteToDelete = ref(null);
const actionMenuRef = ref(null);
const menuButtonRef = ref(null);

const stripHtml = (html) => {
  const tmp = document.createElement('DIV');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
};

const handleDragStart = (note, event) => {
  draggedNote.value = note;
  draggingNoteId.value = note.id;
  event.dataTransfer.effectAllowed = 'move';
  event.dataTransfer.setData('text/plain', note.id);
  // Add a visual indicator that the note is being dragged
  event.target.classList.add('opacity-50');
  // Hide default drag image for custom look
  const crt = event.target.cloneNode(true);
  crt.style.position = 'absolute';
  crt.style.top = '-9999px';
  crt.style.left = '-9999px';
  crt.style.width = `${event.target.offsetWidth}px`;
  crt.style.height = `${event.target.offsetHeight}px`;
  crt.style.pointerEvents = 'none';
  crt.classList.add('drag-ghost');
  crt.classList.add('rounded-xl', 'bg-white', 'overflow-hidden');
  crt.style.borderRadius = '0.75rem';
  crt.style.background = '#fff';
  crt.style.overflow = 'hidden';
  crt.style.boxSizing = 'border-box';
  document.body.appendChild(crt);
  event.dataTransfer.setDragImage(crt, event.target.offsetWidth / 2, event.target.offsetHeight / 2);
  setTimeout(() => document.body.removeChild(crt), 0);
};

const handleDragEnd = (event) => {
  draggedNote.value = null;
  draggingNoteId.value = null;
  event.target.classList.remove('opacity-50');
};

const handleDragOver = (event) => {
  event.preventDefault();
  event.dataTransfer.dropEffect = 'move';
};

const handleDrop = async (folderId, event) => {
  event.preventDefault();
  if (draggedNote.value && folderId !== draggedNote.value.folderId) {
    try {
      await noteStore.moveNoteToFolder(draggedNote.value.id, folderId);
      uiStore.showToast(`Moved to ${noteStore.folders.find(f => f.id === folderId)?.name || 'folder'}`, 'success');
    } catch (error) {
      uiStore.showToast('Failed to move note', 'error');
    }
  }
};

const editNote = (note) => {
  noteStore.setCurrentNote(note);
  emit('edit', note);
};

const deleteNote = async (noteId) => {
  await noteStore.deleteNote(noteId);
  if (!noteStore.error) {
    uiStore.showToast('Note deleted', 'success');
  } else {
    uiStore.showToast(noteStore.error || 'Error deleting note', 'error');
  }
};

const toggleMenu = (id, event) => {
  menuOpen.value = menuOpen.value === id ? null : id;
  if (menuOpen.value) {
    const rect = event.target.getBoundingClientRect();
    menuPosition.value = {
      top: `${rect.bottom + 8}px`,
      left: `${Math.min(rect.left, window.innerWidth - 180)}px`
    };
  }
};

const handleClickOutsideMenu = (event) => {
  const menuEl = actionMenuRef.value;
  const btnEl = menuButtonRef.value;
  if (
    menuOpen.value &&
    (!menuEl || !(menuEl instanceof Element) || !menuEl.contains(event.target)) &&
    (!btnEl || !(btnEl instanceof Element) || !btnEl.contains(event.target))
  ) {
    menuOpen.value = null;
  }
};

const menuEdit = (note) => {
  menuOpen.value = null;
  editNote(note);
};

const menuGenerateQuiz = (note) => {
  uiStore.startQuizProgress();
  menuOpen.value = null;
  emit('generate-quiz', note);
};

const menuDelete = (note) => {
  menuOpen.value = null;
  noteToDelete.value = note;
  showDeleteConfirm.value = true;
};

const handleConfirmDelete = async () => {
  showDeleteConfirm.value = false;
  if (noteToDelete.value) {
    await deleteNote(noteToDelete.value.id);
    noteToDelete.value = null;
  }
};

const handleCancelDelete = () => {
  showDeleteConfirm.value = false;
  noteToDelete.value = null;
};

const props = defineProps({
  notes: Array,
  tutorialPageReady: Boolean,
  showTutorial: Boolean,
  currentTutorialStep: Number,
  tutorialSteps: Array
});

const emit = defineEmits(['edit', 'generate-quiz', 'tutorial-prev', 'tutorial-next', 'tutorial-end']);

onMounted(() => {
  document.addEventListener('click', handleClickOutsideMenu);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutsideMenu);
});

// Watch for tutorial page readiness to update modal/spotlight after navigation
watch(() => props.tutorialPageReady, async () => {
  await nextTick();
  if (props.showTutorial && props.tutorialSteps[props.currentTutorialStep].page === 'notes') {
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
</script>

<style>
/* Add smooth transition for drag and drop */
.opacity-50 {
  transition: opacity 0.2s ease;
}

.dragging {
  z-index: 50 !important;
  box-shadow: 0 8px 32px 0 rgba(0,0,0,0.18), 0 1.5px 6px 0 rgba(0,0,0,0.10);
  transform: scale(1.04) translateY(-2px);
  opacity: 0.85;
  transition: box-shadow 0.2s, transform 0.2s, opacity 0.2s;
  background: #f8fafc;
}

.drag-ghost {
  opacity: 0.9;
  box-shadow: 0 8px 32px 0 rgba(0,0,0,0.18), 0 1.5px 6px 0 rgba(0,0,0,0.10);
  border-radius: 1rem;
  pointer-events: none;
}
</style> 
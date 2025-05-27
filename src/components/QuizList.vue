<template>
  <div class="max-w-2xl mx-auto px-2">
    <div class="bg-white dark:bg-gray-900 rounded-xl shadow-sm">
      <SearchBar v-model="searchQuery" placeholder="Search quizzes..." @input="handleSearch" />
      <!-- Loading State -->
      <div v-if="quizStore.loading" class="flex justify-center py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
      </div>

      <!-- Error State -->
      <div v-else-if="quizStore.error" class="text-center py-8">
        <div class="text-red-500 mb-2">
          <svg class="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p class="text-red-500">{{ quizStore.error }}</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredQuizzes.length === 0" class="text-center py-12">
        <div class="text-gray-400 dark:text-gray-500 mb-4">
          <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 01-8 0M12 3v4m0 0a4 4 0 01-4 4H4m8-4a4 4 0 014 4h4m-8 4v4m0 0a4 4 0 004 4h4m-8-4a4 4 0 00-4 4H4" />
          </svg>
        </div>
        <p class="text-gray-500 dark:text-gray-400 text-lg mb-2">No quizzes found</p>
        <p class="text-gray-400 dark:text-gray-500">Generate quizzes from your notes to get started!</p>
      </div>

      <!-- Quizzes List -->
      <ul v-else class="divide-y divide-gray-200 dark:divide-gray-700">
        <li
          v-for="quiz in filteredQuizzes"
          :key="quiz.id"
          class="relative overflow-hidden"
        >
          <div
            class="px-4 py-4 cursor-pointer bg-white dark:bg-gray-800 transition-all duration-200 group select-none flex items-center relative z-20 hover:bg-gray-50 dark:hover:bg-gray-700"
            @click="startQuiz(quiz)"
            @dragstart="handleDragStart(quiz, $event)"
            @dragend="handleDragEnd($event)"
          >
            <div class="flex-1 min-w-0">
              <div v-if="renamingQuizId === quiz.id" class="flex items-center gap-2">
                <input
                  :id="'rename-input-' + quiz.id"
                  v-model="renameTitle"
                  type="text"
                  class="text-base font-semibold text-black dark:text-gray-100 bg-transparent border-b border-blue-500 focus:outline-none focus:ring-0 px-1 py-0.5 w-auto flex-1"
                  :aria-label="'Edit quiz title'"
                  @keyup.enter="handleRenameConfirm(quiz)"
                  @keyup.esc="handleRenameCancel"
                  @mousedown.stop
                  @click.stop
                />
                <button @click.stop="handleRenameConfirm(quiz)" class="ml-1 text-green-600 hover:text-green-800 focus:outline-none" aria-label="Confirm rename" tabindex="0">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
                </button>
                <button @click.stop="handleRenameCancel" class="ml-1 text-red-500 hover:text-red-700 focus:outline-none" aria-label="Cancel rename" tabindex="0">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div v-else class="text-base font-semibold text-black dark:text-gray-100 truncate text-left">{{ quiz.title }}</div>
              <div class="text-sm text-gray-500 dark:text-gray-400 mt-1 text-left">
                {{ quiz.questions.length }} questions
              </div>
            </div>
            <div class="ml-4 flex flex-col items-end">
              <div class="text-xs text-gray-400 dark:text-gray-500 mb-1">
                {{ new Date(quiz.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) }}
              </div>
              <!-- Three-dot menu -->
              <div class="relative">
                <button @click.stop="toggleMenu(quiz.id, $event)" class="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none" ref="menuButtonRef">
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
            <div v-if="menuOpen === quiz.id" class="fixed inset-0 z-[9999]">
              <div :style="menuPosition" class="absolute w-44 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700 z-[10000]" ref="menuRef">
                <button @click="menuEdit(quiz)" class="w-full text-left px-4 py-2 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">Edit Quiz</button>
                <button @click="menuRename(quiz)" class="w-full text-left px-4 py-2 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">Rename Quiz</button>
                <button @click="menuDelete(quiz)" class="w-full text-left px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 font-semibold">Delete</button>
              </div>
            </div>
          </teleport>
        </li>
      </ul>

      <div v-if="showEditor && editingQuiz" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
        <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl mx-4 p-0 overflow-y-auto max-h-[90vh] relative border border-gray-200 dark:border-gray-700">
          <QuizEditPage
            :quiz="editingQuiz"
            @back="handleEditorClose"
            @update="handleEditorSave"
          />
        </div>
      </div>

      <teleport to="body">
        <div v-if="showDeleteConfirm" class="fixed inset-0 z-[10000] flex items-center justify-center bg-black bg-opacity-40">
          <div class="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 w-full max-w-xs mx-4 relative border border-gray-200 dark:border-gray-700">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Delete Quiz?</h3>
            <p class="text-gray-700 dark:text-gray-300 mb-4">Are you sure you want to delete this quiz? You can restore it from Recently Deleted.</p>
            <div class="flex justify-end gap-2">
              <button @click="handleCancelDelete" class="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-black dark:text-gray-100 font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-all">Cancel</button>
              <button @click="handleConfirmDelete" class="px-4 py-2 rounded bg-red-600 text-white font-semibold hover:bg-red-700 transition-all">Delete</button>
            </div>
          </div>
        </div>
      </teleport>

      <!-- Rename Quiz Modal -->
      <teleport to="body">
        <div v-if="showRenameModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div class="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 w-full max-w-xs mx-4 relative border border-gray-200 dark:border-gray-700">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Rename Quiz</h3>
            <input
              v-model="renameTitle"
              type="text"
              class="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 mb-4"
              placeholder="Enter new quiz title"
            />
            <div class="flex justify-end gap-2">
              <button @click="handleRenameCancel" class="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-black dark:text-gray-100 font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-all">Cancel</button>
              <button @click="handleRenameConfirm" :disabled="!renameTitle.trim()" class="px-4 py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-all disabled:opacity-50">Rename</button>
            </div>
          </div>
        </div>
      </teleport>

      <!-- Tutorial Tour (only for quizzes tab steps) -->
      <div v-if="props.showTutorial && props.tutorialSteps[props.currentTutorialStep].page === 'quizzes'" class="fixed inset-0 z-[100]">
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
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, computed, nextTick } from 'vue';
import { useQuizStore } from '../stores/quizStore';
import { useUiStore } from '../stores/uiStore';
import QuizEditPage from './QuizEditPage.vue';
import SearchBar from './SearchBar.vue';

const quizStore = useQuizStore();
const uiStore = useUiStore();
const menuOpen = ref(null);
const menuPosition = ref({});
const searchQuery = ref('');

const draggedQuiz = ref(null);
const draggingQuizId = ref(null);

const props = defineProps({
  quizzes: Array,
  tutorialPageReady: Boolean,
  showTutorial: Boolean,
  currentTutorialStep: Number,
  tutorialSteps: Array
});

const emit = defineEmits(['start', 'generate', 'edit', 'tutorial-prev', 'tutorial-next', 'tutorial-end']);

const editingQuiz = ref(null);
const showEditor = ref(false);
const showDeleteConfirm = ref(false);
const quizToDelete = ref(null);

const showRenameModal = ref(false);
const renameTitle = ref('');
const renamingQuizId = ref(null);

const menuRef = ref(null);
const menuButtonRef = ref(null);

const filteredQuizzes = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  const quizzesArr = quizStore.getQuizzesByFolder(quizStore.activeFolderId);
  if (!query) return quizzesArr;
  return quizzesArr.filter(quiz =>
    quiz.title && quiz.title.toLowerCase().includes(query)
  );
});

// Watch for changes in showEditor to toggle the modal-open class on the body
watch(showEditor, (newVal) => {
  if (newVal) {
    document.body.classList.add('modal-open');
  } else {
    document.body.classList.remove('modal-open');
  }
});

// Watch for tutorial page readiness to update modal/spotlight after navigation
watch(() => props.tutorialPageReady, async () => {
  await nextTick();
  if (props.showTutorial && props.tutorialSteps[props.currentTutorialStep].page === 'quizzes') {
    updateTutorialPositions();
  }
});

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
  const menuEl = menuRef.value;
  const btnEl = menuButtonRef.value;
  if (
    menuOpen.value &&
    (!menuEl || !(menuEl instanceof Element) || !menuEl.contains(event.target)) &&
    (!btnEl || !(btnEl instanceof Element) || !btnEl.contains(event.target))
  ) {
    menuOpen.value = null;
  }
};

const startQuiz = (quiz) => {
  quizStore.setCurrentQuiz(quiz);
  emit('start', quiz);
};

const menuEdit = (quiz) => {
  menuOpen.value = null;
  editingQuiz.value = JSON.parse(JSON.stringify(quiz));
  showEditor.value = true;
};

const menuDelete = (quiz) => {
  menuOpen.value = null;
  quizToDelete.value = quiz;
  showDeleteConfirm.value = true;
};

const menuRename = (quiz) => {
  menuOpen.value = null;
  renamingQuizId.value = quiz.id;
  renameTitle.value = quiz.title;
  nextTick(() => {
    const input = document.getElementById('rename-input-' + quiz.id);
    if (input) input.focus();
  });
};

const handleEditorClose = async () => {
  showEditor.value = false;
  // Don't wait for the quiz to be updated, let it happen in the background
  if (editingQuiz.value) {
    quizStore.updateQuiz(editingQuiz.value).catch(error => {
      uiStore.showToast('Failed to update quiz', 'error');
    });
  }
  editingQuiz.value = null;
};

const handleEditorSave = async (updatedQuiz) => {
  try {
    await quizStore.updateQuiz(updatedQuiz);
    await quizStore.loadQuizzes();
    uiStore.showToast('Quiz updated!', 'success');
    editingQuiz.value = updatedQuiz;
  } catch (error) {
    uiStore.showToast('Failed to update quiz', 'error');
  }
};

const handleGenerateQuiz = () => {
  emit('generate');
};

const handleSearch = () => {
  // Implementation of handleSearch method
};

const handleDragStart = (quiz, event) => {
  draggedQuiz.value = quiz;
  draggingQuizId.value = quiz.id;
  event.dataTransfer.effectAllowed = 'move';
  event.dataTransfer.setData('text/plain', quiz.id);
  // Add a visual indicator that the quiz is being dragged
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
  draggedQuiz.value = null;
  draggingQuizId.value = null;
  event.target.classList.remove('opacity-50');
};

const handleConfirmDelete = async () => {
  showDeleteConfirm.value = false; // Close modal immediately
  if (quizToDelete.value) {
    await quizStore.deleteQuiz(quizToDelete.value.id);
    uiStore.showToast('Quiz deleted', 'success');
    quizToDelete.value = null;
  }
};

const handleCancelDelete = () => {
  showDeleteConfirm.value = false;
  quizToDelete.value = null;
};

const handleRenameConfirm = async (quiz) => {
  if (quiz && renameTitle.value.trim()) {
    const updatedQuiz = { ...quiz, title: renameTitle.value.trim() };
    try {
      await quizStore.updateQuiz(updatedQuiz);
      await quizStore.loadQuizzes();
      renamingQuizId.value = null;
      renameTitle.value = '';
      await nextTick(); // Wait for UI to update
      uiStore.showToast('Quiz renamed!', 'success');
    } catch (error) {
      renamingQuizId.value = null;
      renameTitle.value = '';
      await nextTick();
      uiStore.showToast('Failed to rename quiz', 'error');
    }
  } else {
    renamingQuizId.value = null;
    renameTitle.value = '';
  }
};

const handleRenameCancel = () => {
  renamingQuizId.value = null;
  renameTitle.value = '';
};

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

onMounted(() => {
  document.addEventListener('click', handleClickOutsideMenu);
  quizStore.loadQuizzes();
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutsideMenu);
  document.body.classList.remove('modal-open');
});
</script> 
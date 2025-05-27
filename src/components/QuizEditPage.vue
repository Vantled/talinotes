<template>
  <div class="w-full h-full">
    <!-- Only show main modal if QuestionEditModal is not open -->
    <template v-if="!showQuestionModal">
      <!-- Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-blue-100 rounded-t-2xl">
        <div class="flex items-center">
          <button @click="handleBack" class="mr-3 p-2 rounded-full hover:bg-gray-100 focus:outline-none" aria-label="Back">
            <svg class="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 class="text-2xl font-extrabold text-black text-left">Edit Quiz</h1>
        </div>
      </div>
      <!-- Quiz Overview Card -->
      <div class="px-6 py-4">
        <div
          :class="[
            'bg-white dark:bg-gray-900 rounded-xl w-full p-6 mb-8 max-w-2xl mx-auto relative',
            showQuestionModal ? '' : 'shadow border border-gray-100 dark:border-gray-700'
          ]"
        >
          <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div class="text-xl font-bold text-black mb-1 dark:text-gray-100">{{ quiz.title }}</div>
              <div class="text-sm text-gray-500 mb-2 dark:text-gray-400">Total Questions</div>
              <div class="text-2xl font-extrabold text-black mb-2 dark:text-gray-100">{{ quiz.questions.length }}</div>
              <div class="flex flex-wrap gap-2 mb-2">
                <span v-for="type in questionTypes" :key="type" class="px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-200">{{ type }}</span>
              </div>
              <div class="text-xs text-gray-400 dark:text-gray-500">Last Updated<br>{{ lastUpdated }}</div>
            </div>
            <div class="flex flex-col items-end gap-2">
              <button @click="openAddQuestion" class="px-5 py-2 bg-blue-600 text-white rounded-lg font-semibold shadow hover:bg-blue-700 transition-all flex items-center gap-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
                Add Question
              </button>
            </div>
          </div>
        </div>
        <!-- Questions List -->
        <div>
          <h2 class="text-lg font-bold text-black mb-4">Questions</h2>
          <div v-for="(q, idx) in quiz.questions" :key="q.id" class="mb-5">
            <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5 relative">
              <div class="flex items-center gap-2 mb-2">
                <span class="text-sm font-semibold text-gray-500 dark:text-gray-400">Question {{ idx + 1 }}</span>
                <span class="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-200">{{ getTypeLabel(q.type) }}</span>
                <button @click="editQuestion(q, idx)" class="ml-auto text-gray-400 hover:text-blue-600" aria-label="Edit question">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 21h4.586a1 1 0 0 0 .707-.293l10.414-10.414a2 2 0 0 0 0-2.828l-2.172-2.172a2 2 0 0 0-2.828 0L4.293 15.707A1 1 0 0 0 4 16.414V21z" />
                  </svg>
                </button>
                <button @click="removeQuestion(idx)" class="text-red-400 hover:text-red-600 ml-2" aria-label="Delete question">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div class="font-semibold text-black dark:text-gray-100 mb-2">{{ q.question }}</div>
              <template v-if="q.type === 'multiple_choice'">
                <div class="mb-1 text-sm text-gray-700 dark:text-gray-300 font-semibold">Options:</div>
                <ul class="ml-2">
                  <li v-for="(opt, oidx) in q.options" :key="opt.id" class="flex items-center gap-2 mb-1">
                    <span :class="{'text-green-600 font-bold': q.correctAnswer === opt.id, 'text-black dark:text-gray-100': q.correctAnswer !== opt.id}">
                      {{ oidx + 1 }}. {{ opt.text }}<span v-if="q.correctAnswer === opt.id"> &#10003;</span>
                    </span>
                  </li>
                </ul>
              </template>
              <template v-else-if="q.type === 'fill_blank'">
                <div class="mb-1 text-sm text-gray-700 dark:text-gray-300 font-semibold">Correct Answer:</div>
                <div class="ml-2 text-green-600 font-bold">{{ q.answer }}</div>
              </template>
              <template v-else-if="q.type === 'true_false'">
                <div class="mb-1 text-sm text-gray-700 dark:text-gray-300 font-semibold">Correct Answer:</div>
                <div class="ml-2 text-green-600 font-bold">{{ q.correctAnswer === 'true' ? 'True' : 'False' }}</div>
              </template>
            </div>
          </div>
        </div>
      </div>
    </template>
    <!-- Show QuestionEditModal only when showQuestionModal is true -->
    <QuestionEditModal
      v-if="showQuestionModal"
      :question="editingQuestion"
      :mode="questionModalMode"
      @save="handleQuestionSave"
      @cancel="closeQuestionModal"
    />
    <!-- Confirmation Modal for Deleting a Question -->
    <teleport to="body">
      <div v-if="showDeleteConfirm" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
        <div class="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 w-full max-w-xs mx-4 relative border border-gray-200 dark:border-gray-700">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Delete Question?</h3>
          <p class="text-gray-700 dark:text-gray-300 mb-4">Are you sure you want to delete this question? This action cannot be undone.</p>
          <div class="flex justify-end gap-2">
            <button @click="cancelDeleteQuestion" class="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-black dark:text-gray-100 font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-all">Cancel</button>
            <button @click="confirmDeleteQuestion" class="px-4 py-2 rounded bg-red-600 text-white font-semibold hover:bg-red-700 transition-all">Delete</button>
          </div>
        </div>
      </div>
    </teleport>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import QuestionEditModal from './QuestionEditModal.vue';
import { nanoid } from 'nanoid';

const props = defineProps({
  quiz: Object,
});
const emit = defineEmits(['back', 'update']);

const quiz = ref(JSON.parse(JSON.stringify(props.quiz)));
const showQuestionModal = ref(false);
const editingQuestion = ref(null);
const editingQuestionIndex = ref(-1);
const questionModalMode = ref('edit'); // 'edit' or 'add'
const showDeleteConfirm = ref(false);
const questionToDeleteIndex = ref(-1);

const handleBack = () => {
  emit('update', JSON.parse(JSON.stringify(quiz.value)));
  emit('back');
};

const openAddQuestion = () => {
  editingQuestion.value = {
    id: nanoid(),
    type: 'multiple_choice',
    question: '',
    options: [
      { id: 'a', text: '' },
      { id: 'b', text: '' },
      { id: 'c', text: '' },
      { id: 'd', text: '' }
    ],
    correctAnswer: 'a',
  };
  editingQuestionIndex.value = -1;
  questionModalMode.value = 'add';
  showQuestionModal.value = true;
};

const editQuestion = (q, idx) => {
  editingQuestion.value = JSON.parse(JSON.stringify(q));
  editingQuestionIndex.value = idx;
  questionModalMode.value = 'edit';
  showQuestionModal.value = true;
};

const closeQuestionModal = () => {
  showQuestionModal.value = false;
  editingQuestion.value = null;
  editingQuestionIndex.value = -1;
};

const handleQuestionSave = (question) => {
  console.log('handleQuestionSave called with:', question);
  console.log('questionModalMode:', questionModalMode.value, 'editingQuestionIndex:', editingQuestionIndex.value);
  if (questionModalMode.value === 'add') {
    quiz.value.questions.push(question);
    console.log('Added new question. Total questions:', quiz.value.questions.length);
  } else if (editingQuestionIndex.value !== -1) {
    // Replace the question at the correct index
    quiz.value.questions.splice(editingQuestionIndex.value, 1, question);
    console.log('Updated question at index', editingQuestionIndex.value, quiz.value.questions[editingQuestionIndex.value]);
  } else {
    console.warn('Edit mode but editingQuestionIndex is invalid:', editingQuestionIndex.value);
  }
  emit('update', JSON.parse(JSON.stringify(quiz.value)));
  closeQuestionModal();
};

const removeQuestion = (idx) => {
  questionToDeleteIndex.value = idx;
  showDeleteConfirm.value = true;
};

const confirmDeleteQuestion = () => {
  if (questionToDeleteIndex.value !== -1) {
    quiz.value.questions.splice(questionToDeleteIndex.value, 1);
    emit('update', JSON.parse(JSON.stringify(quiz.value)));
  }
  showDeleteConfirm.value = false;
  questionToDeleteIndex.value = -1;
};

const cancelDeleteQuestion = () => {
  showDeleteConfirm.value = false;
  questionToDeleteIndex.value = -1;
};

const getTypeLabel = (type) => {
  if (type === 'multiple_choice') return 'Multiple Choice';
  if (type === 'fill_blank') return 'Fill in the Blank';
  if (type === 'true_false') return 'True/False';
  return type;
};

const questionTypes = computed(() => {
  const types = new Set();
  quiz.value.questions.forEach(q => {
    if (q.type === 'multiple_choice') types.add('Multiple Choice');
    if (q.type === 'fill_blank') types.add('Fill in the Blank');
    if (q.type === 'true_false') types.add('True/False');
    if (q.type === 'identification') types.add('Identification');
  });
  return Array.from(types);
});

const lastUpdated = computed(() => {
  return quiz.value.updatedAt ? new Date(quiz.value.updatedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '';
});

// Add watcher to toggle modal-open class for QuestionEditModal
watch(showQuestionModal, (val) => {
  if (val) {
    document.body.classList.add('modal-open');
  } else {
    document.body.classList.remove('modal-open');
  }
});
</script> 
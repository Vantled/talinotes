<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
    <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl mx-4 p-0 overflow-y-auto max-h-[90vh] relative border border-gray-200 dark:border-gray-700">
      <!-- Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-blue-100 rounded-t-2xl">
        <h2 class="text-2xl font-extrabold text-black tracking-tight text-left">Edit Quiz</h2>
        <button @click="handleCancel" class="text-gray-400 hover:text-blue-600 transition-colors" aria-label="Close editor">
          <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div class="px-6 py-4">
        <div class="mb-6">
          <label class="block text-sm font-semibold text-black mb-1">Quiz Title</label>
          <input v-model="localQuiz.title" class="w-full p-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none bg-white shadow-sm text-black" />
        </div>
        <div>
          <h3 class="text-lg font-bold mb-3 text-black">Questions</h3>
          <div v-for="(q, idx) in localQuiz.questions" :key="q.id" class="mb-8 p-5 rounded-xl border border-gray-200 bg-white shadow-sm relative group transition-all">
            <button @click="removeQuestion(idx)" class="absolute top-3 right-3 text-red-400 hover:text-red-600 transition-colors" aria-label="Delete question">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div class="flex flex-col md:flex-row md:items-center gap-3 mb-2">
              <div class="flex-1">
                <label class="block text-xs font-semibold text-black mb-1">Type</label>
                <select v-model="q.type" class="p-2 rounded-lg border border-gray-300 bg-gray-50 focus:border-blue-500 text-black">
                  <option value="multiple_choice">Multiple Choice</option>
                  <option value="fill_blank">Fill in the Blank</option>
                  <option value="true_false">True or False</option>
                </select>
              </div>
              <div class="flex-1">
                <label class="block text-xs font-semibold text-black mb-1">Question</label>
                <input v-model="q.question" class="w-full p-2 rounded-lg border border-gray-300 bg-gray-50 focus:border-blue-500 text-black" />
              </div>
            </div>
            <template v-if="q.type === 'multiple_choice'">
              <div class="mb-2">
                <label class="block text-xs font-semibold text-black mb-1">Options</label>
                <div v-for="(opt, oidx) in q.options" :key="opt.id" class="flex items-center gap-2 mb-2 group">
                  <span class="font-semibold text-gray-600">{{ opt.id }})</span>
                  <input v-model="opt.text" class="flex-1 p-2 rounded-lg border border-gray-300 bg-gray-50 focus:border-blue-500 text-black" />
                  <input type="radio" :name="'mc-correct-' + q.id" v-model="q.correctAnswer" :value="opt.id" class="accent-blue-600" />
                  <button v-if="q.options.length > 2" @click="removeMCOption(q, oidx)" class="ml-1 text-gray-300 hover:text-red-500 transition-colors" aria-label="Delete option">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <button @click="addMCOption(q)" class="text-xs text-blue-600 hover:underline mb-2 font-semibold">+ Add Option</button>
            </template>
            <template v-else-if="q.type === 'fill_blank'">
              <div class="mb-2">
                <label class="block text-xs font-semibold text-black mb-1">Answer</label>
                <input v-model="q.answer" class="w-full p-2 rounded-lg border border-gray-300 bg-gray-50 focus:border-blue-500 text-black" />
              </div>
            </template>
            <template v-else-if="q.type === 'true_false'">
              <div class="mb-2">
                <label class="block text-xs font-semibold text-black mb-1">Correct Answer</label>
                <select v-model="q.correctAnswer" class="p-2 rounded-lg border border-gray-300 bg-gray-50 focus:border-blue-500 text-black">
                  <option value="true">True</option>
                  <option value="false">False</option>
                </select>
              </div>
            </template>
          </div>
          <div class="flex items-center gap-2 mt-4">
            <label class="text-sm font-semibold text-black">Add Question:</label>
            <select v-model="newQuestionType" class="p-2 rounded-lg border border-gray-300 bg-gray-50 text-black">
              <option disabled value="">Select type</option>
              <option value="multiple_choice">Multiple Choice</option>
              <option value="fill_blank">Fill in the Blank</option>
              <option value="true_false">True or False</option>
            </select>
            <button @click="addQuestion" :disabled="!newQuestionType" class="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold shadow hover:bg-blue-700 disabled:opacity-50 transition-all">Add</button>
          </div>
        </div>
        <div class="flex justify-end gap-2 mt-8">
          <button @click="handleCancel" class="px-5 py-2 rounded-lg bg-gray-200 text-black font-semibold hover:bg-gray-300 transition-all">Cancel</button>
          <button @click="handleSave" class="px-5 py-2 rounded-lg bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 transition-all">Save Changes</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch } from 'vue';
import { nanoid } from 'nanoid';

const props = defineProps({
  quiz: Object,
  show: Boolean
});
const emit = defineEmits(['close', 'save']);

const localQuiz = reactive(JSON.parse(JSON.stringify(props.quiz)));
const newQuestionType = ref('');

watch(() => props.quiz, (newQuiz) => {
  Object.assign(localQuiz, JSON.parse(JSON.stringify(newQuiz)));
});

const handleCancel = () => {
  emit('close');
};

const handleSave = () => {
  emit('save', JSON.parse(JSON.stringify(localQuiz)));
};

const addQuestion = () => {
  if (!newQuestionType.value) return;
  if (newQuestionType.value === 'multiple_choice') {
    localQuiz.questions.push({
      id: nanoid(),
      type: 'multiple_choice',
      question: '',
      options: [
        { id: 'a', text: '' },
        { id: 'b', text: '' },
        { id: 'c', text: '' },
        { id: 'd', text: '' }
      ],
      correctAnswer: 'a'
    });
  } else if (newQuestionType.value === 'fill_blank') {
    localQuiz.questions.push({
      id: nanoid(),
      type: 'fill_blank',
      question: '',
      answer: ''
    });
  } else if (newQuestionType.value === 'true_false') {
    localQuiz.questions.push({
      id: nanoid(),
      type: 'true_false',
      question: '',
      options: ['True', 'False'],
      correctAnswer: 'true'
    });
  }
  newQuestionType.value = '';
};

const removeQuestion = (idx) => {
  localQuiz.questions.splice(idx, 1);
};

const addMCOption = (q) => {
  if (q.options.length < 6) {
    const nextId = String.fromCharCode(97 + q.options.length); // 'e', 'f', etc.
    q.options.push({ id: nextId, text: '' });
  }
};

const removeMCOption = (q, oidx) => {
  if (q.options.length > 2) {
    q.options.splice(oidx, 1);
    // If the correct answer was this option, reset to first option
    if (!q.options.some(opt => opt.id === q.correctAnswer)) {
      q.correctAnswer = q.options[0]?.id || '';
    }
  }
};
</script> 
<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
    <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md mx-4 p-0 overflow-y-auto max-h-[90vh] relative border border-gray-200 dark:border-gray-700">
      <!-- Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-blue-100 rounded-t-2xl">
        <div>
          <h2 class="text-xl font-extrabold text-black text-left dark:text-gray-100">
            {{ mode === 'edit' ? 'Edit Question' : 'Add Question' }}
          </h2>
          <div class="text-xs text-gray-500 mt-1 dark:text-gray-400">Modify the question type, text, and answer options.</div>
        </div>
        <button @click="handleCancel" class="text-gray-400 hover:text-blue-600 transition-colors" aria-label="Close editor">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div class="px-6 py-6">
        <div class="mb-4">
          <label class="block text-xs font-semibold text-black mb-1 dark:text-gray-100">Question Type</label>
          <select v-model="localQuestion.type" class="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:border-blue-500 text-black dark:text-gray-100">
            <option value="multiple_choice">Multiple Choice</option>
            <option value="fill_blank">Fill in the Blank</option>
            <option value="true_false">True/False</option>
          </select>
        </div>
        <div class="mb-4">
          <label class="block text-xs font-semibold text-black mb-1 dark:text-gray-100">Question</label>
          <input v-model="localQuestion.question" class="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-blue-500 text-black dark:text-gray-100" />
        </div>
        <template v-if="localQuestion.type === 'multiple_choice'">
          <div class="mb-2">
            <label class="block text-xs font-semibold text-black mb-1 dark:text-gray-100">Answer Options</label>
            <div v-for="(opt, oidx) in localQuestion.options" :key="opt.id" class="flex items-center gap-2 mb-2 group">
              <input type="radio" :name="'mc-correct-' + localQuestion.id" v-model="localQuestion.correctAnswer" :value="opt.id" class="accent-blue-600" :aria-label="'Mark as correct answer'" />
              <input v-model="opt.text" class="flex-1 p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:border-blue-500 text-black dark:text-gray-100" :aria-label="'Option ' + (oidx + 1)" />
              <button v-if="localQuestion.options.length > 2" @click="removeMCOption(oidx)" class="ml-1 text-gray-300 hover:text-red-500 transition-colors" aria-label="Delete option">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <button @click="addMCOption" class="text-xs text-blue-600 hover:underline font-semibold mt-1">+ Add Option</button>
          </div>
          <div class="mt-2 text-xs text-gray-700 dark:text-gray-200">
            Correct answer: <span class="text-green-600 font-semibold">{{ getCorrectMCText }}</span>
          </div>
        </template>
        <template v-else-if="localQuestion.type === 'fill_blank'">
          <div class="mb-2">
            <label class="block text-xs font-semibold text-black mb-1 dark:text-gray-100">Correct Answer</label>
            <input v-model="localQuestion.answer" class="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:border-blue-500 text-black dark:text-gray-100" />
          </div>
        </template>
        <template v-else-if="localQuestion.type === 'true_false'">
          <div class="mb-2">
            <label class="block text-xs font-semibold text-black mb-1 dark:text-gray-100">Correct Answer</label>
            <select v-model="localQuestion.correctAnswer" class="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:border-blue-500 text-black dark:text-gray-100">
              <option value="true">True</option>
              <option value="false">False</option>
            </select>
          </div>
        </template>
        <div class="flex justify-end gap-2 mt-8">
          <button @click="handleCancel" class="px-5 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-black dark:text-gray-100 font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-all">Cancel</button>
          <button @click="handleSave" class="px-5 py-2 rounded-lg bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 dark:hover:bg-blue-800 transition-all">Save Changes</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, reactive, computed } from 'vue';
import { nanoid } from 'nanoid';

const props = defineProps({
  question: Object,
  mode: String // 'edit' or 'add'
});
const emit = defineEmits(['save', 'cancel']);

const localQuestion = reactive(JSON.parse(JSON.stringify(props.question)));

watch(() => props.question, (newQ) => {
  Object.assign(localQuestion, JSON.parse(JSON.stringify(newQ)));
});

const handleCancel = () => {
  emit('cancel');
};

const handleSave = () => {
  // Clean up empty options for MC
  if (localQuestion.type === 'multiple_choice') {
    localQuestion.options = localQuestion.options.filter(opt => opt.text.trim() !== '');
    if (!localQuestion.options.some(opt => opt.id === localQuestion.correctAnswer)) {
      localQuestion.correctAnswer = localQuestion.options[0]?.id || '';
    }
  }
  emit('save', JSON.parse(JSON.stringify(localQuestion)));
};

const addMCOption = () => {
  if (localQuestion.options.length < 6) {
    const nextId = String.fromCharCode(97 + localQuestion.options.length); // 'e', 'f', etc.
    localQuestion.options.push({ id: nextId, text: '' });
  }
};

const removeMCOption = (oidx) => {
  if (localQuestion.options.length > 2) {
    localQuestion.options.splice(oidx, 1);
    if (!localQuestion.options.some(opt => opt.id === localQuestion.correctAnswer)) {
      localQuestion.correctAnswer = localQuestion.options[0]?.id || '';
    }
  }
};

const getCorrectMCText = computed(() => {
  if (localQuestion.type !== 'multiple_choice') return '';
  const opt = localQuestion.options.find(opt => opt.id === localQuestion.correctAnswer);
  return opt ? opt.text : '';
});
</script> 
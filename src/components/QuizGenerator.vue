<template>
  <div class="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-4 relative">
    <!-- Quiz Generation Form -->
    <div v-if="!generatedQuiz" class="space-y-4">
      <h2 class="text-xl font-semibold text-gray-900">Generate Quiz</h2>
      <div class="space-y-2">
        <label for="content" class="block text-sm font-medium text-gray-700">Content to generate quiz from:</label>
        <textarea
          id="content"
          v-model="content"
          rows="6"
          class="w-full p-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          placeholder="Enter the content you want to generate a quiz from..."
        ></textarea>
      </div>
      <button
        @click="generateQuiz"
        :disabled="uiStore.isGeneratingQuiz || !content.trim()"
        class="w-full px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span v-if="uiStore.isGeneratingQuiz">Generating Quiz...</span>
        <span v-else>Generate Quiz</span>
      </button>
    </div>

    <!-- Generated Quiz Preview -->
    <div v-else class="space-y-6">
      <div class="flex justify-between items-center">
        <h2 class="text-xl font-semibold text-gray-900">Generated Quiz</h2>
        <button
          @click="resetQuiz"
          class="px-3 py-1 text-sm text-gray-600 hover:text-gray-900"
        >
          Generate New Quiz
        </button>
      </div>

      <!-- Quiz Questions -->
      <div class="space-y-8">
        <div
          v-for="(question, index) in parsedQuestions"
          :key="index"
          class="p-6 border border-gray-200 rounded-lg bg-white shadow-sm"
        >
          <h3 class="text-lg font-medium text-gray-900 mb-4">
            {{ index + 1 }}. {{ question.question }}
          </h3>

          <!-- Multiple Choice Options -->
          <div v-if="question.type === 'multiple_choice'" class="space-y-3">
            <div
              v-for="(option, optIndex) in question.options"
              :key="optIndex"
              class="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
            >
              <span class="text-gray-600 font-medium">{{ String.fromCharCode(97 + optIndex) }})</span>
              <span class="text-gray-900">{{ option.text }}</span>
            </div>
            <div class="mt-4 p-3 bg-green-50 rounded-lg">
              <p class="text-sm text-gray-600">
                Correct answer: <span class="font-medium text-green-600">{{ question.correctAnswer }}</span>
              </p>
            </div>
          </div>

          <!-- Fill in the Blank -->
          <div v-else-if="question.type === 'fill_blank'" class="space-y-3">
            <div class="p-3 bg-gray-50 rounded-lg">
              <p class="text-gray-600">Answer: <span class="font-medium text-green-600">{{ question.answer }}</span></p>
            </div>
          </div>

          <!-- True or False -->
          <div v-else-if="question.type === 'true_false'" class="space-y-3">
            <div class="p-3 bg-gray-50 rounded-lg flex flex-col gap-2">
              <div v-for="option in question.options" :key="option" class="text-gray-900">{{ option }}</div>
            </div>
            <div class="mt-2 p-2 bg-green-50 rounded-lg">
              <p class="text-sm text-gray-600">Correct answer: <span class="font-medium text-green-600">{{ question.correctAnswer }}</span></p>
            </div>
          </div>
        </div>
      </div>

      <!-- Start Quiz Button -->
      <button
        @click="startQuiz"
        class="w-full px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
      >
        Start Quiz
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useQuizStore } from '../stores/quizStore';
import { useUiStore } from '../stores/uiStore';
import { config } from '../config';

const props = defineProps({
  note: {
    type: Object,
    default: null
  }
});

const quizStore = useQuizStore();
const uiStore = useUiStore();
const content = ref('');
const generatedQuiz = ref(null);

// Auto-generate quiz if note is provided
onMounted(async () => {
  if (props.note?.content) {
    content.value = props.note.content.replace(/<[^>]*>/g, ' ').trim();
    await generateQuiz();
  }
});

// Parse the generated quiz text into structured questions
const parsedQuestions = computed(() => {
  if (!generatedQuiz.value) return [];

  const questions = [];
  const lines = generatedQuiz.value.split('\n').map(line => line.trim()).filter(line => line);
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    // Multiple Choice
    if (line === 'Multiple Choice:') {
      const qLine = lines[i + 1] || '';
      const aLine = lines[i + 2] || '';
      const bLine = lines[i + 3] || '';
      const cLine = lines[i + 4] || '';
      const dLine = lines[i + 5] || '';
      const correctLine = lines[i + 6] || '';
      if (
        qLine.startsWith('Q:') &&
        aLine.startsWith('a)') &&
        bLine.startsWith('b)') &&
        cLine.startsWith('c)') &&
        dLine.startsWith('d)') &&
        correctLine.startsWith('Correct:')
      ) {
        questions.push({
          type: 'multiple_choice',
          question: qLine.substring(2).trim(),
          options: [
            { id: 'a', text: aLine.substring(2).trim() },
            { id: 'b', text: bLine.substring(2).trim() },
            { id: 'c', text: cLine.substring(2).trim() },
            { id: 'd', text: dLine.substring(2).trim() }
          ],
          correctAnswer: correctLine.substring(8).trim().toLowerCase()
        });
        i += 7;
        continue;
      }
    }
    // Fill in the Blank
    if (line === 'Fill in the Blank:') {
      const fillLine = lines[i + 1] || '';
      const answerLine = lines[i + 2] || '';
      if (fillLine.startsWith('Fill:') && answerLine.startsWith('A:')) {
        questions.push({
          type: 'fill_blank',
          question: fillLine.substring(5).trim(),
          answer: answerLine.substring(2).trim()
        });
        i += 3;
        continue;
      }
    }
    // True or False
    if (line === 'True or False:') {
      const tofLine = lines[i + 1] || '';
      const aLine = lines[i + 2] || '';
      const bLine = lines[i + 3] || '';
      const correctLine = lines[i + 4] || '';
      if (
        tofLine.startsWith('True or False:') &&
        aLine.toLowerCase().startsWith('a) true') &&
        bLine.toLowerCase().startsWith('b) false') &&
        correctLine.startsWith('Correct:')
      ) {
        questions.push({
          type: 'true_false',
          question: tofLine.substring(15).trim(),
          options: ['True', 'False'],
          correctAnswer: correctLine.substring(8).trim().toLowerCase()
        });
        i += 5;
        continue;
      }
    }

    i++;
  }
  return questions;
});

const generateQuiz = async () => {
  if (!content.value.trim()) return;
  uiStore.startQuizProgress();
  try {
    console.log('Sending request to generate quiz...');
    const response = await fetch(`${config.BACKEND_URL}/api/generate-quiz`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ content: content.value })
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`Failed to generate quiz: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log('Received quiz data:', data);
    
    if (!data || !data[0] || !data[0].generated_text) {
      throw new Error('Invalid response format from server');
    }

    generatedQuiz.value = data[0].generated_text;
    uiStore.finishQuizProgress();
    uiStore.showToast('Quiz generated successfully', 'success');
  } catch (error) {
    uiStore.finishQuizProgress();
    console.error('Error generating quiz:', error);
    uiStore.showToast(error.message || 'Failed to generate quiz. Please try again.', 'error', 3500);
  }
};

const resetQuiz = () => {
  generatedQuiz.value = null;
  content.value = '';
};

const startQuiz = () => {
  if (!parsedQuestions.value.length) return;

  // Create a quiz object for the quiz store
  const quiz = {
    title: 'Generated Quiz',
    questions: parsedQuestions.value.map((q, index) => ({
      id: index + 1,
      ...q
    }))
  };

  // Set the current quiz in the store
  quizStore.setCurrentQuiz(quiz);
  emit('start-quiz');
};

const emit = defineEmits(['start-quiz']);
</script>

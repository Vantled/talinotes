<template>
  <div class="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-4">
    <div v-if="!quiz" class="text-center py-8">
      <p class="text-gray-500">No quiz selected</p>
    </div>
    <div v-else>
      <!-- Quiz Summary Page -->
      <div v-if="showSummary" class="flex flex-col items-center justify-center min-h-[60vh] min-h-[calc(100vh-6rem)] pt-24 pb-8">
        <div class="mb-6 flex flex-col items-center">
          <div v-if="(score / quiz.questions.length) >= 0.8" class="text-5xl mb-2">🎉</div>
          <div v-else class="text-5xl mb-2">👏</div>
          <h1 class="text-3xl font-extrabold mb-2 text-center" :class="(score / quiz.questions.length) >= 0.8 ? 'text-green-600' : 'text-yellow-500'">
            {{ (score / quiz.questions.length) >= 0.8 ? 'Great Job!' : 'Good Try!' }}
          </h1>
          <div class="text-lg text-gray-700 mb-1">You got <span class="font-bold text-blue-600">{{ score }}</span> out of <span class="font-bold text-blue-600">{{ quiz.questions.length }}</span> correct</div>
          <div class="text-2xl font-bold mt-2" :class="(score / quiz.questions.length) >= 0.8 ? 'text-green-600' : 'text-yellow-500'">
            {{ Math.round((score / quiz.questions.length) * 100) }}%
          </div>
        </div>
        <div class="flex flex-col gap-4 w-full max-w-xs mt-4">
          <button
            @click="handleGoBack"
            class="w-full px-4 py-3 text-white bg-blue-600 rounded-lg text-lg font-semibold shadow hover:bg-blue-700 transition-colors"
            aria-label="Go back to quiz list"
          >
            Go Back
          </button>
          <button
            @click="handleRetakeQuiz"
            class="w-full px-4 py-3 text-blue-600 bg-blue-100 rounded-lg text-lg font-semibold shadow hover:bg-blue-200 transition-colors"
            aria-label="Retake this quiz"
          >
            Retake Quiz
          </button>
        </div>
      </div>
      <!-- Back Button -->
      <button
        @click="handleBack"
        class="fixed left-4 top-16 z-20 p-2 rounded-full bg-white bg-opacity-80 shadow-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label="Cancel quiz and return to list"
        tabindex="0"
        @keydown.enter="handleBack"
        @keydown.space="handleBack"
      >
        <svg class="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <!-- Quiz Header -->
      <div v-if="!showSummary" class="pt-24 mb-6">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100 text-center">{{ quiz.title }}</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1 text-center">Question {{ currentQuestionIndex + 1 }} of {{ quiz.questions.length }}</p>
      </div>

      <!-- Question -->
      <div v-if="currentQuestion && !showSummary" class="mb-6">
        <p class="text-lg text-gray-900 dark:text-gray-100 mb-4 text-center">{{ currentQuestion.question }}</p>

        <!-- Multiple Choice Options -->
        <div v-if="currentQuestion.type === 'multiple_choice'" class="space-y-3">
          <button
            v-for="(option, optIndex) in currentQuestion.options"
            :key="option.id"
            @click="selectAnswer(option.id)"
            class="w-full text-left p-3 rounded-lg border transition-all duration-200 flex items-center gap-2"
            :class="{
              // Default
              'border-gray-200 hover:border-blue-500 dark:border-gray-700 dark:hover:border-blue-400': !showAnswer,
              'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/40 dark:text-blue-200': selectedAnswer === option.id && !showAnswer,
              // Correct answer highlight (always green if correct)
              'border-green-500 bg-green-50 dark:border-green-400 dark:bg-green-900/40 dark:text-green-200': showAnswer && option.id === currentQuestion.correctAnswer,
              // User's wrong answer highlight (gray)
              'border-gray-400 bg-gray-100 text-gray-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400': showAnswer && selectedAnswer === option.id && option.id !== currentQuestion.correctAnswer
            }"
            :disabled="showAnswer"
            tabindex="0"
            :aria-label="option.text"
          >
            <span class="font-semibold text-gray-600 dark:text-gray-300 select-none">{{ option.id }})</span>
            <span class="font-medium text-gray-900 dark:text-gray-100">{{ option.text }}</span>
          </button>
          <div v-if="showAnswer && selectedAnswer !== currentQuestion.correctAnswer" class="mt-2">
            <p class="text-sm text-gray-600 dark:text-green-300">Correct answer: <span class="font-medium text-green-600 dark:text-green-400">{{ getMultipleChoiceCorrectDisplay(currentQuestion) }}</span></p>
          </div>
        </div>

        <!-- Fill in the Blank -->
        <div v-else-if="currentQuestion.type === 'fill_blank'" class="space-y-3">
          <input
            v-model="textAnswer"
            type="text"
            placeholder="Type your answer here..."
            class="w-full p-3 rounded-lg border transition-colors duration-200 bg-white dark:bg-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-700 placeholder-gray-400 dark:placeholder-gray-500"
            :class="{
              'border-gray-200 dark:border-gray-700': !showAnswer,
              'border-green-500 dark:border-green-400': showAnswer && isFillBlankCorrect,
              'border-red-500 dark:border-red-400': showAnswer && !isFillBlankCorrect
            }"
            :disabled="showAnswer"
          />
          <div v-if="showAnswer && !isFillBlankCorrect" class="mt-2">
            <p class="text-sm text-gray-600 dark:text-green-300">Correct answer: <span class="font-medium text-green-600 dark:text-green-400">{{ currentQuestion.answer }}</span></p>
          </div>
        </div>

        <!-- True or False -->
        <div v-else-if="currentQuestion.type === 'true_false'" class="space-y-3">
          <button
            v-for="option in currentQuestion.options"
            :key="option"
            @click="selectAnswer(option)"
            class="w-full text-left p-3 rounded-lg border transition-all duration-200"
            :class="{
              'border-gray-200 hover:border-blue-500 dark:border-gray-700 dark:hover:border-blue-400': !showAnswer,
              'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/40 dark:text-blue-200': selectedAnswer === option && !showAnswer,
              'border-green-500 bg-green-50 dark:border-green-400 dark:bg-green-900/40 dark:text-green-200': showAnswer && selectedAnswer === option && normalizeTrueFalse(option) === normalizeTrueFalse(currentQuestion.correctAnswer),
              'border-red-500 bg-red-50 dark:border-red-400 dark:bg-red-900/40 dark:text-red-200': showAnswer && selectedAnswer === option && normalizeTrueFalse(option) !== normalizeTrueFalse(currentQuestion.correctAnswer)
            }"
            :disabled="showAnswer"
          >
            <span class="font-medium text-gray-900 dark:text-gray-100">{{ option }}</span>
          </button>
          <div v-if="showAnswer && !isTrueFalseCorrect" class="mt-2">
            <p class="text-sm text-gray-600 dark:text-green-300">Correct answer: <span class="font-medium text-green-600 dark:text-green-400">{{ getTrueFalseCorrectDisplay(currentQuestion) }}</span></p>
          </div>
        </div>
      </div>

      <!-- Navigation Buttons -->
      <div class="flex justify-end mt-6">
        <button
          v-if="!showAnswer && canCheckAnswer && !showSummary"
          @click="checkAnswer"
          class="px-4 py-2 text-white bg-blue-600 dark:bg-blue-700 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors"
        >
          Check Answer
        </button>
        <button
          v-else-if="showAnswer && currentQuestionIndex < quiz.questions.length - 1 && !showSummary"
          @click="nextQuestion"
          class="px-4 py-2 text-white bg-blue-600 dark:bg-blue-700 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors"
        >
          Next Question
        </button>
        <button
          v-else-if="showAnswer && currentQuestionIndex === quiz.questions.length - 1 && !showSummary"
          @click="finishQuiz"
          class="px-4 py-2 text-white bg-green-600 dark:bg-green-700 rounded-lg hover:bg-green-700 dark:hover:bg-green-800 transition-colors"
        >
          Finish Quiz
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useQuizStore } from '../stores/quizStore';
import { Toast } from '@capacitor/toast';
import { hapticsService } from '../services/hapticsService';

const quizStore = useQuizStore();
const currentQuestionIndex = ref(0);
const selectedAnswer = ref(null);
const textAnswer = ref('');
const showAnswer = ref(false);
const score = ref(0);
const showSummary = ref(false);

const quiz = computed(() => quizStore.currentQuiz);

// Randomized questions
const randomizedQuestions = ref([]);

function shuffleArray(array) {
  const arr = array.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const initializeQuiz = () => {
  if (quiz.value && Array.isArray(quiz.value.questions)) {
    randomizedQuestions.value = shuffleArray(quiz.value.questions);
    currentQuestionIndex.value = 0;
    selectedAnswer.value = null;
    textAnswer.value = '';
    showAnswer.value = false;
    score.value = 0;
    showSummary.value = false;
  }
};

onMounted(() => {
  initializeQuiz();
});

watch(quiz, () => {
  initializeQuiz();
});

const currentQuestion = computed(() => randomizedQuestions.value[currentQuestionIndex.value]);

function normalizeText(str) {
  return (str || '')
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()\[\]"]/g, '')
    .replace(/\s{2,}/g, ' ');
}

function normalizeBool(str) {
  if (typeof str === 'boolean') return str;
  const s = (str || '').toString().trim().toLowerCase();
  if (s === 'true' || s === 't' || s === 'yes' || s === 'y') return true;
  if (s === 'false' || s === 'f' || s === 'no' || s === 'n') return false;
  return null; // fallback for unexpected values
}

function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

const canCheckAnswer = computed(() => {
  if (!currentQuestion.value) return false;
  switch (currentQuestion.value.type) {
    case 'multiple_choice':
      return selectedAnswer.value !== null;
    case 'true_false':
      return selectedAnswer.value !== null;
    case 'fill_blank':
      return textAnswer.value.trim() !== '';
    default:
      return false;
  }
});

const isFillBlankCorrect = computed(() => {
  if (!showAnswer.value || currentQuestion.value?.type !== 'fill_blank') return false;
  return normalizeText(textAnswer.value) === normalizeText(currentQuestion.value.answer);
});

const normalizeTrueFalse = (val) => {
  if (!val) return '';
  const s = val.toString().trim().toLowerCase();
  if (["a", "true", "t", "yes", "y"].includes(s)) return "true";
  if (["b", "false", "f", "no", "n"].includes(s)) return "false";
  return '';
};

const isTrueFalseCorrect = computed(() => {
  if (!showAnswer.value || currentQuestion.value?.type !== 'true_false') return false;
  console.log('Comparing selectedAnswer and correctAnswer:', selectedAnswer.value, currentQuestion.value.correctAnswer);
  const user = normalizeTrueFalse(selectedAnswer.value);
  const correct = normalizeTrueFalse(currentQuestion.value.correctAnswer);
  console.log('Normalized values:', user, correct);
  return user === correct;
});

const getMultipleChoiceCorrectDisplay = (question) => {
  if (!question || !question.options) return '';
  const correctId = (question.correctAnswer || '').toLowerCase();
  const correctOption = question.options.find(opt => (opt.id || '').toLowerCase() === correctId);
  if (correctOption) {
    return `${correctOption.id}) ${correctOption.text}`;
  }
  return correctId;
};

const getTrueFalseCorrectDisplay = (question) => {
  const correct = normalizeTrueFalse(question.correctAnswer);
  return correct.charAt(0).toUpperCase() + correct.slice(1);
};

const selectAnswer = (answer) => {
  console.log('selectAnswer called with:', answer);
  if (!showAnswer.value) {
    selectedAnswer.value = answer;
    console.log('selectedAnswer.value set to:', selectedAnswer.value);
  }
};

const checkAnswer = async () => {
  await hapticsService.medium();
  showAnswer.value = true;
  if (selectedAnswer.value === quiz.value.questions[currentQuestionIndex.value].correctAnswer) {
    await hapticsService.success();
    score.value++;
  } else {
    await hapticsService.error();
  }
};

const nextQuestion = async () => {
  await hapticsService.light();
  currentQuestionIndex.value++;
  showAnswer.value = false;
  selectedAnswer.value = null;
  textAnswer.value = '';
};

const finishQuiz = async () => {
  await hapticsService.success();
  showSummary.value = true;
  const percentage = (score.value / quiz.value.questions.length) * 100;
  let message = '';
  if (percentage >= 90) {
    message = 'Excellent!';
  } else if (percentage >= 70) {
    message = 'Good job!';
  } else {
    message = 'Keep practicing!';
  }
  await Toast.show({
    text: `${message} You scored ${score.value}/${quiz.value.questions.length}`,
    duration: 'long'
  });
};

const handleRetakeQuiz = () => {
  currentQuestionIndex.value = 0;
  selectedAnswer.value = null;
  textAnswer.value = '';
  showAnswer.value = false;
  score.value = 0;
  showSummary.value = false;
};

const handleGoBack = () => {
  emit('finish');
};

const handleBack = async () => {
  // Show confirmation dialog
  const confirmed = window.confirm('Are you sure you want to cancel this quiz? Your progress will be lost.');
  if (confirmed) {
    // Reset quiz state
    currentQuestionIndex.value = 0;
    selectedAnswer.value = null;
    textAnswer.value = '';
    showAnswer.value = false;
    score.value = 0;
    
    // Emit finish event to return to quiz list first
    emit('finish');
    
    // Show toast notification after component is closed
    setTimeout(async () => {
      await Toast.show({
        text: 'Quiz cancelled',
        duration: 'short',
        position: 'bottom'
      });
    }, 100);
  }
};

const emit = defineEmits(['finish']);
</script>

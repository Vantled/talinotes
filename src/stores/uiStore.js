import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useUiStore = defineStore('ui', () => {
  const isGeneratingQuiz = ref(false);
  const quizProgress = ref(0);
  let progressInterval = null;
  const toast = ref({ visible: false, message: '', type: 'success' });
  let toastTimeout = null;

  const startQuizProgress = () => {
    console.log('startQuizProgress called');
    quizProgress.value = 0;
    isGeneratingQuiz.value = true;
    if (progressInterval) clearInterval(progressInterval);
    progressInterval = setInterval(() => {
      if (quizProgress.value < 90) {
        quizProgress.value += Math.random() * 3 + 1;
        if (quizProgress.value > 90) quizProgress.value = 90;
      }
      console.log('progress:', quizProgress.value);
    }, 200);
    console.log('isGeneratingQuiz:', isGeneratingQuiz.value);
  };

  const finishQuizProgress = () => {
    console.log('finishQuizProgress called');
    if (progressInterval) clearInterval(progressInterval);
    quizProgress.value = 100;
    setTimeout(() => {
      isGeneratingQuiz.value = false;
      quizProgress.value = 0;
      console.log('isGeneratingQuiz:', isGeneratingQuiz.value);
    }, 600);
  };

  const showToast = (message, type = 'success', duration = 2000) => {
    if (toastTimeout) clearTimeout(toastTimeout);
    toast.value = { visible: true, message, type };
    toastTimeout = setTimeout(() => {
      toast.value.visible = false;
    }, duration);
  };

  const hideToast = () => {
    if (toastTimeout) clearTimeout(toastTimeout);
    toast.value.visible = false;
  };

  return {
    isGeneratingQuiz,
    quizProgress,
    startQuizProgress,
    finishQuizProgress,
    toast,
    showToast,
    hideToast,
  };
}); 
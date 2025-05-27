import { ref, onMounted } from 'vue';

const isDarkMode = ref(false);

const setDarkClass = (value: boolean) => {
  if (value) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
};

const toggleDarkMode = () => {
  isDarkMode.value = !isDarkMode.value;
  setDarkClass(isDarkMode.value);
  localStorage.setItem('talinotes-dark-mode', isDarkMode.value ? '1' : '0');
};

onMounted(() => {
  isDarkMode.value = localStorage.getItem('talinotes-dark-mode') === '1';
  setDarkClass(isDarkMode.value);
});

export const useDarkMode = () => ({
  isDarkMode,
  toggleDarkMode,
}); 
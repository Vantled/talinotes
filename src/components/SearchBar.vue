<template>
  <div class="w-full sticky top-0 z-20 bg-white dark:bg-gray-900 pb-2">
    <div class="relative">
      <span class="absolute inset-y-0 left-0 flex items-center pl-4">
        <svg class="w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </span>
      <input
        type="text"
        v-model="searchQuery"
        @input="handleSearch"
        placeholder="Search"
        class="w-full pl-12 pr-4 py-3 text-base text-gray-700 dark:text-gray-100 bg-gray-100 dark:bg-gray-800 rounded-full shadow focus:outline-none focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-yellow-400 dark:focus:ring-yellow-500 placeholder-gray-400 dark:placeholder-gray-400 transition-all duration-200"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useNoteStore } from '../stores/noteStore';

const noteStore = useNoteStore();
const searchQuery = ref('');
let searchTimeout = null;

const handleSearch = () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }
  searchTimeout = setTimeout(() => {
    if (searchQuery.value.trim()) {
      noteStore.searchNotes(searchQuery.value);
    } else {
      noteStore.fetchNotes();
    }
  }, 300);
};

watch(searchQuery, (newValue) => {
  if (!newValue.trim()) {
    noteStore.fetchNotes();
  }
});
</script>

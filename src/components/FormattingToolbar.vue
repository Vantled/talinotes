<template>
  <div 
    class="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex items-center justify-around px-4 py-2 overflow-x-auto transition-opacity duration-200"
    :class="[
      isKeyboardOpen ? 'fixed bottom-0 left-0 right-0 z-[9999]' : 'sticky bottom-0 left-0 right-0 z-40',
      disabled ? 'pointer-events-none opacity-50' : ''
    ]"
  >
    <button
      @click="handleStyleClick"
      class="flex flex-col items-center p-2 rounded-lg hover:bg-gray-100 focus:outline-none"
      aria-label="Text Style"
      tabindex="0"
    >
      <svg class="w-6 h-6 text-gray-700 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7" />
      </svg>
      <span class="text-xs text-gray-600">Style</span>
    </button>

    <button
      @click="handleChecklistClick"
      class="flex flex-col items-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none"
      aria-label="Checklist"
      tabindex="0"
    >
      <svg class="w-6 h-6 text-gray-700 dark:text-blue-300 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <rect x="4" y="4" width="16" height="16" rx="3" stroke-width="2" />
        <path d="M8 12.5l3 3 5-5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
      <span class="text-xs text-gray-600 dark:text-blue-200">Checklist</span>
    </button>

    <button
      ref="highlightButtonRef"
      @click="handleHighlightClick"
      @mousedown="handleHighlightHoldStart"
      @touchstart="handleHighlightHoldStart"
      @mouseup="handleHighlightHoldEnd"
      @mouseleave="handleHighlightHoldEnd"
      @touchend="handleHighlightHoldEnd"
      class="flex flex-col items-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none"
      aria-label="Highlight"
      tabindex="0"
    >
      <svg class="w-6 h-6 text-yellow-500 dark:text-yellow-300 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 20h16M9 8l6 6M15 8l-6 6M9 8V4h6v4" />
      </svg>
      <span class="text-xs text-yellow-600 dark:text-yellow-300">Highlight</span>
    </button>
  </div>

  <div
    v-if="showHighlightPalette"
    ref="colorPickerRef"
    :style="{ position: 'absolute', top: highlightPalettePosition.top + 'px', left: highlightPalettePosition.left + 'px', zIndex: 3000, width: '200px', maxWidth: '200px' }"
    class="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-4 flex flex-row gap-2 w-auto border border-gray-200 dark:border-gray-700 overflow-x-auto scrollbar-thin"
  >
    <button
      v-for="color in highlightColors"
      :key="color"
      :style="{ backgroundColor: color }"
      class="w-7 h-7 rounded-full border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400 flex-shrink-0"
      @click="handleSelectHighlightColor(color)"
      :aria-label="`Highlight with color ${color}`"
      tabindex="0"
    ></button>
  </div>
</template>

<script setup>
import { Editor } from '@tiptap/vue-3';
import { ref, nextTick, onMounted, onBeforeUnmount } from 'vue';

const props = defineProps({
  editor: {
    type: Editor,
    required: true
  },
  isKeyboardOpen: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['style', 'checklist', 'files', 'scribble']);

const highlightHoldTimeout = ref(null);
const showHighlightPalette = ref(false);
const highlightColors = [
  '#fde047', // yellow-200
  '#fca5a5', // red-300
  '#6ee7b7', // green-300
  '#93c5fd', // blue-300
  '#fcd34d', // yellow-300
  '#fbbf24', // yellow-400
  '#f87171', // red-400
  '#34d399', // green-400
  '#60a5fa', // blue-400
  '#f59e42', // orange-400
];
const lastHighlightColor = ref('#fde047');
const highlightButtonRef = ref(null);
const highlightPalettePosition = ref({ top: 0, left: 0 });
const colorPickerRef = ref(null);

const handleStyleClick = () => {
  emit('style');
};

const handleChecklistClick = () => {
  try {
    if (!props.editor) {
      console.error('Editor prop is not available');
      return;
    }

    console.log('Editor state:', {
      isActive: props.editor.isActive('taskList'),
      isFocused: props.editor.isFocused,
      isEditable: props.editor.isEditable,
      isEmpty: props.editor.isEmpty
    });
    
    if (!props.editor.isEditable) {
      console.error('Editor is not editable');
      return;
    }

    console.log('Attempting to toggle task list...');
    const chain = props.editor.chain();
    console.log('Chain created');
    
    chain.focus();
    console.log('Focus called');
    
    chain.toggleTaskList();
    console.log('Toggle task list called');
    
    chain.run();
    console.log('Task list toggled successfully');
  } catch (error) {
    console.error('Error toggling task list:', {
      message: error.message,
      stack: error.stack,
      error: error
    });
  }
};

const handleHighlightClick = () => {
  props.editor.chain().focus().toggleHighlight({ color: lastHighlightColor.value }).run();
};

const handleHighlightHoldStart = (event) => {
  highlightHoldTimeout.value = setTimeout(async () => {
    await nextTick();
    const btn = highlightButtonRef.value;
    const pickerWidth = 200; // px
    if (btn) {
      const rect = btn.getBoundingClientRect();
      let left = rect.left + window.scrollX + rect.width / 2 - pickerWidth / 2;
      // Prevent overflow right
      const maxLeft = window.innerWidth - pickerWidth - 8; // 8px margin
      if (left > maxLeft) left = maxLeft;
      // Prevent overflow left
      if (left < 8) left = 8;
      highlightPalettePosition.value = {
        top: rect.top + window.scrollY - 60, // 60px above the button
        left,
      };
    }
    showHighlightPalette.value = true;
  }, 400); // 400ms for long-press
};

const handleHighlightHoldEnd = () => {
  clearTimeout(highlightHoldTimeout.value);
};

const handleSelectHighlightColor = (color) => {
  lastHighlightColor.value = color;
  showHighlightPalette.value = false;
  props.editor.chain().focus().setHighlight({ color }).run();
};

const handleFilesClick = () => {
  // Implementation for attaching files
};

const handleScribbleClick = () => {
  emit('scribble');
};

const handleClickOutside = (event) => {
  if (showHighlightPalette.value && colorPickerRef.value && !colorPickerRef.value.contains(event.target)) {
    showHighlightPalette.value = false;
  }
};

onMounted(() => {
  document.addEventListener('mousedown', handleClickOutside);
  document.addEventListener('touchstart', handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', handleClickOutside);
  document.removeEventListener('touchstart', handleClickOutside);
});
</script> 
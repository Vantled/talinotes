<template>
  <div
    v-if="visible"
    :style="{ top: `${position.top}px`, left: `${position.left}px` }"
    class="absolute z-[3000] bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 flex items-center space-x-2 px-2 py-1 overflow-x-auto whitespace-nowrap max-w-[95vw]"
  >
    <!-- Bold, Italic, Underline -->
    <button @click="editor.chain().focus().toggleBold().run()" :class="buttonClass(editor.isActive('bold'))" aria-label="Bold" tabindex="0">
      <span class="font-bold">B</span>
    </button>
    <button @click="editor.chain().focus().toggleItalic().run()" :class="buttonClass(editor.isActive('italic'))" aria-label="Italic" tabindex="0">
      <span class="italic">I</span>
    </button>
    <button @click="editor.chain().focus().toggleUnderline().run()" :class="buttonClass(editor.isActive('underline'))" aria-label="Underline" tabindex="0">
      <span class="underline">U</span>
    </button>
    <!-- Alignments -->
    <button @click="editor.chain().focus().setTextAlign('left').run()" :class="buttonClass(editor.isActive({ textAlign: 'left' }))" aria-label="Align Left" tabindex="0">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h10M4 18h16" /></svg>
    </button>
    <button @click="editor.chain().focus().setTextAlign('center').run()" :class="buttonClass(editor.isActive({ textAlign: 'center' }))" aria-label="Align Center" tabindex="0">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 6h12M4 12h16M6 18h12" /></svg>
    </button>
    <button @click="editor.chain().focus().setTextAlign('right').run()" :class="buttonClass(editor.isActive({ textAlign: 'right' }))" aria-label="Align Right" tabindex="0">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M10 12h10M4 18h16" /></svg>
    </button>
    <!-- Lists -->
    <button @click="editor.chain().focus().toggleOrderedList().run()" :class="buttonClass(editor.isActive('orderedList'))" aria-label="Numbered List" tabindex="0">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 20h14M7 12h14M7 4h14M3 20h.01M3 12h.01M3 4h.01" /></svg>
    </button>
    <button @click="editor.chain().focus().toggleBulletList().run()" :class="buttonClass(editor.isActive('bulletList'))" aria-label="Bulleted List" tabindex="0">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="6" cy="6" r="2"/><circle cx="6" cy="12" r="2"/><circle cx="6" cy="18" r="2"/><line x1="10" y1="6" x2="20" y2="6" stroke="currentColor" stroke-width="2"/><line x1="10" y1="12" x2="20" y2="12" stroke="currentColor" stroke-width="2"/><line x1="10" y1="18" x2="20" y2="18" stroke="currentColor" stroke-width="2"/></svg>
    </button>
    <!-- Font Size Adjuster -->
    <span class="text-gray-400 ml-2">Aa</span>
    <button @click="decrementFontSize" class="w-8 h-8 flex items-center justify-center rounded bg-gray-100 border border-gray-300 text-gray-700 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label="Decrease font size" tabindex="0">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 15l6 6 6-6"/></svg>
    </button>
    <span class="w-10 text-center text-base font-semibold text-gray-900 select-none">{{ fontSize }}</span>
    <button @click="incrementFontSize" class="w-8 h-8 flex items-center justify-center rounded bg-gray-100 border border-gray-300 text-gray-700 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label="Increase font size" tabindex="0">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M18 9l-6-6-6 6"/></svg>
    </button>
    <span class="text-gray-400 text-base">Aa</span>
    <!-- Font Color Picker -->
    <div class="flex items-center space-x-1 ml-2">
      <button v-for="color in colors" :key="color" :style="{ backgroundColor: color }" class="w-5 h-5 rounded-full border-2 border-white dark:border-gray-700 focus:outline-none" @click="setColor(color)" :aria-label="`Set font color ${color}`" tabindex="0"></button>
    </div>
  </div>
</template>

<script setup>
import { Editor } from '@tiptap/vue-3';
import { ref, watch, onMounted } from 'vue';
const props = defineProps({
  editor: { type: Editor, required: true },
  position: { type: Object, default: () => ({ top: 0, left: 0 }) },
  visible: { type: Boolean, default: false }
});
const buttonClass = (active) =>
  `p-2 rounded focus:outline-none ${active ? 'bg-blue-600 text-white dark:bg-blue-600 dark:text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'}`;
const colors = [
  '#ef4444', '#f59e42', '#eab308', '#22c55e', '#3b82f6', '#a855f7', '#fff', '#000',
];
const fontSize = ref(16);

const getCurrentFontSize = () => {
  const { state } = props.editor;
  const { from, to } = state.selection;
  let found = null;
  state.doc.nodesBetween(from, to, node => {
    if (node.marks) {
      node.marks.forEach(mark => {
        if (mark.type.name === 'textStyle' && mark.attrs.fontSize) {
          found = parseInt(mark.attrs.fontSize, 10);
        }
      });
    }
  });
  return found || 16;
};

const updateFontSizeFromSelection = () => {
  fontSize.value = getCurrentFontSize();
};

onMounted(() => {
  updateFontSizeFromSelection();
  props.editor.on('selectionUpdate', updateFontSizeFromSelection);
});

watch(() => props.visible, (val) => {
  if (val) updateFontSizeFromSelection();
});

const applyFontSize = (size) => {
  if (props.editor.state.selection.empty) {
    props.editor.chain().focus().setStoredMarks([{ type: 'textStyle', attrs: { fontSize: `${size}px` } }]).run();
  } else {
    props.editor.chain().focus().setMark('textStyle', { fontSize: `${size}px` }).run();
  }
};
const incrementFontSize = () => {
  if (fontSize.value < 32) {
    fontSize.value++;
    applyFontSize(fontSize.value);
  }
};
const decrementFontSize = () => {
  if (fontSize.value > 12) {
    fontSize.value--;
    applyFontSize(fontSize.value);
  }
};
const handleFontSizeInput = (e) => {
  fontSize.value = e.target.value;
  applyFontSize(fontSize.value);
};
const setColor = (color) => {
  props.editor.chain().focus().setColor(color).run();
};
</script> 
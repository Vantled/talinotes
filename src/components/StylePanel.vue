<template>
  <div class="fixed inset-x-0 bottom-0 z-[2000] flex flex-col justify-end pointer-events-auto">
    <div ref="stylePanelRef" @mousedown.stop class="relative bg-[#181818] dark:bg-gray-900 rounded-t-2xl shadow-lg w-full max-w-xl mx-auto pb-8 pt-4 px-4 animate-slide-up pointer-events-auto">
      <div class="flex items-center justify-between mb-4">
        <span class="text-gray-300 font-semibold text-base tracking-widest">STYLE</span>
        <button @click="$emit('close')" aria-label="Close style panel" tabindex="0" class="text-gray-400 hover:text-gray-200 p-2 rounded-full">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <!-- Row 1: Bold, Italic, Underline, Alignments -->
      <div class="flex items-center space-x-6 mb-4">
        <button @click="editor.chain().toggleBold().run()" :class="buttonClass(editor.isActive('bold'))" aria-label="Bold" tabindex="0">
          <span class="text-xl font-bold">B</span>
        </button>
        <button @click="editor.chain().toggleItalic().run()" :class="buttonClass(editor.isActive('italic'))" aria-label="Italic" tabindex="0">
          <span class="text-xl italic">I</span>
        </button>
        <button @click="editor.chain().toggleUnderline().run()" :class="buttonClass(editor.isActive('underline'))" aria-label="Underline" tabindex="0">
          <span class="text-xl underline">U</span>
        </button>
        <button @click="editor.chain().setTextAlign('left').run()" :class="buttonClass(editor.isActive({ textAlign: 'left' }))" aria-label="Align Left" tabindex="0">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h10M4 18h16" /></svg>
        </button>
        <button @click="editor.chain().setTextAlign('center').run()" :class="buttonClass(editor.isActive({ textAlign: 'center' }))" aria-label="Align Center" tabindex="0">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 6h12M4 12h16M6 18h12" /></svg>
        </button>
        <button @click="editor.chain().setTextAlign('right').run()" :class="buttonClass(editor.isActive({ textAlign: 'right' }))" aria-label="Align Right" tabindex="0">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M10 12h10M4 18h16" /></svg>
        </button>
      </div>
      <!-- Row 2: Lists -->
      <div class="flex items-center space-x-6 mb-4">
        <button @click="editor.chain().toggleOrderedList().run()" :class="buttonClass(editor.isActive('orderedList'))" aria-label="Numbered List" tabindex="0">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 20h14M7 12h14M7 4h14M3 20h.01M3 12h.01M3 4h.01" /></svg>
        </button>
        <button @click="editor.chain().toggleBulletList().run()" :class="buttonClass(editor.isActive('bulletList'))" aria-label="Bulleted List" tabindex="0">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="6" cy="6" r="2"/><circle cx="6" cy="12" r="2"/><circle cx="6" cy="18" r="2"/><line x1="10" y1="6" x2="20" y2="6" stroke="currentColor" stroke-width="2"/><line x1="10" y1="12" x2="20" y2="12" stroke="currentColor" stroke-width="2"/><line x1="10" y1="18" x2="20" y2="18" stroke="currentColor" stroke-width="2"/></svg>
        </button>
      </div>
      <!-- Row 3: Font Size Adjuster -->
      <div class="flex items-center space-x-4 mb-4">
        <span class="text-gray-400">Aa</span>
        <button @mousedown.stop @click.stop="decrementFontSize" class="w-8 h-8 flex items-center justify-center rounded bg-[#232323] dark:bg-gray-800 border border-gray-700 text-gray-100 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label="Decrease font size" tabindex="0">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 15l6 6 6-6"/></svg>
        </button>
        <span class="w-10 text-center text-lg font-semibold text-gray-100 select-none">{{ fontSize }}</span>
        <button @mousedown.stop @click.stop="incrementFontSize" class="w-8 h-8 flex items-center justify-center rounded bg-[#232323] dark:bg-gray-800 border border-gray-700 text-gray-100 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label="Increase font size" tabindex="0">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M18 9l-6-6-6 6"/></svg>
        </button>
        <span class="text-gray-400 text-lg">Aa</span>
      </div>
      <!-- Row 4: Font Color Picker -->
      <div class="flex items-center space-x-3 mb-2">
        <button v-for="color in colors" :key="color" :style="{ backgroundColor: color }" class="w-6 h-6 rounded-full border-2 border-white dark:border-gray-700 focus:outline-none" @click="setColor(color)" :aria-label="`Set font color ${color}`" tabindex="0"></button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Editor } from '@tiptap/vue-3';
import { ref, onMounted, watch } from 'vue';

const props = defineProps({
  editor: {
    type: Editor,
    required: true
  }
});

const colors = [
  '#ef4444', // red
  '#f59e42', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#3b82f6', // blue
  '#a855f7', // purple
  '#fff',    // white
  '#000',    // black
];

const fontSize = ref(16);

const buttonClass = (active) =>
  `p-2 rounded-lg focus:outline-none ${active ? 'bg-blue-600 text-white' : 'bg-[#232323] text-gray-200 hover:bg-gray-700'}`;

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

const applyFontSize = (size) => {
  if (props.editor.state.selection.empty) {
    if (props.editor.isFocused) {
      props.editor.chain().focus().setStoredMarks([{ type: 'textStyle', attrs: { fontSize: `${size}px` } }]).run();
    } else {
      props.editor.chain().setStoredMarks([{ type: 'textStyle', attrs: { fontSize: `${size}px` } }]).run();
    }
  } else {
    if (props.editor.isFocused) {
      props.editor.chain().focus().setMark('textStyle', { fontSize: `${size}px` }).run();
    } else {
      props.editor.chain().setMark('textStyle', { fontSize: `${size}px` }).run();
    }
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

const setColor = (color) => {
  props.editor.chain().focus().setColor(color).run();
};
</script>

<style scoped>
@keyframes slide-up {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}
.animate-slide-up {
  animation: slide-up 0.2s cubic-bezier(0.4,0,0.2,1);
}
/**** Ensure inline font-size is respected ****/
.ProseMirror [style*="font-size"] {
  font-size: unset !important;
}
</style> 
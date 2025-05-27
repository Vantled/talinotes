<template>
  <div class="bg-white dark:bg-gray-900 w-full h-full min-h-screen flex flex-col">
    <!-- Header -->
    <div class="fixed top-16 left-0 right-0 z-30 bg-white dark:bg-gray-900 px-4 pb-2 flex items-center justify-between">
      <button @click="handleBack" class="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-blue-100 dark:hover:bg-blue-800 focus:outline-none" aria-label="Back and Save" tabindex="0">
        <svg class="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <div class="flex items-center space-x-2">
        <button
          v-if="isKeyboardOpen"
          @click="editor.chain().focus().undo().run()"
          class="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-800 focus:outline-none"
          :disabled="!editor.can().undo()"
          :class="{ 'opacity-50 cursor-not-allowed': !editor.can().undo() }"
          aria-label="Undo"
          tabindex="0"
        >
          <svg class="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
        </button>
        <button
          v-if="isKeyboardOpen"
          @click="editor.chain().focus().redo().run()"
          class="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-800 focus:outline-none"
          :disabled="!editor.can().redo()"
          :class="{ 'opacity-50 cursor-not-allowed': !editor.can().redo() }"
          aria-label="Redo"
          tabindex="0"
        >
          <svg class="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 10H11a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
          </svg>
        </button>
        <button
          @click="handleSubmit"
          class="flex items-center space-x-2 bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-800 text-white font-semibold px-4 py-2 rounded-lg shadow transition disabled:opacity-50"
          aria-label="Save Note"
          tabindex="0"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7" />
          </svg>
          <span>Save to</span>
        </button>
      </div>
    </div>
    <!-- Folder Select Modal -->
    <teleport to="body">
      <div v-if="showFolderSelect" class="fixed inset-0 z-[2000] flex items-center justify-center bg-black bg-opacity-40">
        <div class="bg-white rounded-xl shadow-lg p-6 w-80 max-w-full">
          <h2 class="text-lg font-semibold mb-4 text-gray-900">Select Folder</h2>
          <div class="space-y-2 mb-4">
            <label v-for="folder in noteStore.folders" :key="folder.id" class="flex items-center gap-2 cursor-pointer">
              <input type="radio" :value="folder.id" v-model="selectedFolderId" />
              <span class="text-gray-900">{{ folder.name }}</span>
            </label>
          </div>
          <div class="flex justify-end gap-2">
            <button @click="showFolderSelect = false" class="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600">Cancel</button>
            <button @click="handleFolderSave" class="px-4 py-2 rounded bg-blue-600 dark:bg-blue-700 text-white hover:bg-blue-700 dark:hover:bg-blue-800 font-semibold">Save</button>
          </div>
        </div>
      </div>
    </teleport>
    <!-- Tiptap Editor Area -->
    <div class="fixed left-0 right-0 px-4 overflow-auto" style="top: 80px; bottom: 80px;">
      <input
        v-model="note.title"
        type="text"
        class="w-full text-2xl font-bold text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-900 px-0 py-2 mb-2 focus:outline-none placeholder-gray-400 dark:placeholder-gray-500 pt-10"
        placeholder="Note Title"
        autocomplete="off"
        @focus="handleTitleFocus"
        @blur="handleTitleBlur"
      />
      <EditorContent
        :editor="editor"
        :style="{ fontSize: editorFontSize + 'px', lineHeight: 1.75 }"
        :class="['w-full h-full min-h-[220px] cursor-text select-none text-gray-900 dark:text-gray-100 px-0 py-3 outline-none max-w-none focus:outline-none', editorSelectionClass]"
        tabindex="0"
        role="textbox"
        aria-label="Note content editor"
      />
    </div>
    <!-- Formatting Toolbar -->
    <div class="fixed left-0 right-0 bottom-0 z-30 bg-white dark:bg-gray-900 pb-8" style="padding-bottom: env(safe-area-inset-bottom, 2rem);">
      <FormattingToolbar :editor="editor" :is-keyboard-open="isKeyboardOpen" :disabled="isTitleFocused" @style="handleStyle" />
    </div>
    <StylePanel v-if="showStylePanel" ref="stylePanelRef" :editor="editor" @close="showStylePanel = false" />
    <FloatingToolbar
      ref="floatingToolbarRef"
      :editor="editor"
      :position="floatingToolbarPosition"
      :visible="showFloatingToolbar"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, computed, nextTick } from 'vue';
import { Editor, EditorContent } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Heading from '@tiptap/extension-heading';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Highlight from '@tiptap/extension-highlight';
import { useNoteStore } from '../stores/noteStore';
import FormattingToolbar from './FormattingToolbar.vue';
import StylePanel from './StylePanel.vue';
import FloatingToolbar from './FloatingToolbar.vue';

const noteStore = useNoteStore();

const props = defineProps({
  note: {
    type: Object,
    default: null
  },
  isKeyboardOpen: {
    type: Boolean,
    default: false
  }
});

const note = ref({
  title: '',
  category: '',
  content: ''
});
const selectedFolderId = ref('default');
const showFolderSelect = ref(false);
const showStylePanel = ref(false);
const isTitleFocused = ref(false);
const showFloatingToolbar = ref(false);
const floatingToolbarPosition = ref({ top: 0, left: 0 });
const floatingToolbarRef = ref(null);
const editorFontSize = ref(19); // fallback default
const selectionFontSize = ref(16);
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
const stylePanelRef = ref(null);
const folderSelectSource = ref('save'); // 'save' or 'back'

const emit = defineEmits(['cancel', 'saved']);

// Custom TextStyle extension to support fontSize
const CustomTextStyle = TextStyle.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      fontSize: {
        default: null,
        parseHTML: element => element.style.fontSize || null,
        renderHTML: attributes => {
          if (!attributes.fontSize) return {};
          return { style: `font-size: ${attributes.fontSize}` };
        },
      },
    };
  },
});

const editor = new Editor({
  extensions: [
    StarterKit.configure({
      heading: {
        levels: [1, 2, 3, 4, 5, 6],
        HTMLAttributes: {},
        allowMarks: ['textStyle', 'color', 'underline', 'bold', 'italic'],
      },
      bulletList: {
        HTMLAttributes: {
          class: 'list-disc pl-4',
        },
      },
      orderedList: {
        HTMLAttributes: {
          class: 'list-decimal pl-4',
        },
      },
    }),
    TextAlign.configure({
      types: ['heading', 'paragraph'],
    }),
    Underline,
    CustomTextStyle,
    Color,
    TaskList.configure({
      HTMLAttributes: {
        class: 'task-list pl-4',
      },
      onBeforeCreate: () => {
        console.log('Creating new task list...');
      },
      onUpdate: () => {
        console.log('Task list updated');
      },
    }),
    TaskItem.configure({
      HTMLAttributes: {
        class: 'task-item',
      },
      nested: true,
      onBeforeCreate: () => {
        console.log('Creating new task item...');
      },
      onUpdate: () => {
        console.log('Task item updated');
      },
    }),
    Highlight.configure({
      multicolor: true,
      HTMLAttributes: {
        class: '',
      },
    }),
  ],
  content: '',
  onUpdate: ({ editor }) => {
    try {
      console.log('Editor content updating...');
      const content = editor.getHTML();
      console.log('New content:', content);
      note.value.content = content;
    } catch (error) {
      console.error('Error updating editor content:', error);
    }
  },
  onCreate: () => {
    console.log('Editor created successfully');
    console.log('Available commands:', {
      canToggleTaskList: editor.can().toggleTaskList(),
      extensions: editor.extensionManager.extensions.map(ext => ext.name)
    });
  },
  onTransaction: ({ transaction }) => {
    console.log('Editor transaction:', {
      docChanged: transaction.docChanged,
      steps: transaction.steps,
      time: transaction.time
    });
  },
});

// Helper to check if content is truly empty (ignores <p></p>, whitespace, etc)
const isContentEmpty = (html) => {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return !tmp.textContent.trim();
};

const shouldDiscardNote = () => {
  return !note.value.title.trim() && isContentEmpty(note.value.content);
};

const handleSubmit = () => {
  note.value.content = editor.getHTML();
  folderSelectSource.value = 'save';
  showFolderSelect.value = true;
  if (note.value.folderId) {
    selectedFolderId.value = note.value.folderId;
  } else {
    selectedFolderId.value = 'default';
  }
};

const handleFolderSave = async () => {
  showFolderSelect.value = false;
  note.value.content = editor.getHTML();
  if (shouldDiscardNote()) {
    if (note.value.id) {
      await noteStore.deleteNote(note.value.id);
    }
    emit('cancel');
    return;
  }
  if (note.value.id) {
    await noteStore.updateNote(note.value);
    noteStore.moveNoteToFolder(note.value.id, selectedFolderId.value);
  } else {
    const newNote = await noteStore.addNote(note.value, selectedFolderId.value);
    note.value = { ...newNote };
  }
  emit('saved', note.value);
};

const handleBack = async () => {
  note.value.content = editor.getHTML();
  if (shouldDiscardNote()) {
    if (note.value.id) {
      await noteStore.deleteNote(note.value.id);
    }
    emit('cancel');
    return;
  }
  if (note.value.id) {
    await noteStore.updateNote(note.value);
    noteStore.moveNoteToFolder(note.value.id, note.value.folderId || 'default');
  } else {
    const newNote = await noteStore.addNote(note.value, 'default');
    note.value = { ...newNote };
  }
  emit('saved', note.value);
};

const handleStyle = () => {
  showStylePanel.value = true;
  showFloatingToolbar.value = false;
  if (window?.Keyboard?.hide) {
    window.Keyboard.hide();
  }
};

const handleTitleFocus = () => {
  showStylePanel.value = false;
  isTitleFocused.value = true;
};

const handleTitleBlur = () => {
  isTitleFocused.value = false;
};

const editorSelectionClass = computed(() => showStylePanel.value ? 'custom-selection' : '');

const updateFloatingToolbar = async () => {
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
    showFloatingToolbar.value = false;
    return;
  }
  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();
  const toolbarHeight = 40;
  showFloatingToolbar.value = true;
  showStylePanel.value = false;
  await nextTick();
  let toolbarWidth = 240;
  if (floatingToolbarRef.value) {
    toolbarWidth = floatingToolbarRef.value.offsetWidth;
  }
  const left = Math.max(8, Math.min((window.innerWidth - toolbarWidth) / 2, window.innerWidth - toolbarWidth - 8));
  floatingToolbarPosition.value = {
    top: rect.top + window.scrollY - toolbarHeight - 8,
    left,
  };
};

const handleResize = () => {
  if (showFloatingToolbar.value) {
    updateFloatingToolbar();
  }
};

// Add debug logging for editor state changes
editor.on('focus', () => {
  console.log('Editor focused');
  showStylePanel.value = false;
});

editor.on('blur', () => {
  console.log('Editor blurred');
});

editor.on('selectionUpdate', () => {
  console.log('Selection updated:', {
    from: editor.state.selection.from,
    to: editor.state.selection.to,
    empty: editor.state.selection.empty
  });
});

const incrementEditorFontSize = () => {
  if (editorFontSize.value < 32) editorFontSize.value++;
};
const decrementEditorFontSize = () => {
  if (editorFontSize.value > 12) editorFontSize.value--;
};

// --- Per-selection font size logic ---
const getCurrentFontSize = () => {
  const { state } = editor;
  const { from, to } = state.selection;
  let found = null;
  state.doc.nodesBetween(from, to, node => {
    if (node.marks) {
      node.marks.forEach(mark => {
        if (mark.type.name === 'textStyle' && mark.attrs.fontSize) {
          const px = parseInt(mark.attrs.fontSize, 10);
          if (!isNaN(px)) found = px;
        }
      });
    }
  });
  return found || editorFontSize.value;
};
const updateSelectionFontSize = () => {
  selectionFontSize.value = getCurrentFontSize();
};
const applySelectionFontSize = (size) => {
  if (editor.state.selection.empty) {
    editor.chain().focus().setStoredMarks([{ type: 'textStyle', attrs: { fontSize: `${size}px` } }]).run();
  } else {
    editor.chain().focus().setMark('textStyle', { fontSize: `${size}px` }).run();
  }
};
const incrementSelectionFontSize = () => {
  if (selectionFontSize.value < 32) {
    selectionFontSize.value++;
    applySelectionFontSize(selectionFontSize.value);
  }
};
const decrementSelectionFontSize = () => {
  if (selectionFontSize.value > 12) {
    selectionFontSize.value--;
    applySelectionFontSize(selectionFontSize.value);
  }
};
const handleSelectionFontSizeInput = () => {
  if (selectionFontSize.value < 12) selectionFontSize.value = 12;
  if (selectionFontSize.value > 32) selectionFontSize.value = 32;
  applySelectionFontSize(selectionFontSize.value);
};

// Sync per-selection font size on selection change
editor.on('selectionUpdate', updateSelectionFontSize);

onMounted(async () => {
  await nextTick();
  const proseMirrorEl = document.querySelector('.ProseMirror');
  if (proseMirrorEl) {
    const computedFontSize = window.getComputedStyle(proseMirrorEl).fontSize;
    if (computedFontSize) {
      editorFontSize.value = parseInt(computedFontSize, 10);
    }
  }
  // Ensure folders are loaded before anything else
  if (!noteStore.folders.length) {
    await noteStore.loadFolders();
  }
  // If editing, initialize note and editor content
  if (props.note) {
    note.value = { ...props.note };
    editor.commands.setContent(props.note.content || '');
  }
  setTimeout(() => {
    editor.commands.focus('start');
    // Ensure left alignment
    editor.chain().setTextAlign('left').run();
  }, 0);

  document.addEventListener('selectionchange', updateFloatingToolbar);
  window.addEventListener('resize', handleResize);
  document.addEventListener('mousedown', handleClickOutsideStylePanel);
});

onBeforeUnmount(() => {
  editor.destroy();
  document.removeEventListener('selectionchange', updateFloatingToolbar);
  window.removeEventListener('resize', handleResize);
  document.removeEventListener('mousedown', handleClickOutsideStylePanel);
});

const handleClickOutsideStylePanel = (event) => {
  if (!showStylePanel.value) return;
  const panel = stylePanelRef.value;
  if (panel && !panel.contains(event.target)) {
    showStylePanel.value = false;
  }
};
</script>

<style>
.prose {
  max-width: 100%;
}

/* Remove focus outline from editor */
.ProseMirror:focus {
  outline: none !important;
}

/* Remove fixed font size - it's now controlled by the EditorContent style binding */
.ProseMirror {
  line-height: 1.75;
}

.custom-selection ::selection {
  background: #fde047 !important; /* yellow-200 */
  color: #18181b !important;
}

.dark .custom-selection ::selection {
  background: #fbbf24 !important; /* yellow-400 */
  color: #0f172a !important;
}

/* Remove the nuclear font-size override since we want to allow font size changes */
/* .ProseMirror span[style*="font-size"],
.ProseMirror [style*="font-size"],
.ProseMirror *[style*="font-size"] {
  font-size: revert !important;
} */

/* Task List Styles */
.task-list {
  list-style: none;
  padding-left: 0;
  margin: 0;
}

.task-item {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  margin: 0.25rem 0;
  padding: 0;
}

.task-item input[type="checkbox"] {
  margin: 0.25rem 0 0 0;
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 0.25rem;
  border: 2px solid #d1d5db;
  appearance: none;
  -webkit-appearance: none;
  cursor: pointer;
  position: relative;
  flex-shrink: 0;
  background-color: white;
  display: inline-block;
  vertical-align: middle;
}

.task-item input[type="checkbox"]:checked {
  background-color: #3b82f6;
  border-color: #3b82f6;
}

.task-item input[type="checkbox"]:checked::after {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background-repeat: no-repeat;
  background-position: center;
  background-size: 1rem 1rem;
  background-image: url('data:image/svg+xml;utf8,<svg viewBox="0 0 16 16" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><polyline points="4 8.5 7 11.5 12 5.5"/></svg>');
  pointer-events: none;
}

.task-item input[type="checkbox"]:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

.task-item > div {
  flex: 1;
  min-width: 0;
}

/* Ensure proper spacing in nested lists */
.task-list .task-list {
  margin-left: 1.5rem;
}

/* Remove the iOS test transform since we want to allow font size changes */
/* .ProseMirror span[style*="font-size"] {
  transform: scale(2) !important;
  color: red !important;
} */

.dark .task-item input[type="checkbox"] {
  background-color: #1e293b;
  border-color: #334155;
}

.dark .task-item input[type="checkbox"]:checked {
  background-color: #2563eb;
  border-color: #2563eb;
}
</style> 
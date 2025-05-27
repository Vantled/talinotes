<template>
  <transition name="toast-slide-down">
    <div
      v-if="visible"
      class="fixed left-0 right-0 z-[99999] flex justify-center"
      :style="{ top: 'env(safe-area-inset-top, 0px)' }"
    >
      <div
        class="mt-4 px-4 py-3 rounded-xl shadow-lg border text-center font-semibold text-sm max-w-xs w-full bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
        :class="toastTypeClass"
        role="status"
        aria-live="polite"
      >
        {{ message }}
      </div>
    </div>
  </transition>
</template>

<script setup>
import { computed } from 'vue';
const props = defineProps({
  visible: Boolean,
  message: String,
  type: {
    type: String,
    default: 'success',
  },
});
const toastTypeClass = computed(() => {
  switch (props.type) {
    case 'error':
      return 'text-red-700 dark:text-red-400 border-red-200 dark:border-red-500';
    case 'info':
      return 'text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-500';
    default:
      return 'text-green-700 dark:text-green-400 border-green-200 dark:border-green-500';
  }
});
</script>

<style scoped>
.toast-slide-down-enter-active {
  transition: all 0.35s cubic-bezier(.4,0,.2,1);
}
.toast-slide-down-leave-active {
  transition: all 0.25s cubic-bezier(.4,0,.2,1);
}
.toast-slide-down-enter-from {
  opacity: 0;
  transform: translateY(-60px);
}
.toast-slide-down-leave-to {
  opacity: 0;
  transform: translateY(-60px);
}
</style> 
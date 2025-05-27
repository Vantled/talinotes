import { Haptics } from '@capacitor/haptics';

export const hapticsService = {
  async light() {
    try {
      await Haptics.impact({ style: 'light' });
    } catch (error) {
      console.warn('Haptics not available:', error);
    }
  },

  async medium() {
    try {
      await Haptics.impact({ style: 'medium' });
    } catch (error) {
      console.warn('Haptics not available:', error);
    }
  },

  async heavy() {
    try {
      await Haptics.impact({ style: 'heavy' });
    } catch (error) {
      console.warn('Haptics not available:', error);
    }
  },

  async success() {
    try {
      await Haptics.notification({ type: 'success' });
    } catch (error) {
      console.warn('Haptics not available:', error);
    }
  },

  async warning() {
    try {
      await Haptics.notification({ type: 'warning' });
    } catch (error) {
      console.warn('Haptics not available:', error);
    }
  },

  async error() {
    try {
      await Haptics.notification({ type: 'error' });
    } catch (error) {
      console.warn('Haptics not available:', error);
    }
  }
}; 
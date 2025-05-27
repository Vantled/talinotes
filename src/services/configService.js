import { Preferences } from '@capacitor/preferences';

const DEFAULT_CONFIG = {
  BACKEND_URL: 'http://192.168.1.72:3000',
  PYTHON_SERVICE_URL: 'http://192.168.1.72:5001',
  LM_STUDIO_URL: 'http://192.168.1.72:1234'
};

const CONFIG_STORAGE_KEY = 'app_config';
const PROFILES_STORAGE_KEY = 'app_config_profiles';
const ACTIVE_PROFILE_KEY = 'active_profile';

export const configService = {
  async getConfig() {
    try {
      // First try to get the active profile
      const activeProfile = await this.getActiveProfile();
      console.log('Active profile on load:', activeProfile);
      
      if (activeProfile) {
        const profiles = await this.getProfiles();
        console.log('Available profiles:', Object.keys(profiles));
        
        if (profiles[activeProfile]) {
          console.log('Loading config from active profile:', activeProfile);
          return profiles[activeProfile];
        } else {
          console.warn('Active profile not found in profiles, clearing active profile');
          await Preferences.remove({ key: ACTIVE_PROFILE_KEY });
        }
      }

      // If no active profile or profile not found, try stored config
      const storedConfig = await Preferences.get({ key: CONFIG_STORAGE_KEY });
      if (storedConfig.value) {
        const parsedConfig = JSON.parse(storedConfig.value);
        console.log('Retrieved stored config:', parsedConfig);
        return parsedConfig;
      }

      console.log('No stored config found, using defaults:', DEFAULT_CONFIG);
      return DEFAULT_CONFIG;
    } catch (error) {
      console.error('Error loading config:', error);
      console.log('Falling back to default config:', DEFAULT_CONFIG);
      return DEFAULT_CONFIG;
    }
  },

  async updateConfig(newConfig) {
    try {
      // Validate the new config
      if (!newConfig || typeof newConfig !== 'object') {
        throw new Error('Invalid config object provided');
      }

      // Ensure all required URLs are present
      const requiredUrls = ['BACKEND_URL', 'PYTHON_SERVICE_URL', 'LM_STUDIO_URL'];
      for (const url of requiredUrls) {
        if (!newConfig[url]) {
          throw new Error(`Missing required URL: ${url}`);
        }
      }

      console.log('Saving new config:', newConfig);
      await Preferences.set({
        key: CONFIG_STORAGE_KEY,
        value: JSON.stringify(newConfig)
      });
      console.log('Config saved successfully');
      return true;
    } catch (error) {
      console.error('Error saving config:', error);
      throw error;
    }
  },

  async resetConfig() {
    try {
      console.log('Resetting config to defaults');
      await Preferences.remove({ key: CONFIG_STORAGE_KEY });
      await Preferences.remove({ key: ACTIVE_PROFILE_KEY });
      console.log('Config reset complete');
      return true;
    } catch (error) {
      console.error('Error resetting config:', error);
      throw error;
    }
  },

  // Profile management
  async getProfiles() {
    try {
      const storedProfiles = await Preferences.get({ key: PROFILES_STORAGE_KEY });
      if (storedProfiles.value) {
        return JSON.parse(storedProfiles.value);
      }
      return {};
    } catch (error) {
      console.error('Error loading profiles:', error);
      return {};
    }
  },

  async saveProfile(name, config) {
    try {
      const profiles = await this.getProfiles();
      profiles[name] = config;
      await Preferences.set({
        key: PROFILES_STORAGE_KEY,
        value: JSON.stringify(profiles)
      });
      console.log('Profile saved:', name);
      return true;
    } catch (error) {
      console.error('Error saving profile:', error);
      throw error;
    }
  },

  async deleteProfile(name) {
    try {
      const profiles = await this.getProfiles();
      const activeProfile = await this.getActiveProfile();
      
      // If deleting the active profile, clear the active profile
      if (activeProfile === name) {
        await Preferences.remove({ key: ACTIVE_PROFILE_KEY });
      }
      
      delete profiles[name];
      await Preferences.set({
        key: PROFILES_STORAGE_KEY,
        value: JSON.stringify(profiles)
      });
      console.log('Profile deleted:', name);
      return true;
    } catch (error) {
      console.error('Error deleting profile:', error);
      throw error;
    }
  },

  async getActiveProfile() {
    try {
      const activeProfile = await Preferences.get({ key: ACTIVE_PROFILE_KEY });
      return activeProfile.value || null;
    } catch (error) {
      console.error('Error getting active profile:', error);
      return null;
    }
  },

  async setActiveProfile(name) {
    try {
      const profiles = await this.getProfiles();
      if (!profiles[name]) {
        throw new Error('Profile not found');
      }
      
      // First set the active profile name
      await Preferences.set({
        key: ACTIVE_PROFILE_KEY,
        value: name
      });
      
      // Then update the current config with the profile's values
      await this.updateConfig(profiles[name]);
      
      console.log('Active profile set to:', name);
      return true;
    } catch (error) {
      console.error('Error setting active profile:', error);
      throw error;
    }
  }
}; 
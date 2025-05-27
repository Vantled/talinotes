import { configService } from './services/configService';

// Create a reactive config object
export const config = {
  // Replace this with your computer's IP address
  BACKEND_URL: 'http://192.168.1.72:3000',
  PYTHON_SERVICE_URL: 'http://192.168.1.72:5001',
  LM_STUDIO_URL: 'http://192.168.1.72:1234'
};

// Validate URL format
const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Initialize config from storage
export const initializeConfig = async () => {
  try {
    const storedConfig = await configService.getConfig();
    console.log('Initializing config with stored values:', storedConfig);
    Object.assign(config, storedConfig);
    console.log('Config initialized:', config);
  } catch (error) {
    console.error('Error initializing config:', error);
  }
};

// Update config
export const updateConfig = async (newConfig) => {
  try {
    // Validate URLs
    const urls = ['BACKEND_URL', 'PYTHON_SERVICE_URL', 'LM_STUDIO_URL'];
    for (const url of urls) {
      if (newConfig[url] && !isValidUrl(newConfig[url])) {
        throw new Error(`Invalid URL format for ${url}: ${newConfig[url]}`);
      }
    }

    console.log('Updating config with new values:', newConfig);
    await configService.updateConfig(newConfig);
    Object.assign(config, newConfig);
    console.log('Config updated successfully:', config);
  } catch (error) {
    console.error('Error updating config:', error);
    throw error;
  }
};

// Reset config to defaults
export const resetConfig = async () => {
  try {
    console.log('Resetting config to defaults');
    await configService.resetConfig();
    const defaultConfig = await configService.getConfig();
    Object.assign(config, defaultConfig);
    console.log('Config reset to defaults:', config);
  } catch (error) {
    console.error('Error resetting config:', error);
    throw error;
  }
}; 
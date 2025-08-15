export class Settings {
  constructor() {
    this.defaults = {
      autoScan: true,
      soundFeedback: true,
      vibration: true,
      darkMode: true,
      showInstructions: true,
      scanCooldown: 2000,
      cacheTimeout: 300000,
      apiBaseUrl: 'https://api.bilten.com'
    };
    
    this.storageKey = 'bilten_scanner_settings';
  }

  async load() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const settings = JSON.parse(stored);
        // Merge with defaults to ensure all settings exist
        this.settings = { ...this.defaults, ...settings };
      } else {
        this.settings = { ...this.defaults };
        await this.save();
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      this.settings = { ...this.defaults };
    }
  }

  async save() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.settings));
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }

  get(key) {
    return this.settings[key];
  }

  set(key, value) {
    this.settings[key] = value;
    this.save();
  }

  reset() {
    this.settings = { ...this.defaults };
    this.save();
  }

  getAll() {
    return { ...this.settings };
  }
}

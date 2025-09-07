// Persistent storage service using AsyncStorage
import AsyncStorage from '@react-native-async-storage/async-storage';

interface StorageData {
  settings: Record<string, any>;
  galleryItems: Array<{
    id: string;
    uri: string;
    type: 'user' | 'outfit' | 'result';
    timestamp: number;
  }>;
  userProfile: {
    name: string;
    email: string;
    profileImage?: string;
  } | null;
}

class StorageService {
  private data: StorageData = {
    settings: {},
    galleryItems: [],
    userProfile: null,
  };
  
  private initialized = false;
  private readonly STORAGE_KEYS = {
    SETTINGS: '@fitmirror:settings',
    GALLERY: '@fitmirror:gallery',
    PROFILE: '@fitmirror:profile',
  };

  async initialize(): Promise<void> {
    try {
      // Load existing data from AsyncStorage
      await this.loadFromStorage();
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize storage:', error);
      this.initialized = true; // Continue with empty data
    }
  }

  private async loadFromStorage(): Promise<void> {
    try {
      const [settingsJson, galleryJson, profileJson] = await Promise.all([
        AsyncStorage.getItem(this.STORAGE_KEYS.SETTINGS),
        AsyncStorage.getItem(this.STORAGE_KEYS.GALLERY),
        AsyncStorage.getItem(this.STORAGE_KEYS.PROFILE),
      ]);

      if (settingsJson) {
        this.data.settings = JSON.parse(settingsJson);
      }
      if (galleryJson) {
        this.data.galleryItems = JSON.parse(galleryJson);
      }
      if (profileJson) {
        this.data.userProfile = JSON.parse(profileJson);
      }
    } catch (error) {
      console.error('Failed to load data from storage:', error);
    }
  }

  private async saveSettings(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEYS.SETTINGS, JSON.stringify(this.data.settings));
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }

  private async saveGallery(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEYS.GALLERY, JSON.stringify(this.data.galleryItems));
    } catch (error) {
      console.error('Failed to save gallery:', error);
    }
  }

  private async saveProfile(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEYS.PROFILE, JSON.stringify(this.data.userProfile));
    } catch (error) {
      console.error('Failed to save profile:', error);
    }
  }

  // Settings operations
  async setSetting(key: string, value: any): Promise<void> {
    this.data.settings[key] = value;
    await this.saveSettings();
  }

  async getSetting(key: string): Promise<any> {
    return this.data.settings[key] || null;
  }

  async deleteSetting(key: string): Promise<void> {
    delete this.data.settings[key];
    await this.saveSettings();
  }

  async getAllSettings(): Promise<Record<string, any>> {
    return { ...this.data.settings };
  }

  // Gallery operations
  async saveGalleryItem(uri: string, type: 'user' | 'outfit' | 'result'): Promise<string> {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    this.data.galleryItems.push({
      id,
      uri,
      type,
      timestamp: Date.now(),
    });
    await this.saveGallery();
    return id;
  }

  async getGalleryItems(type?: 'user' | 'outfit' | 'result'): Promise<Array<{
    id: string;
    uri: string;
    type: 'user' | 'outfit' | 'result';
    timestamp: number;
  }>> {
    if (type) {
      return this.data.galleryItems.filter(item => item.type === type);
    }
    return [...this.data.galleryItems];
  }

  async deleteGalleryItem(id: string | number): Promise<void> {
    const itemId = typeof id === 'string' ? id : id.toString();
    this.data.galleryItems = this.data.galleryItems.filter(item => item.id !== itemId);
    await this.saveGallery();
  }

  // User profile operations
  async setUserProfile(profile: { name: string; email: string; profileImage?: string }): Promise<void> {
    this.data.userProfile = profile;
    await this.saveProfile();
  }

  async getUserProfile(): Promise<{ name: string; email: string; profileImage?: string } | null> {
    return this.data.userProfile;
  }

  // Utility operations
  async clearCache(): Promise<void> {
    this.data.galleryItems = this.data.galleryItems.filter(item => item.type !== 'result');
    await this.saveGallery();
  }

  async clearMockData(): Promise<void> {
    // Remove any items with mock IDs or Unsplash URLs
    this.data.galleryItems = this.data.galleryItems.filter(item => 
      !item.id.startsWith('mock-') && 
      !item.uri.includes('unsplash.com')
    );
    await this.saveGallery();
  }

  async clearAllData(): Promise<void> {
    this.data = {
      settings: {},
      galleryItems: [],
      userProfile: null,
    };
    // Clear all AsyncStorage keys
    try {
      await Promise.all([
        AsyncStorage.removeItem(this.STORAGE_KEYS.SETTINGS),
        AsyncStorage.removeItem(this.STORAGE_KEYS.GALLERY),
        AsyncStorage.removeItem(this.STORAGE_KEYS.PROFILE),
      ]);
    } catch (error) {
      console.error('Failed to clear AsyncStorage:', error);
    }
  }

  async getStats(): Promise<{
    settingsCount: number;
    galleryItemsCount: number;
    hasProfile: boolean;
  }> {
    return {
      settingsCount: Object.keys(this.data.settings).length,
      galleryItemsCount: this.data.galleryItems.length,
      hasProfile: this.data.userProfile !== null,
    };
  }
}

// Create singleton instance
export const storageService = new StorageService();

// Initialize on import
storageService.initialize();

// Convenience functions
export const setSetting = (key: string, value: any) => storageService.setSetting(key, value);
export const getSetting = (key: string) => storageService.getSetting(key);
export const deleteSetting = (key: string) => storageService.deleteSetting(key);

export const saveToGallery = (uri: string, type: 'user' | 'outfit' | 'result') => 
  storageService.saveGalleryItem(uri, type);

export const getGalleryItems = (type?: 'user' | 'outfit' | 'result') => 
  storageService.getGalleryItems(type);

export const clearCache = () => storageService.clearCache();
export const clearMockData = () => storageService.clearMockData();
export const clearAllData = () => storageService.clearAllData();

// Profile convenience functions
export const saveUserProfile = (profile: { name: string; email: string; profileImage?: string }) => 
  storageService.setUserProfile(profile);

export const getUserProfile = () => storageService.getUserProfile();

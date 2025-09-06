// Simple storage service with mock implementation for demo
// In production: Replace with actual SQLite or AsyncStorage

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

  async initialize(): Promise<void> {
    // Mock initialization - in production this would open SQLite database
    this.initialized = true;
  }

  // Settings operations
  async setSetting(key: string, value: any): Promise<void> {
    this.data.settings[key] = value;
  }

  async getSetting(key: string): Promise<any> {
    return this.data.settings[key] || null;
  }

  async deleteSetting(key: string): Promise<void> {
    delete this.data.settings[key];
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
  }

  // User profile operations
  async setUserProfile(profile: { name: string; email: string; profileImage?: string }): Promise<void> {
    this.data.userProfile = profile;
  }

  async getUserProfile(): Promise<{ name: string; email: string; profileImage?: string } | null> {
    return this.data.userProfile;
  }

  // Utility operations
  async clearCache(): Promise<void> {
    this.data.galleryItems = this.data.galleryItems.filter(item => item.type !== 'result');
  }

  async clearMockData(): Promise<void> {
    // Remove any items with mock IDs or Unsplash URLs
    this.data.galleryItems = this.data.galleryItems.filter(item => 
      !item.id.startsWith('mock-') && 
      !item.uri.includes('unsplash.com')
    );
  }

  async clearAllData(): Promise<void> {
    this.data = {
      settings: {},
      galleryItems: [],
      userProfile: null,
    };
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

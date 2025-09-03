import * as FileSystem from 'expo-file-system';
import { Image } from 'expo-image';

export interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png';
}

export class ImageUtils {
  /**
   * Optimize image for API upload and processing
   * Note: Basic validation since expo-image-manipulator is not installed
   */
  static async optimizeImage(
    imageUri: string,
    options: ImageOptimizationOptions = {}
  ): Promise<string> {
    try {
      // For now, return the original URI since we don't have image manipulation
      // In production, you would install expo-image-manipulator for actual optimization
      const validation = await this.validateImage(imageUri);
      
      if (!validation.isValid) {
        throw new Error(validation.error || 'Image validation failed');
      }

      return imageUri;
    } catch (error) {
      throw new Error('Failed to optimize image');
    }
  }

  /**
   * Validate image file and format
   */
  static async validateImage(imageUri: string): Promise<{
    isValid: boolean;
    error?: string;
    fileSize?: number;
    dimensions?: { width: number; height: number };
  }> {
    try {
      // Check if file exists
      const fileInfo = await FileSystem.getInfoAsync(imageUri);
      if (!fileInfo.exists) {
        return {
          isValid: false,
          error: 'Image file does not exist',
        };
      }

      // Check file size (max 20MB)
      const maxSize = 20 * 1024 * 1024; // 20MB
      if (fileInfo.size && fileInfo.size > maxSize) {
        return {
          isValid: false,
          error: 'Image file is too large (max 20MB)',
          fileSize: fileInfo.size,
        };
      }

      // Basic validation without image manipulation library
      // In production, you would use expo-image-manipulator to get actual dimensions
      return {
        isValid: true,
        fileSize: fileInfo.size,
        dimensions: { width: 1024, height: 1024 }, // Mock dimensions
      };
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Unknown validation error',
      };
    }
  }

  /**
   * Create thumbnail from image
   * Note: Returns original image since expo-image-manipulator is not installed
   */
  static async createThumbnail(
    imageUri: string,
    size: number = 150
  ): Promise<string> {
    try {
      // In production, install expo-image-manipulator for actual thumbnail creation
      return imageUri;
    } catch (error) {
      throw new Error('Failed to create thumbnail');
    }
  }

  /**
   * Save image to device storage
   */
  static async saveToDevice(
    imageUri: string,
    filename?: string
  ): Promise<string> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const finalFilename = filename || `tryon_${timestamp}.jpg`;
      const destinationUri = `${FileSystem.documentDirectory}${finalFilename}`;

      await FileSystem.copyAsync({
        from: imageUri,
        to: destinationUri,
      });

      return destinationUri;
    } catch (error) {
      throw new Error('Failed to save image to device');
    }
  }
}

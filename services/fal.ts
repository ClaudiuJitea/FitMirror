import * as FileSystem from 'expo-file-system';
import { storageService } from './storage';
import { fal } from '@fal-ai/client';

export interface FalStyleMeRequest {
  userImageUri: string;
  clothingImageUri: string;
  clothingType?: 'top' | 'bottom' | 'dress' | 'outerwear' | 'shoes' | 'accessories';
  style?: 'casual' | 'formal' | 'sporty' | 'elegant';
}

export interface FalStyleMeResponse {
  success: boolean;
  imageUrl?: string;
  error?: string;
  requestId?: string;
}

export interface FalConfig {
  apiKey: string;
  model: string;
}

class FalService {
  private config: FalConfig;

  constructor() {
    this.config = {
      apiKey: '', // Will be loaded from user settings
      model: 'fal-ai/nano-banana/edit',
    };
    
    // Configure fal client with the API key
    this.configureFalClient();
  }

  /**
   * Configure the fal.ai client with credentials
   */
  private configureFalClient(): void {
    fal.config({
      credentials: this.config.apiKey
    });
    console.log('Configured fal.ai client');
  }

  /**
   * Load API key from storage - call this before making API requests
   */
  private async loadApiKey(): Promise<void> {
    try {
      const apiKey = await storageService.getSetting('fal_api_key');
      if (apiKey) {
        this.config.apiKey = apiKey;
        this.configureFalClient();
      }
    } catch (error) {
      // Silent fail for API key loading - use default key
    }
  }

  /**
   * Set API key and save to storage
   */
  async setApiKey(apiKey: string): Promise<void> {
    this.config.apiKey = apiKey;
    await storageService.setSetting('fal_api_key', apiKey);
    this.configureFalClient();
  }

  /**
   * Get current API key
   */
  getApiKey(): string {
    return this.config.apiKey;
  }

  /**
   * Get API key and ensure it's loaded from storage
   */
  async getApiKeyFromStorage(): Promise<string> {
    await this.loadApiKey();
    return this.config.apiKey;
  }

  /**
   * Clear API key
   */
  async clearApiKey(): Promise<void> {
    this.config.apiKey = '';
    await storageService.deleteSetting('fal_api_key');
    this.configureFalClient();
  }

  /**
   * Test API connection using HTTP
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      await this.loadApiKey();
      
      if (!this.config.apiKey) {
        return { success: false, error: 'API key is required' };
      }

      // Test with a simple API call
      const testUrl = 'https://fal.run/fal-ai/nano-banana';
      const response = await fetch(testUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Key ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: 'test',
          num_images: 1,
          sync_mode: true,
        }),
      });

      if (response.ok) {
        return { success: true };
      } else {
        const errorText = await response.text();
        return { success: false, error: `HTTP ${response.status}: ${errorText}` };
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Network error' 
      };
    }
  }

  /**
   * Convert image to base64 data URL for direct use in API
   */
  private async imageToDataUrl(imageUri: string): Promise<string> {
    try {
      // Convert image to base64
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      // Return as data URL
      return `data:image/jpeg;base64,${base64}`;
    } catch (error) {
      throw new Error(`Failed to convert image to data URL: ${error}`);
    }
  }

  /**
   * Validate image format and size
   */
  private async validateImage(imageUri: string): Promise<boolean> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(imageUri);
      if (!fileInfo.exists) {
        throw new Error('Image file does not exist');
      }

      // Check file size (limit to 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (fileInfo.size && fileInfo.size > maxSize) {
        throw new Error('Image file is too large (max 10MB)');
      }

      return true;
    } catch (error) {
      throw new Error(`Image validation failed: ${error}`);
    }
  }

  /**
   * Generate virtual try-on using fal.ai nano-banana model via HTTP API
   */
  async generateStyleMe(request: FalStyleMeRequest): Promise<FalStyleMeResponse> {
    try {
      await this.loadApiKey();
      
      if (!this.config.apiKey) {
        throw new Error('Fal.ai API key is not configured. Please add your API key in Settings.');
      }

      console.log('Calling fal.ai virtual try-on API...');
      console.log('Image URIs:', { user: request.userImageUri, clothing: request.clothingImageUri });

      // Upload images to fal.ai storage first since local URIs won't work
      const userImageUrl = await fal.storage.upload(await this.convertUriToFile(request.userImageUri));
      const clothingImageUrl = await fal.storage.upload(await this.convertUriToFile(request.clothingImageUri));

      console.log('Uploaded URLs:', { user: userImageUrl, clothing: clothingImageUrl });

      // Use one-time API call instead of subscription to prevent credit drain
      const result = await fal.run("fal-ai/nano-banana/edit", {
        input: {
          prompt: "Use Image 1 as the target subject: preserve the exact body, skin, and pose, while removing all original clothing and accessories entirely. From Image 2, isolate the full outfit only (removing its model or background if present). Apply this outfit onto the subject from Image 1 so it naturally conforms to body shape, pose, and proportions. Ensure perfect integration by matching Image 1's lighting, shadows, perspective, and texture details. The final output must look like a single seamless photorealistic photo of the subject authentically wearing only the outfit from Image 2, with zero traces of the original garments.",
          image_urls: [userImageUrl, clothingImageUrl],
          num_images: 1,
          output_format: "jpeg"
        }
      });

      console.log('Fal.ai result:', result);

      // Extract the result image URL according to nano-banana/edit output schema
      if (result.data && result.data.images && result.data.images.length > 0) {
        return {
          success: true,
          imageUrl: result.data.images[0].url,
          requestId: result.requestId,
        };
      } else {
        console.error('No images in result:', result);
        return {
          success: false,
          error: 'No image generated by the model',
        };
      }

    } catch (error) {
      console.error('Fal.ai generation error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      return {
        success: false,
        error: `Virtual try-on failed: ${errorMessage}`,
      };
    }
  }

  /**
   * Convert URI to File object for fal.ai upload
   */
  private async convertUriToFile(uri: string): Promise<File> {
    const response = await fetch(uri);
    const blob = await response.blob();
    const filename = `image_${Date.now()}.jpg`;
    return new File([blob], filename, { type: 'image/jpeg' });
  }

  /**
   * Direct HTTP API call to fal.ai
   */
  private async callFalApiHttp(endpoint: string, payload: any): Promise<any> {
    const url = `https://fal.run/${endpoint}`;
    
    console.log('Making HTTP request to:', url);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('HTTP Error:', response.status, errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    return result;
  }

  /**
   * Build prompt for virtual try-on
   */
  private buildStyleMePrompt(request: FalStyleMeRequest): string {
    return "Use Image 1 as the target subject: preserve the exact body, skin, and pose, while removing all original clothing and accessories entirely. From Image 2, isolate the full outfit only (removing its model or background if present). Apply this outfit onto the subject from Image 1 so it naturally conforms to body shape, pose, and proportions. Ensure perfect integration by matching Image 1's lighting, shadows, perspective, and texture details. The final output must look like a single seamless photorealistic photo of the subject authentically wearing only the outfit from Image 2, with zero traces of the original garments.";
  }

  /**
   * Single attempt generation - no retries to prevent credit waste
   */
  async generateStyleMeWithRetry(
    request: FalStyleMeRequest, 
    maxRetries: number = 0,
    retryDelay: number = 0
  ): Promise<FalStyleMeResponse> {
    // Single attempt only to prevent credit waste
    return await this.generateStyleMe(request);
  }

  /**
   * Generate image using text-to-image endpoint via HTTP
   */
  async generateImage(prompt: string): Promise<FalStyleMeResponse> {
    try {
      await this.loadApiKey();
      
      if (!this.config.apiKey) {
        throw new Error('Fal.ai API key is not configured.');
      }

      const result = await this.callFalApiHttp('fal-ai/nano-banana', {
        prompt: prompt,
        num_images: 1,
        output_format: 'jpeg',
        sync_mode: true,
      });

      if (result && result.images && result.images.length > 0) {
        const imageUrl = result.images[0].url || result.images[0];
        
        return {
          success: true,
          imageUrl: typeof imageUrl === 'string' ? imageUrl : imageUrl?.url,
          requestId: `fal_text2img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        };
      } else {
        throw new Error('No image generated by the model');
      }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }
}

export const falService = new FalService();
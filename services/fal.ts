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
   * Test API connection without consuming credits
   * Only validates API key format and basic connectivity
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      await this.loadApiKey();
      
      if (!this.config.apiKey) {
        return { success: false, error: 'API key is required' };
      }

      // Basic API key format validation
      if (!this.config.apiKey.match(/^[a-zA-Z0-9\-_]+$/)) {
        return { success: false, error: 'Invalid API key format' };
      }

      // Test connectivity to fal.ai without making a generation request
      // Use a simple HEAD request to check if the service is reachable
      const testUrl = 'https://fal.run';
      const response = await fetch(testUrl, {
        method: 'HEAD',
        headers: {
          'Authorization': `Key ${this.config.apiKey}`,
        },
      });

      // A 401 means the key is invalid, anything else suggests connectivity
      if (response.status === 401) {
        return { success: false, error: 'Invalid API key' };
      } else if (response.status >= 200 && response.status < 500) {
        return { success: true };
      } else {
        return { success: false, error: `Service unavailable (HTTP ${response.status})` };
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
          prompt: `You are an expert AI fashion stylist and photorealistic editor. Your task is to perform a seamless virtual try-on.

**Source Inputs:**
- **[Image 1] The Model:** This image contains a person. You must preserve their identity, pose, and environment.
- **[Image 2] The Garment:** This image contains an article of clothing. You must extract its texture, color, and design.

**Core Objective:**
Generate a new, photorealistic image where the person from **[Image 1]** is wearing the clothing from **[Image 2]**.

**Detailed Execution Steps:**
1.  **Analyze the Model:** Identify the person's exact pose, body proportions, and the lighting conditions in [Image 1]. Pay close attention to the direction and softness of shadows.
2.  **Isolate the Garment:** Identify and isolate the clothing item(s) in [Image 2], capturing the complete design, texture, and fabric details.
3.  **Perform the Swap:** Replace the original clothing on the model with the new garment.
4.  **Ensure Perfect Fit & Drape:** The new garment must wrap and fold naturally around the model's body, respecting their posture. Create realistic wrinkles, seams, and shadows to show how the fabric interacts with the body.
5.  **Integrate Lighting:** The lighting on the garment must be completely consistent with the lighting on the model in [Image 1]. This includes casting subtle shadows from the model's body (e.g., chin, arms) onto the clothing.
6.  **Final Output:** Produce a single, high-resolution, photorealistic image with no signs of digital manipulation.

**Strict Constraints (What NOT to change):**
-   The model's face, hair, and skin.
-   The model's body shape and proportions.
-   The background of [Image 1].
-   The original pose.`,
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
   * Build prompt for virtual try-on using proven Nano Banana best practices
   */
  private buildStyleMePrompt(request: FalStyleMeRequest): string {
    return "Make this person wear the clothes from the second image. Remove all original clothing and replace with the outfit from image 2. Keep the same face, pose, body shape, and lighting. Photorealistic result.";
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
import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Animated,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { IconSymbol } from '@/components/ui/IconSymbol';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import { saveToGallery } from '@/services/storage';
import { openRouterService } from '@/services/openrouter';
const { width, height } = Dimensions.get('window');

export default function ResultScreen() {
  const params = useLocalSearchParams();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const generateNewTryOn = async () => {
    setIsGenerating(true);
    
    try {
      const userImageUri = typeof params.userImageUri === 'string' ? params.userImageUri : undefined;
      const outfitImageUri = typeof params.outfitImageUri === 'string' ? params.outfitImageUri : undefined;
      
      if (!userImageUri || !outfitImageUri) {
        Alert.alert('Error', 'Missing original images. Cannot generate new variation.');
        return;
      }
      
      // Use OpenRouter service to generate new try-on
      const response = await openRouterService.generateTryOnWithRetry({
        userImageUri,
        clothingImageUri: outfitImageUri,
        clothingType: 'top', // Could be determined by image analysis
        style: 'casual'
      });
      
      if (response.success && response.imageUrl) {
        // Save the new result to gallery
        try {
          await saveToGallery(response.imageUrl, 'result');
        } catch (error) {
          // Silent fail for gallery save
        }
        
        // Navigate to new result
        router.replace({
          pathname: '/result',
          params: {
            imageUri: response.imageUrl,
            userImageUri,
            outfitImageUri,
          },
        });
      } else {
        Alert.alert('Generation Failed', response.error || 'Failed to generate new try-on. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to generate new try-on. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const saveImage = async () => {
    try {
      setIsSaving(true);
      
      // Request media library permissions
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant access to save images to your gallery.');
        return;
      }

      // Download and save the image
      const imageUri = typeof params.imageUri === 'string' ? params.imageUri : '';
      if (!imageUri) {
        throw new Error('No image to save');
      }
      
      const fileUri = `${FileSystem.documentDirectory}tryon_result_${Date.now()}.jpg`;
      const downloadResult = await FileSystem.downloadAsync(imageUri, fileUri);
      
      if (downloadResult.status === 200) {
        const localUri = downloadResult.uri;
        const asset = await MediaLibrary.createAssetAsync(localUri);
        await MediaLibrary.createAlbumAsync('Virtual Try-On', asset, false);
        
        // Also save to app gallery storage
        try {
          await saveToGallery(imageUri, 'result');
        } catch (error) {
          // Silent fail for app gallery save
        }
        
        Alert.alert('Success', 'Image saved to your photo library!');
      } else {
        throw new Error('Failed to download image');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save image. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const shareImage = async () => {
    try {
      const imageUri = typeof params.imageUri === 'string' ? params.imageUri : '';
      if (!imageUri) {
        Alert.alert('Error', 'No image to share.');
        return;
      }
      
      const localUri = await FileSystem.downloadAsync(imageUri, `${FileSystem.documentDirectory}tryon_result_${Date.now()}.jpg`);
      await Sharing.shareAsync(localUri.uri);
    } catch (error) {
      Alert.alert('Error', 'Failed to share image. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <IconSymbol name="chevron.left" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Try-On Result</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Result Image */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: typeof params.imageUri === 'string' ? params.imageUri : '' }}
          style={styles.resultImage}
          contentFit="cover"
          transition={300}
        />
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        {/* Generate New Try-On and Share Row */}
        <View style={styles.bottomActionsRow}>
          <TouchableOpacity
            style={[styles.generateButton, isGenerating && styles.disabledButton]}
            onPress={generateNewTryOn}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color="#FFFFFF" size="small" />
                <Text style={styles.generateButtonText}>Generating...</Text>
              </View>
            ) : (
              <Text style={styles.generateButtonText}>Generate New Try-On</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.shareButton}
            onPress={shareImage}
          >
            <IconSymbol name="square.and.arrow.up" size={20} color="#666666" />
            <Text style={styles.shareButtonText}>Share</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  headerSpacer: {
    width: 32,
  },
  imageContainer: {
    flex: 1,
    margin: 20,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F5F5F5',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  resultImage: {
    width: '100%',
    height: '100%',
  },
  actionsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  generateButton: {
    backgroundColor: '#000000',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    height: 48,
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
  },
  generateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bottomActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    gap: 16,
  },
  shareButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    flexDirection: 'row',
    gap: 8,
    height: 48,
    flex: 0.35,
  },
  shareButtonText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
});

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
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { IconSymbol } from '@/components/ui/IconSymbol';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import { saveToGallery } from '@/services/storage';
import { useTheme } from '../components/contexts/ThemeContext';
const { width, height } = Dimensions.get('window');

export default function ResultScreen() {
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorModalTitle, setErrorModalTitle] = useState('');
  const [errorModalMessage, setErrorModalMessage] = useState('');

  const showErrorModal = (title: string, message: string) => {
    setErrorModalTitle(title);
    setErrorModalMessage(message);
    setErrorModalVisible(true);
  };

  const generateNewStyleMe = async () => {
    setIsGenerating(true);
    
    try {
      const userImageUri = typeof params.userImageUri === 'string' ? params.userImageUri : undefined;
      const outfitImageUri = typeof params.outfitImageUri === 'string' ? params.outfitImageUri : undefined;
      
      if (!userImageUri || !outfitImageUri) {
        showErrorModal('Error', 'Missing original images. Please go back to style-me screen.');
        return;
      }
      
      // Navigate back to processing screen for new style-me
      router.push({
        pathname: '/processing',
        params: {
          userImageUri,
          outfitImageUri,
          mode: 'regenerate',
        },
      });
      
    } catch (error) {
      showErrorModal('Error', 'Failed to start new style-me. Please try again.');
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
        showErrorModal('Permission Required', 'Please grant access to save images to your gallery.');
        return;
      }

      // Download and save the image
      const imageUri = typeof params.imageUri === 'string' ? params.imageUri : '';
      if (!imageUri) {
        throw new Error('No image to save');
      }
      
      const fileUri = `${FileSystem.documentDirectory}styleme_result_${Date.now()}.jpg`;
      const downloadResult = await FileSystem.downloadAsync(imageUri, fileUri);
      
      if (downloadResult.status === 200) {
        const localUri = downloadResult.uri;
        const asset = await MediaLibrary.createAssetAsync(localUri);
        await MediaLibrary.createAlbumAsync('Virtual Style-Me', asset, false);
        
        // Also save to app gallery storage
        try {
          await saveToGallery(imageUri, 'result');
        } catch (error) {
          // Silent fail for app gallery save
        }
        
        showErrorModal('Success', 'Image saved to your photo library!');
      } else {
        throw new Error('Failed to download image');
      }
    } catch (error) {
      showErrorModal('Error', 'Failed to save image. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const shareImage = async () => {
    try {
      const imageUri = typeof params.imageUri === 'string' ? params.imageUri : '';
      if (!imageUri) {
        showErrorModal('Error', 'No image to share.');
        return;
      }
      
      const localUri = await FileSystem.downloadAsync(imageUri, `${FileSystem.documentDirectory}styleme_result_${Date.now()}.jpg`);
      await Sharing.shareAsync(localUri.uri);
    } catch (error) {
      showErrorModal('Error', 'Failed to share image. Please try again.');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16, borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity 
          style={[styles.backButton, { backgroundColor: theme.colors.surfaceSecondary }]}
          onPress={() => router.back()}
        >
          <IconSymbol name="chevron.left" size={24} color={theme.colors.primaryText} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.primaryText }]}>Style-Me Result</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Content Container */}
      <View style={styles.contentContainer}>
        {/* Result Image */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: typeof params.imageUri === 'string' ? params.imageUri : '' }}
            style={styles.resultImage}
            contentFit="cover"
            transition={300}
          />
        </View>

        {/* Fixed Bottom Action Buttons */}
        <View style={[styles.fixedBottomContainer, { paddingBottom: insets.bottom + 20 }]}>
          <View style={styles.bottomActionsRow}>
            <TouchableOpacity
              style={[
                styles.generateButton, 
                { backgroundColor: theme.colors.buttonBackground },
                isGenerating && styles.disabledButton
              ]}
              onPress={generateNewStyleMe}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color={theme.colors.buttonText} size="small" />
                  <Text style={[styles.generateButtonText, { color: theme.colors.buttonText }]}>Generating...</Text>
                </View>
              ) : (
                <Text style={[styles.generateButtonText, { color: theme.colors.buttonText }]}>Generate New Style-Me</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.shareButton, { backgroundColor: theme.colors.surfaceSecondary }]}
              onPress={shareImage}
            >
              <IconSymbol name="square.and.arrow.up" size={20} color={theme.colors.primaryText} />
              <Text style={[styles.shareButtonText, { color: theme.colors.primaryText }]}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Error/Info Modal */}
      <Modal
        visible={errorModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setErrorModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: theme.colors.cardBackground }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.primaryText }]}>{errorModalTitle}</Text>
            <Text style={[styles.modalMessage, { color: theme.colors.secondaryText }]}>{errorModalMessage}</Text>
            
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: theme.colors.buttonBackground }]}
              onPress={() => setErrorModalVisible(false)}
            >
              <Text style={[styles.modalButtonText, { color: theme.colors.buttonText }]}>
                OK
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
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
  contentContainer: {
    flex: 1,
    position: 'relative',
  },
  imageContainer: {
    flex: 1,
    marginLeft: 20,
    marginRight: 20,
    marginTop: 10,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#F8F9FA',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  resultImage: {
    width: '85%',
    height: '100%',
    marginLeft: '15%',
  },
  fixedBottomContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: 'transparent',
  },
  generateButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginRight: 12,
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
    gap: 16,
  },
  shareButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    flexDirection: 'row',
    gap: 8,
    flex: 0.4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  shareButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    minWidth: 280,
    maxWidth: 340,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalButton: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

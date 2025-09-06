import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Dimensions,
  Platform,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { openRouterService } from '@/services/openrouter';
import { falService } from '@/services/fal';
import { saveToGallery } from '@/services/storage';
import { useTheme } from '../components/contexts/ThemeContext';

const { width, height } = Dimensions.get('window');

export default function ProcessingScreen() {
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const [isProcessing, setIsProcessing] = useState(false);
  const [userImage, setUserImage] = useState<string | null>(null);
  const [outfitImage, setOutfitImage] = useState<string | null>(null);
  const [styleMeResult, setStyleMeResult] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<'user' | 'outfit' | null>(null);
  const previousParams = useRef<any>(null);

  useEffect(() => {
    // Initialize images based on mode and parameters
    const imageUri = typeof params.imageUri === 'string' ? params.imageUri : null;
    const mode = typeof params.mode === 'string' ? params.mode : null;
    const userImageUri = typeof params.userImageUri === 'string' ? params.userImageUri : null;
    const outfitImageUri = typeof params.outfitImageUri === 'string' ? params.outfitImageUri : null;


    // Check if params actually changed to avoid unnecessary re-renders
    const currentParams = { imageUri, mode, userImageUri, outfitImageUri };
    const prevParams = previousParams.current;
    
    if (prevParams && 
        prevParams.imageUri === currentParams.imageUri && 
        prevParams.mode === currentParams.mode && 
        prevParams.userImageUri === currentParams.userImageUri && 
        prevParams.outfitImageUri === currentParams.outfitImageUri) {
      return;
    }

    previousParams.current = currentParams;

    // Only update if we have a new imageUri
    if (imageUri) {
      if (mode === 'look') {
        setUserImage(imageUri);
        if (outfitImageUri) {
          setOutfitImage(outfitImageUri);
        }
      } else if (mode === 'outfit') {
        setOutfitImage(imageUri);
        if (userImageUri) {
          setUserImage(userImageUri);
        }
      } else {
        setUserImage(imageUri);
      }
    }
    
    // Handle existing images from parameters
    if (userImageUri) {
      setUserImage(userImageUri);
    }
    if (outfitImageUri) {
      setOutfitImage(outfitImageUri);
    }
  }, [params.imageUri, params.mode, params.userImageUri, params.outfitImageUri]);

  const generateStyleMe = async () => {
    if (!userImage || !outfitImage) {
      Alert.alert(
        'Missing Images',
        'Please capture both your photo and the outfit piece to generate a style-me.',
        [
          { text: 'OK', onPress: () => router.back() }
        ]
      );
      return;
    }

    setIsProcessing(true);

    try {
      // Generate style-me using fal.ai nano-banana model
      const response = await falService.generateStyleMeWithRetry({
        userImageUri: userImage,
        clothingImageUri: outfitImage,
        clothingType: 'top', // Could be determined by image analysis
        style: 'casual'
      });

      if (response.success && response.imageUrl) {
        setStyleMeResult(response.imageUrl);
        
        // Save the result image to gallery
        try {
          await saveToGallery(response.imageUrl, 'result');
        } catch (error) {
          // Silent fail for gallery save
        }
        
        // Navigate to result screen
        router.push({
          pathname: '/result',
          params: {
            imageUri: response.imageUrl,
            userImageUri: userImage,
            outfitImageUri: outfitImage,
          },
        });
      } else {
        console.error('Fal.ai response error:', response.error);
        Alert.alert('Error', `Failed to generate style-me result: ${response.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Generation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate style-me. Please try again.';
      Alert.alert(
        'Generation Failed', 
        errorMessage,
        [
          { text: 'Retry', onPress: () => generateStyleMe() },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const selectMissingImage = () => {
    const missingMode = !userImage ? 'look' : 'outfit';
    router.push({
      pathname: '/(tabs)',
      params: {
        mode: missingMode,
        returnTo: 'processing',
        existingUserImage: userImage,
        existingOutfitImage: outfitImage,
      },
    });
  };

  const toggleSection = (section: 'user' | 'outfit') => {
    setExpandedSection(expandedSection === section ? null : section);
  };


  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { marginTop: Math.max(insets.top + 8, 16), backgroundColor: theme.colors.cardBackground }]}>
        <TouchableOpacity 
          style={[styles.backButton, { backgroundColor: theme.colors.surfaceSecondary }]}
          onPress={() => router.back()}
        >
          <IconSymbol name="chevron.left" size={24} color={theme.colors.primaryText} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.primaryText }]}>Style-Me</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Image Comparison View */}
      <View style={styles.comparisonContainer}>
        {/* User Image */}
        {(expandedSection === null || expandedSection === 'user') && (
          <TouchableOpacity 
            style={[
              styles.imageContainer,
              { backgroundColor: theme.colors.cardBackground },
              expandedSection === 'user' && styles.expandedContainer
            ]}
            onPress={() => toggleSection('user')}
            activeOpacity={0.8}
          >
            {userImage ? (
                <Image
                  source={{ uri: userImage }}
                  style={styles.comparisonImage}
                  resizeMode="cover"
                />
            ) : (
                <TouchableOpacity 
                  style={[styles.placeholderContainer, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.border }]}
                  onPress={selectMissingImage}
                >
                  <IconSymbol name="person" size={60} color={theme.colors.secondaryText} />
                  <Text style={[styles.placeholderText, { color: theme.colors.secondaryText }]}>Add Your Photo</Text>
                </TouchableOpacity>
            )}
            <View style={[styles.imageLabel, { backgroundColor: theme.colors.surface }]}>
              <Text style={[styles.imageLabelText, { color: theme.colors.primaryText }]}>Your Look</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Outfit Image */}
        {(expandedSection === null || expandedSection === 'outfit') && (
          <TouchableOpacity 
            style={[
              styles.imageContainer,
              { backgroundColor: theme.colors.cardBackground },
              expandedSection === 'outfit' && styles.expandedContainer
            ]}
            onPress={() => toggleSection('outfit')}
            activeOpacity={0.8}
          >
            {outfitImage ? (
                <Image
                  source={{ uri: outfitImage }}
                  style={styles.comparisonImage}
                  resizeMode="cover"
                />
            ) : (
                <TouchableOpacity 
                  style={[styles.placeholderContainer, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.border }]}
                  onPress={selectMissingImage}
                >
                  <IconSymbol name="tshirt" size={60} color={theme.colors.secondaryText} />
                  <Text style={[styles.placeholderText, { color: theme.colors.secondaryText }]}>Add Outfit Piece</Text>
                </TouchableOpacity>
            )}
            <View style={[styles.imageLabel, { backgroundColor: theme.colors.surface }]}>
              <Text style={[styles.imageLabelText, { color: theme.colors.primaryText }]}>Your Item</Text>
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* Generate Button */}
      <View style={[styles.buttonContainer, { paddingBottom: Math.max(insets.bottom + 80, 104) }]}>
        <TouchableOpacity
          style={[
            styles.generateButton,
            { backgroundColor: theme.colors.buttonBackground },
            (!userImage || !outfitImage || isProcessing) && styles.disabledButton
          ]}
          onPress={generateStyleMe}
          disabled={!userImage || !outfitImage || isProcessing}
        >
          {isProcessing ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={theme.colors.buttonText} size="small" />
              <Text style={[styles.buttonText, { color: theme.colors.buttonText }]}>Processing...</Text>
            </View>
          ) : (
            <Text style={[styles.buttonText, { color: theme.colors.buttonText }]}>Generate Style-Me</Text>
          )}
        </TouchableOpacity>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 20,
    marginTop: 8,
    borderRadius: 16,
    borderBottomWidth: 0,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    ...Platform.select({
      ios: {
        shadowOpacity: 0.12,
      },
    }),
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 32,
  },
  comparisonContainer: {
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 32,
    gap: 20,
  },
  imageContainer: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  expandedContainer: {
    flex: 2,
    borderColor: '#007AFF',
    borderWidth: 2,
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
    borderRadius: 24,
  },
  comparisonImage: {
    width: '100%',
    height: '100%',
    flex: 1,
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 16,
    margin: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  placeholderText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '600',
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'Roboto',
  },
  imageLabel: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  imageLabelText: {
    fontSize: 14,
    fontWeight: '600',
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  generateButton: {
    paddingVertical: 18,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  helperText: {
    marginTop: 12,
    textAlign: 'center',
    fontSize: 14,
    color: '#666',
  },
});

import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Camera, CameraType, CameraView } from 'expo-camera';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { useTheme } from '../../components/contexts/ThemeContext';

const { width, height } = Dimensions.get('window');

type CameraMode = 'outfit' | 'look';

export default function StyleMeScreen() {
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [cameraMode, setCameraMode] = useState<CameraMode>('outfit');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraFacing, setCameraFacing] = useState<CameraType>('back');
  const [flashMode, setFlashMode] = useState<'off' | 'on' | 'auto'>('off');
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  useEffect(() => {
    // Set camera mode based on params
    if (params.mode && (params.mode === 'outfit' || params.mode === 'look')) {
      setCameraMode(params.mode as CameraMode);
    }
  }, [params.mode]);

  const copyImageToPermanentStorage = async (sourceUri: string): Promise<string> => {
    try {
      // Create a unique filename
      const timestamp = Date.now();
      const filename = `image_${timestamp}.jpg`;
      const destinationUri = `${FileSystem.documentDirectory}${filename}`;
      
      // Copy the image to permanent storage
      await FileSystem.copyAsync({
        from: sourceUri,
        to: destinationUri,
      });
      
      return destinationUri;
    } catch (error) {
      throw error;
    }
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
        });
        if (photo) {
          // Copy to permanent storage
          const permanentUri = await copyImageToPermanentStorage(photo.uri);
          setCapturedImage(permanentUri);
          
          // Check if returning to processing with existing images
          const existingUserImage = typeof params.existingUserImage === 'string' ? params.existingUserImage : null;
          const existingOutfitImage = typeof params.existingOutfitImage === 'string' ? params.existingOutfitImage : null;
          const returnTo = typeof params.returnTo === 'string' ? params.returnTo : null;
          
          // Navigate to processing screen with image data
          if (returnTo === 'processing') {
            router.push({
              pathname: '/processing',
              params: {
                imageUri: permanentUri,
                mode: cameraMode,
                userImageUri: cameraMode === 'look' ? permanentUri : existingUserImage,
                outfitImageUri: cameraMode === 'outfit' ? permanentUri : existingOutfitImage,
              },
            });
          } else {
            router.push({
              pathname: '/processing',
              params: {
                imageUri: permanentUri,
                mode: cameraMode,
              },
            });
          }
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to take picture. Please try again.');
      }
    }
  };

  const toggleCamera = () => {
    setCameraFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const toggleFlash = () => {
    setFlashMode(current => {
      switch (current) {
        case 'off': return 'on';
        case 'on': return 'auto';
        case 'auto': return 'off';
        default: return 'off';
      }
    });
  };

  const pickFromGallery = async () => {
    try {
      // Request media library permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required', 
          'FitMirror needs access to your photo library to select images for virtual try-on. Please allow access in your device settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => {
              // Note: Opening settings programmatically requires additional setup
              Alert.alert('Settings', 'Please go to Settings > Apps > FitMirror > Permissions to enable photo access.');
            }}
          ]
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: false,
        quality: 0.8,
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
      });

      console.log('Image picker result:', result);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        // Copy to permanent storage
        const permanentUri = await copyImageToPermanentStorage(imageUri);
        setCapturedImage(permanentUri);
        
        // Check if returning to processing with existing images
        const existingUserImage = typeof params.existingUserImage === 'string' ? params.existingUserImage : null;
        const existingOutfitImage = typeof params.existingOutfitImage === 'string' ? params.existingOutfitImage : null;
        const returnTo = typeof params.returnTo === 'string' ? params.returnTo : null;
        
        // Navigate to processing screen with selected image
        if (returnTo === 'processing') {
          router.push({
            pathname: '/processing',
            params: {
              imageUri: permanentUri,
              mode: cameraMode,
              userImageUri: cameraMode === 'look' ? permanentUri : existingUserImage,
              outfitImageUri: cameraMode === 'outfit' ? permanentUri : existingOutfitImage,
            },
          });
        } else {
          router.push({
            pathname: '/processing',
            params: {
              imageUri: permanentUri,
              mode: cameraMode,
            },
          });
        }
      }
    } catch (error) {
      console.error('Image picker error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to select image. Please try again.';
      Alert.alert('Error', errorMessage);
    }
  };

  if (hasPermission === null) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.message, { color: theme.colors.primaryText }]}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.message, { color: theme.colors.primaryText }]}>No access to camera</Text>
        <TouchableOpacity style={[styles.galleryButton, { backgroundColor: theme.colors.buttonBackground }]} onPress={pickFromGallery}>
          <Text style={[styles.galleryButtonText, { color: theme.colors.buttonText }]}>Select from Gallery</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Fullscreen Camera View */}
      <CameraView
        ref={cameraRef}
        style={styles.fullscreenCamera}
        facing={cameraFacing}
        flash={flashMode}
      />
      
      {/* Floating Header */}
      <View style={[styles.floatingHeader, { paddingTop: insets.top + 20 }]}>
        <Text style={styles.floatingHeaderText}>
          {cameraMode === 'outfit' ? 'Snap your outfit piece' : 'Snap your look'}
        </Text>
      </View>

      {/* Top Camera Controls */}
      <View style={[styles.topControls, { top: insets.top + 80 }]}>
        <TouchableOpacity style={styles.controlButton} onPress={toggleFlash}>
          <IconSymbol 
            name={flashMode === 'off' ? 'bolt.slash' : flashMode === 'on' ? 'bolt.fill' : 'bolt'} 
            size={20} 
            color="#FFF" 
          />
          <Text style={styles.controlButtonLabel}>Flash</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlButton} onPress={toggleCamera}>
          <Ionicons name="camera-reverse" size={20} color="#FFF" />
          <Text style={styles.controlButtonLabel}>Camera</Text>
        </TouchableOpacity>
      </View>

      {/* Floating Camera Controls */}
      <View style={[styles.floatingControls, { bottom: insets.bottom + 180 }]}>
        {/* Gallery Button */}
        <TouchableOpacity style={styles.floatingGalleryButton} onPress={pickFromGallery}>
          <Ionicons name="images" size={20} color="#FFF" />
          <Text style={styles.galleryButtonText}>Photos</Text>
        </TouchableOpacity>

        {/* Capture Button */}
        <TouchableOpacity style={styles.floatingCaptureButton} onPress={takePicture}>
          <View style={styles.captureButtonRing}>
            <View style={styles.captureButtonInner} />
          </View>
        </TouchableOpacity>

        {/* Settings Placeholder */}
        <View style={styles.floatingSettingsPlaceholder} />
      </View>

      {/* Floating Bottom Toggle */}
      <View style={[styles.floatingBottomToggle, { bottom: insets.bottom + 100 }]}>
        <TouchableOpacity
          style={[
            styles.floatingToggleButton,
            cameraMode === 'outfit' && styles.activeFloatingToggle,
          ]}
          onPress={() => setCameraMode('outfit')}
        >
          <Text
            style={[
              styles.floatingToggleText,
              cameraMode === 'outfit' && styles.activeFloatingToggleText,
            ]}
          >
            Outfit
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.floatingToggleButton,
            cameraMode === 'look' && styles.activeFloatingToggle,
          ]}
          onPress={() => setCameraMode('look')}
        >
          <Text
            style={[
              styles.floatingToggleText,
              cameraMode === 'look' && styles.activeFloatingToggleText,
            ]}
          >
            Look
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  fullscreenCamera: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  floatingHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  floatingHeaderText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  topControls: {
    position: 'absolute',
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  controlButton: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
    gap: 6,
  },
  controlButtonLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    includeFontPadding: false,
    letterSpacing: 0.3,
  },
  controlButtonIcon: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    includeFontPadding: false,
  },
  centerPlaceholder: {
    position: 'absolute',
    top: '50%',
    left: 20,
    right: 20,
    transform: [{ translateY: -50 }],
    alignItems: 'center',
  },
  placeholderCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  placeholderText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
  },
  floatingControls: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  floatingGalleryButton: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
    gap: 6,
  },
  galleryButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    includeFontPadding: false,
    letterSpacing: 0.3,
  },
  floatingCaptureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'transparent',
    borderWidth: 4,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  floatingSettingsPlaceholder: {
    width: 80,
    height: 50,
  },
  floatingBottomToggle: {
    position: 'absolute',
    left: 20,
    right: 20,
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 25,
    padding: 4,
  },
  floatingToggleButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignItems: 'center',
  },
  activeFloatingToggle: {
    backgroundColor: '#FFFFFF',
  },
  floatingToggleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  activeFloatingToggleText: {
    color: '#000',
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
    fontSize: 16,
    color: '#333',
  },
  modeToggle: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 20,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  modeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  cameraContainer: {
    flex: 1,
    marginHorizontal: 20,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000000',
  },
  camera: {
    flex: 1,
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 245, 245, 0.8)',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 30,
  },
  galleryIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
  },
  spacer: {
    width: 50,
  },
  bottomToggle: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeToggle: {
    backgroundColor: '#000000',
  },
  toggleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  activeToggleText: {
    color: '#FFFFFF',
  },
  galleryButton: {
    backgroundColor: '#000000',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
    alignSelf: 'center',
  },
  galleryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

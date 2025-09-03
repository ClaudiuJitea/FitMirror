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
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

const { width, height } = Dimensions.get('window');

type CameraMode = 'outfit' | 'look';

export default function TryOnScreen() {
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [cameraMode, setCameraMode] = useState<CameraMode>('outfit');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
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

  const pickFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
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
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>No access to camera</Text>
        <TouchableOpacity style={styles.galleryButton} onPress={pickFromGallery}>
          <Text style={styles.galleryButtonText}>Select from Gallery</Text>
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
        facing="back"
      >
        {/* Floating Header */}
        <View style={[styles.floatingHeader, { paddingTop: insets.top + 20 }]}>
          <Text style={styles.floatingHeaderText}>
            {cameraMode === 'outfit' ? 'Snap your outfit piece' : 'Snap your look'}
          </Text>
        </View>


        {/* Floating Camera Controls */}
        <View style={[styles.floatingControls, { bottom: insets.bottom + 120 }]}>
          {/* Gallery Button */}
          <TouchableOpacity style={styles.floatingGalleryButton} onPress={pickFromGallery}>
            <IconSymbol name="photo.stack" size={24} color="#FFF" />
          </TouchableOpacity>

          {/* Capture Button */}
          <TouchableOpacity style={styles.floatingCaptureButton} onPress={takePicture}>
            <View style={styles.captureButtonInner} />
          </TouchableOpacity>

          {/* Settings Placeholder */}
          <View style={styles.floatingSettingsPlaceholder} />
        </View>

        {/* Floating Bottom Toggle */}
        <View style={[styles.floatingBottomToggle, { bottom: insets.bottom + 40 }]}>
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
      </CameraView>
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
    color: '#FFFFFF',
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    overflow: 'hidden',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
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
    width: 50,
    height: 50,
    borderRadius: 25,
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
  },
  floatingCaptureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
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
    width: 50,
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
    color: '#000000',
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
    backgroundColor: '#000',
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
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#000',
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
    backgroundColor: '#000',
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
    backgroundColor: '#000',
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

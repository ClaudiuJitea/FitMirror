import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { storageService } from '@/services/storage';
import { useTheme } from '../components/contexts/ThemeContext';

interface UserProfile {
  name: string;
  email: string;
  profileImage?: string;
}

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [profileImage, setProfileImage] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const profile = await storageService.getUserProfile();
      if (profile) {
        setName(profile.name);
        setEmail(profile.email);
        setProfileImage(profile.profileImage);
      } else {
        // Set default values
        setName('');
        setEmail('');
        setProfileImage('https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face');
      }
    } catch (error) {
      // Silent fail for profile loading
    } finally {
      setIsLoading(false);
    }
  };

  const validateName = (name: string): boolean => {
    if (!name.trim()) {
      setNameError('Name is required');
      return false;
    }
    if (name.trim().length < 2) {
      setNameError('Name must be at least 2 characters');
      return false;
    }
    setNameError('');
    return true;
  };

  const validateEmail = (email: string): boolean => {
    if (!email.trim()) {
      setEmailError('Email is required');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError('');
    return true;
  };

  const handleSave = async () => {
    const isNameValid = validateName(name);
    const isEmailValid = validateEmail(email);

    if (!isNameValid || !isEmailValid) {
      return;
    }

    setIsSaving(true);
    try {
      const updatedProfile: UserProfile = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        profileImage,
      };

      await storageService.setUserProfile(updatedProfile);
      setShowSuccessModal(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleNameChange = (text: string) => {
    setName(text);
    if (nameError) {
      validateName(text);
    }
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (emailError) {
      validateEmail(text);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.colors.primaryText }]}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView 
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >

        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingTop: 10, paddingBottom: 120 }}
        >
          {/* Profile Image Section */}
          <View style={[styles.imageSection, { backgroundColor: theme.colors.cardBackground }]}>
            <View style={styles.profileImageContainer}>
              <Image
                source={{ uri: profileImage }}
                style={[styles.profileImage, { backgroundColor: theme.colors.surfaceSecondary, borderColor: theme.colors.border }]}
                contentFit="cover"
              />
              <TouchableOpacity style={[styles.changeImageButton, { backgroundColor: theme.colors.buttonBackground, borderColor: theme.colors.cardBackground }]}>
                <IconSymbol name="pencil" size={16} color={theme.colors.buttonText} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.changeImageText, { color: theme.colors.secondaryText }]}>Tap to change photo</Text>
          </View>

          {/* Form Section */}
          <View style={[styles.formSection, { backgroundColor: theme.colors.cardBackground }]}>
            {/* Name Field */}
            <View style={styles.fieldContainer}>
              <Text style={[styles.fieldLabel, { color: theme.colors.primaryText }]}>Name</Text>
              <TextInput
                style={[
                  styles.textInput, 
                  { 
                    backgroundColor: theme.colors.surfaceSecondary, 
                    color: theme.colors.primaryText, 
                    borderColor: theme.colors.border 
                  },
                  nameError && styles.textInputError
                ]}
                value={name}
                onChangeText={handleNameChange}
                placeholder="Enter your name"
                placeholderTextColor={theme.colors.secondaryText}
                autoCapitalize="words"
                returnKeyType="next"
              />
              {nameError ? <Text style={[styles.errorText, { color: theme.colors.error }]}>{nameError}</Text> : null}
            </View>

            {/* Email Field */}
            <View style={styles.fieldContainer}>
              <Text style={[styles.fieldLabel, { color: theme.colors.primaryText }]}>Email Address</Text>
              <TextInput
                style={[
                  styles.textInput, 
                  { 
                    backgroundColor: theme.colors.surfaceSecondary, 
                    color: theme.colors.primaryText, 
                    borderColor: theme.colors.border 
                  },
                  emailError && styles.textInputError
                ]}
                value={email}
                onChangeText={handleEmailChange}
                placeholder="Enter your email"
                placeholderTextColor={theme.colors.secondaryText}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleSave}
              />
              {emailError ? <Text style={[styles.errorText, { color: theme.colors.error }]}>{emailError}</Text> : null}
            </View>

            {/* Save Button */}
            <TouchableOpacity
              style={[
                styles.saveButton, 
                { backgroundColor: theme.colors.buttonBackground },
                isSaving && styles.saveButtonDisabled
              ]}
              onPress={handleSave}
              disabled={isSaving}
            >
              <Text style={[
                styles.saveButtonText, 
                { color: theme.colors.buttonText },
                isSaving && styles.saveButtonTextDisabled
              ]}>
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Text>
            </TouchableOpacity>

            {/* Help Text */}
            <View style={[styles.helpSection, { borderTopColor: theme.colors.border }]}>
              <Text style={[styles.helpText, { color: theme.colors.secondaryText }]}>
                This information is stored locally on your device and is only used to personalize your experience.
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.successModal, { backgroundColor: theme.colors.cardBackground }]}>
            <View style={styles.successIcon}>
              <IconSymbol name="checkmark.circle.fill" size={24} color="#10B981" />
            </View>
            <Text style={[styles.successTitle, { color: theme.colors.primaryText }]}>Success</Text>
            <Text style={[styles.successMessage, { color: theme.colors.secondaryText }]}>Profile updated successfully!</Text>
            <TouchableOpacity
              style={[styles.successButton, { backgroundColor: theme.colors.buttonBackground }]}
              onPress={() => {
                setShowSuccessModal(false);
                router.back();
              }}
            >
              <Text style={[styles.successButtonText, { color: theme.colors.buttonText }]}>OK</Text>
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
  keyboardContainer: {
    flex: 1,
  },
  saveButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  saveButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonTextDisabled: {
    color: '#666666',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  imageSection: {
    alignItems: 'center',
    paddingVertical: 32,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
  },
  changeImageButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  changeImageText: {
    fontSize: 14,
    fontWeight: '500',
  },
  formSection: {
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  fieldContainer: {
    marginBottom: 24,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    borderWidth: 1,
  },
  textInputError: {
    borderColor: '#F44336',
  },
  errorText: {
    fontSize: 14,
    color: '#F44336',
    marginTop: 6,
    marginLeft: 4,
  },
  helpSection: {
    marginTop: 8,
    paddingTop: 20,
    borderTopWidth: 1,
  },
  helpText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  successModal: {
    borderRadius: 24,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    minWidth: 280,
    maxWidth: 320,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
  },
  successIcon: {
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
  },
  successButton: {
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 32,
    minWidth: 120,
    alignItems: 'center',
  },
  successButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

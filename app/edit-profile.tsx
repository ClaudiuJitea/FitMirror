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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { storageService } from '@/services/storage';

interface UserProfile {
  name: string;
  email: string;
  profileImage?: string;
}

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [profileImage, setProfileImage] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');

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
      Alert.alert(
        'Success',
        'Profile updated successfully!',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
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
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >

        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingTop: 20 }}
        >
          {/* Profile Image Section */}
          <View style={styles.imageSection}>
            <View style={styles.profileImageContainer}>
              <Image
                source={{ uri: profileImage }}
                style={styles.profileImage}
                contentFit="cover"
              />
              <TouchableOpacity style={styles.changeImageButton}>
                <IconSymbol name="pencil" size={16} color="#000" />
              </TouchableOpacity>
            </View>
            <Text style={styles.changeImageText}>Tap to change photo</Text>
          </View>

          {/* Form Section */}
          <View style={styles.formSection}>
            {/* Name Field */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Name</Text>
              <TextInput
                style={[styles.textInput, nameError && styles.textInputError]}
                value={name}
                onChangeText={handleNameChange}
                placeholder="Enter your name"
                placeholderTextColor="#999"
                autoCapitalize="words"
                returnKeyType="next"
              />
              {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}
            </View>

            {/* Email Field */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Email Address</Text>
              <TextInput
                style={[styles.textInput, emailError && styles.textInputError]}
                value={email}
                onChangeText={handleEmailChange}
                placeholder="Enter your email"
                placeholderTextColor="#999"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleSave}
              />
              {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
            </View>

            {/* Save Button */}
            <TouchableOpacity
              style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={isSaving}
            >
              <Text style={[styles.saveButtonText, isSaving && styles.saveButtonTextDisabled]}>
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Text>
            </TouchableOpacity>

            {/* Help Text */}
            <View style={styles.helpSection}>
              <Text style={styles.helpText}>
                This information is stored locally on your device and is only used to personalize your experience.
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  keyboardContainer: {
    flex: 1,
  },
  saveButton: {
    backgroundColor: '#000000',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  saveButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonTextDisabled: {
    color: '#666666',
  },
  scrollView: {
    flex: 1,
    paddingTop: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  imageSection: {
    alignItems: 'center',
    paddingVertical: 32,
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
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
    backgroundColor: '#F5F5F5',
  },
  changeImageButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFF00',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
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
    color: '#666',
    fontWeight: '500',
  },
  formSection: {
    marginHorizontal: 20,
    backgroundColor: '#FFFFFF',
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
    color: '#000',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#000',
    borderWidth: 1,
    borderColor: '#E8EAED',
  },
  textInputError: {
    borderColor: '#F44336',
    backgroundColor: '#FFF5F5',
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
    borderTopColor: '#F5F5F5',
  },
  helpText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    textAlign: 'center',
  },
});

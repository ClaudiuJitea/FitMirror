import React, { useState, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
  Alert,
  Switch,
  Linking,
  Modal,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { storageService, setSetting, getSetting, deleteSetting, clearCache } from '@/services/storage';
import { openRouterService } from '@/services/openrouter';

interface UserProfile {
  name: string;
  email: string;
  profileImage?: string;
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const [apiKey, setApiKey] = useState('');
  const [isApiKeyVisible, setIsApiKeyVisible] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'testing'>('disconnected');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: '',
    email: '',
    profileImage: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
  });
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorModalTitle, setErrorModalTitle] = useState('');
  const [errorModalMessage, setErrorModalMessage] = useState('');
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [confirmModalTitle, setConfirmModalTitle] = useState('');
  const [confirmModalMessage, setConfirmModalMessage] = useState('');
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadSettings(); // Reload settings when screen comes into focus
    }, [])
  );

  const loadSettings = async () => {
    try {
      const savedApiKey = await openRouterService.getApiKeyFromStorage();
      const savedDarkMode = await getSetting('dark_mode');
      const savedProfile = await storageService.getUserProfile();
      
      if (savedApiKey) {
        setApiKey(savedApiKey);
        // Test connection to verify if key is still valid
        const connectionTest = await openRouterService.testConnection();
        setConnectionStatus(connectionTest.success ? 'connected' : 'disconnected');
      } else {
        setConnectionStatus('disconnected');
      }
      if (savedDarkMode !== null) setIsDarkMode(savedDarkMode);
      if (savedProfile) setUserProfile(savedProfile);
      
    } catch (error) {
      // Silent fail for settings loading
    }
  };

  const handleApiKeyChange = async (text: string) => {
    try {
      await openRouterService.setApiKey(text);
      // Reset connection status when key changes
      setConnectionStatus('disconnected');
    } catch (error) {
      // Silent fail for API key saving
    }
  };

  const handleApiKeyInput = (text: string) => {
    setApiKey(text);
    // Save immediately as user types (with debounce would be better in production)
    handleApiKeyChange(text);
  };

  const toggleDarkMode = async (value: boolean) => {
    setIsDarkMode(value);
    try {
      await setSetting('dark_mode', value);
    } catch (error) {
      // Silent fail for dark mode setting
    }
  };

  const testConnection = async () => {
    if (!apiKey.trim()) {
      showErrorModal('Error', 'Please enter your API key first');
      return;
    }

    setConnectionStatus('testing');
    
    try {
      const result = await openRouterService.testConnection();
      
      if (result.success) {
        setConnectionStatus('connected');
        showErrorModal('Success', 'API connection successful!');
        // Save last successful test timestamp
        await setSetting('last_api_test', Date.now());
      } else {
        setConnectionStatus('disconnected');
        showErrorModal('Connection Failed', result.error || 'Failed to connect to API. Please check your key.');
      }
    } catch (error) {
      setConnectionStatus('disconnected');
      showErrorModal('Error', 'Network error occurred. Please try again.');
    }
  };

  const clearCacheData = () => {
    showConfirmModal(
      'Clear Cache',
      'This will delete all cached images and data. Continue?',
      async () => {
        try {
          await clearCache();
          showErrorModal('Success', 'Cache cleared successfully');
        } catch (error) {
          showErrorModal('Error', 'Failed to clear cache');
        }
      }
    );
  };

  const deleteApiKey = () => {
    showConfirmModal(
      'Delete API Key',
      'This will remove your stored API key. Continue?',
      async () => {
        try {
          await openRouterService.clearApiKey();
          setApiKey('');
          setConnectionStatus('disconnected');
          showErrorModal('Success', 'API key deleted');
        } catch (error) {
          showErrorModal('Error', 'Failed to delete API key');
        }
      }
    );
  };

  const editProfile = () => {
    router.push('/edit-profile');
  };

  const openNotificationSettings = () => {
    setErrorModalTitle('Notifications');
    setErrorModalMessage('Notification settings coming soon!');
    setErrorModalVisible(true);
  };

  const showErrorModal = (title: string, message: string) => {
    setErrorModalTitle(title);
    setErrorModalMessage(message);
    setErrorModalVisible(true);
  };

  const showConfirmModal = (title: string, message: string, action: () => void) => {
    setConfirmModalTitle(title);
    setConfirmModalMessage(message);
    setConfirmAction(() => action);
    setConfirmModalVisible(true);
  };

  const maskedApiKey = apiKey ? '•'.repeat(Math.min(apiKey.length, 16)) : '';

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { marginTop: Math.max(insets.top + 8, 16) }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <IconSymbol name="chevron.left" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>ACCOUNT</Text>
          
          <View style={styles.profileContainer}>
            <View style={styles.profileImageContainer}>
              <Image
                source={{ uri: userProfile.profileImage }}
                style={styles.profileImage}
                contentFit="cover"
              />
              <View style={styles.editBadge}>
                <IconSymbol name="pencil" size={12} color="#000" />
              </View>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{userProfile.name}</Text>
              <Text style={styles.profileEmail}>{userProfile.email}</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.settingItem} onPress={editProfile}>
            <Text style={styles.settingLabel}>Edit Profile</Text>
            <IconSymbol name="chevron.right" size={16} color="#999" />
          </TouchableOpacity>
        </View>

        {/* API Configuration Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>API CONFIGURATION</Text>
          
          <Text style={styles.settingLabel}>OpenRouter API Key</Text>
          
          <View style={styles.apiKeyContainer}>
            <TextInput
              style={styles.apiKeyInput}
              value={isApiKeyVisible ? apiKey : maskedApiKey}
              onChangeText={handleApiKeyInput}
              placeholder="Enter your API key"
              secureTextEntry={!isApiKeyVisible}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity 
              style={styles.eyeButton}
              onPress={() => setIsApiKeyVisible(!isApiKeyVisible)}
            >
              <IconSymbol 
                name={isApiKeyVisible ? "eye.slash" : "eye"} 
                size={20} 
                color="#666" 
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={styles.testConnectionButton}
            onPress={() => testConnection()}
            disabled={connectionStatus === 'testing'}
          >
            <Text style={styles.testConnectionText}>
              {connectionStatus === 'testing' ? 'Testing...' : 'Test Connection'}
            </Text>
            <View style={[
              styles.connectionStatus,
              connectionStatus === 'connected' && styles.connectedStatus
            ]}>
              <IconSymbol 
                name={connectionStatus === 'connected' ? "checkmark.circle.fill" : "xmark.circle.fill"} 
                size={16} 
                color={connectionStatus === 'connected' ? "#4CAF50" : "#F44336"} 
              />
              <Text style={[
                styles.connectionText,
                connectionStatus === 'connected' && styles.connectedText
              ]}>
                {connectionStatus === 'connected' ? 'Connected' : 'Disconnected'}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.getApiKeyButton} onPress={() => Linking.openURL('https://openrouter.ai/keys')}>
            <Text style={styles.getApiKeyText}>Get API Key</Text>
            <IconSymbol name="arrow.up.right.square" size={16} color="#FF9800" />
          </TouchableOpacity>
        </View>

        {/* Privacy & Data Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>PRIVACY & DATA</Text>
          
          <TouchableOpacity style={styles.settingItem} onPress={clearCacheData}>
            <Text style={styles.settingLabel}>Clear Cache</Text>
            <IconSymbol name="chevron.right" size={16} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.deleteButton} onPress={deleteApiKey}>
            <Text style={styles.deleteButtonText}>Delete API Key</Text>
            <IconSymbol name="trash" size={16} color="#F44336" />
          </TouchableOpacity>
        </View>

        {/* General Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>GENERAL SETTINGS</Text>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Dark/Light mode</Text>
            <Switch
              value={isDarkMode}
              onValueChange={toggleDarkMode}
              trackColor={{ false: '#E0E0E0', true: '#4CAF50' }}
              thumbColor={isDarkMode ? '#FFFFFF' : '#FFFFFF'}
            />
          </View>

          <TouchableOpacity style={styles.settingItem} onPress={openNotificationSettings}>
            <Text style={styles.settingLabel}>Notification preferences</Text>
            <IconSymbol name="chevron.right" size={16} color="#999" />
          </TouchableOpacity>
        </View>

        {/* Bottom spacing for tab bar */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Error/Info Modal */}
      <Modal
        visible={errorModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setErrorModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>{errorModalTitle}</Text>
            <Text style={styles.modalMessage}>{errorModalMessage}</Text>
            
            <TouchableOpacity
              style={[styles.modalButton, styles.primaryModalButton]}
              onPress={() => setErrorModalVisible(false)}
            >
              <Text style={[styles.modalButtonText, styles.primaryModalButtonText]}>
                OK
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Confirmation Modal */}
      <Modal
        visible={confirmModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setConfirmModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>{confirmModalTitle}</Text>
            <Text style={styles.modalMessage}>{confirmModalMessage}</Text>
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => {
                  setConfirmModalVisible(false);
                  setConfirmAction(null);
                }}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.destructiveModalButton]}
                onPress={() => {
                  if (confirmAction) {
                    confirmAction();
                  }
                  setConfirmModalVisible(false);
                  setConfirmAction(null);
                }}
              >
                <Text style={[styles.modalButtonText, styles.destructiveModalButtonText]}>
                  Confirm
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  scrollView: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    marginBottom: 16,
  },
  profileImageContainer: {
    position: 'relative',
    marginRight: 16,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F5F5F5',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFF00',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#666',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  settingLabel: {
    fontSize: 16,
    color: '#000',
    fontWeight: '400',
  },
  apiKeyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 8,
    marginBottom: 16,
  },
  apiKeyInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
    fontFamily: 'monospace',
  },
  eyeButton: {
    padding: 4,
  },
  testConnectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    marginBottom: 8,
  },
  testConnectionText: {
    fontSize: 16,
    color: '#000',
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  connectedStatus: {
    // Additional styling for connected state
  },
  connectionText: {
    fontSize: 14,
    color: '#F44336',
    fontWeight: '500',
  },
  connectedText: {
    color: '#4CAF50',
  },
  getApiKeyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  getApiKeyText: {
    fontSize: 16,
    color: '#FF9800',
    fontWeight: '500',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  deleteButtonText: {
    fontSize: 16,
    color: '#F44336',
    fontWeight: '400',
  },
  bottomSpacing: {
    height: 100,
  },
  // Modal styles
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
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
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
  modalActions: {
    gap: 12,
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  primaryModalButton: {
    backgroundColor: '#000000',
  },
  destructiveModalButton: {
    backgroundColor: '#FF3B30',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  primaryModalButtonText: {
    color: '#FFFFFF',
  },
  destructiveModalButtonText: {
    color: '#FFFFFF',
  },
});

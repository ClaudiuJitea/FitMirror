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
import { useTheme } from '../../components/contexts/ThemeContext';
import { falService } from '@/services/fal';

interface UserProfile {
  name: string;
  email: string;
  profileImage?: string;
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const scrollViewRef = React.useRef<ScrollView>(null);
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const [falApiKey, setFalApiKey] = useState('');
  const [isFalApiKeyVisible, setIsFalApiKeyVisible] = useState(false);
  const [falConnectionStatus, setFalConnectionStatus] = useState<'connected' | 'disconnected' | 'testing'>('disconnected');
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
      
      // Scroll down when screen comes into focus
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: 200, animated: true });
      }, 300);
    }, [])
  );

  const loadSettings = async () => {
    try {
      const savedFalApiKey = await falService.getApiKeyFromStorage();
      const savedProfile = await storageService.getUserProfile();

      if (savedFalApiKey) {
        setFalApiKey(savedFalApiKey);
        // Test fal.ai connection
        const falConnectionTest = await falService.testConnection();
        setFalConnectionStatus(falConnectionTest.success ? 'connected' : 'disconnected');
      } else {
        setFalConnectionStatus('disconnected');
      }
      
      if (savedProfile) setUserProfile(savedProfile);
      
    } catch (error) {
      // Silent fail for settings loading
    }
  };


  const handleFalApiKeyChange = async (text: string) => {
    try {
      await falService.setApiKey(text);
      // Reset connection status when key changes
      setFalConnectionStatus('disconnected');
    } catch (error) {
      // Silent fail for API key saving
    }
  };

  const handleFalApiKeyInput = (text: string) => {
    setFalApiKey(text);
    // Save immediately as user types (with debounce would be better in production)
    handleFalApiKeyChange(text);
  };

  const toggleDarkMode = async (value: boolean) => {
    toggleTheme(); // This will handle the state and storage automatically
  };


  const testFalConnection = async () => {
    if (!falApiKey.trim()) {
      showErrorModal('Error', 'Please enter your fal.ai API key first');
      return;
    }

    setFalConnectionStatus('testing');
    
    try {
      const result = await falService.testConnection();
      
      if (result.success) {
        setFalConnectionStatus('connected');
        showErrorModal('Success', 'Fal.ai API connection successful!');
        // Save last successful test timestamp
        await setSetting('last_fal_api_test', Date.now());
      } else {
        setFalConnectionStatus('disconnected');
        showErrorModal('Connection Failed', result.error || 'Failed to connect to fal.ai API. Please check your key.');
      }
    } catch (error) {
      setFalConnectionStatus('disconnected');
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


  const deleteFalApiKey = () => {
    showConfirmModal(
      'Delete Fal.ai API Key',
      'This will remove your stored fal.ai API key. Continue?',
      async () => {
        try {
          await falService.clearApiKey();
          setFalApiKey('');
          setFalConnectionStatus('disconnected');
          showErrorModal('Success', 'Fal.ai API key deleted');
        } catch (error) {
          showErrorModal('Error', 'Failed to delete fal.ai API key');
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

  const maskedFalApiKey = falApiKey ? '•'.repeat(Math.min(falApiKey.length, 16)) : '';

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
        <Text style={[styles.headerTitle, { color: theme.colors.primaryText }]}>Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        ref={scrollViewRef}
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 20 }}
      >
        {/* Account Section */}
        <View style={[styles.section, { backgroundColor: theme.colors.cardBackground }]}>
          <View style={styles.sectionHeaderWithIcon}>
            <Text style={[styles.sectionHeader, { color: theme.colors.secondaryText }]}>ACCOUNT</Text>
            <TouchableOpacity style={[styles.settingsIcon, { backgroundColor: theme.colors.surfaceSecondary }]} onPress={editProfile}>
              <IconSymbol name="gearshape" size={16} color={theme.colors.secondaryText} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.centeredProfileContainer}>
            <View style={styles.profileImageContainer}>
              <Image
                source={{ uri: userProfile.profileImage }}
                style={styles.profileImage}
                contentFit="cover"
              />
              <View style={styles.editBadge}>
                <IconSymbol name="pencil" size={10} color="#FFF" />
              </View>
            </View>
            <View style={styles.centeredProfileInfo}>
              <Text style={[styles.profileName, { color: theme.colors.primaryText }]}>{userProfile.name}</Text>
              <Text style={[styles.profileEmail, { color: theme.colors.secondaryText }]}>{userProfile.email}</Text>
            </View>
          </View>
        </View>


        {/* API Configuration Section */}
        <View style={[styles.section, { backgroundColor: theme.colors.cardBackground }]}>
          <Text style={[styles.sectionHeader, { color: theme.colors.secondaryText }]}>API CONFIGURATION</Text>
          
          <Text style={[styles.settingLabel, { color: theme.colors.primaryText }]}>Fal.ai API Key</Text>
          
          <View style={[styles.apiKeyContainer, { backgroundColor: theme.colors.surfaceSecondary, borderColor: theme.colors.border }]}>
            <TextInput
              style={[styles.apiKeyInput, { color: theme.colors.primaryText }]}
              value={isFalApiKeyVisible ? falApiKey : maskedFalApiKey}
              onChangeText={handleFalApiKeyInput}
              placeholder="Enter your fal.ai API key"
              placeholderTextColor={theme.colors.secondaryText}
              secureTextEntry={!isFalApiKeyVisible}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity 
              style={styles.eyeButton}
              onPress={() => setIsFalApiKeyVisible(!isFalApiKeyVisible)}
            >
              <IconSymbol 
                name={isFalApiKeyVisible ? "eye.slash" : "eye"} 
                size={20} 
                color={theme.colors.secondaryText} 
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={[
              styles.testConnectionButton, 
              { 
                backgroundColor: theme.colors.surface, 
                borderColor: theme.colors.border 
              }
            ]}
            onPress={() => testFalConnection()}
            disabled={falConnectionStatus === 'testing'}
          >
            <Text style={[styles.testConnectionText, { color: theme.colors.primaryText }]}>
              {falConnectionStatus === 'testing' ? 'Testing...' : 'Fal.ai Connection'}
            </Text>
            <View style={[
              styles.connectionStatus,
              { backgroundColor: 'transparent' }
            ]}>
              <IconSymbol 
                name={falConnectionStatus === 'connected' ? "checkmark.circle.fill" : "xmark.circle.fill"} 
                size={16} 
                color={falConnectionStatus === 'connected' ? theme.colors.success : theme.colors.error} 
              />
              <Text style={[
                styles.connectionText,
                { 
                  color: falConnectionStatus === 'connected' ? theme.colors.success : theme.colors.error 
                }
              ]}>
                {falConnectionStatus === 'connected' ? 'Connected' : 'Disconnected'}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.getApiKeyButton, { borderColor: theme.colors.border }]} onPress={() => Linking.openURL('https://fal.ai/dashboard/keys')}>
            <Text style={[styles.getApiKeyText, { color: theme.colors.buttonBackground }]}>Get Fal.ai API Key</Text>
            <IconSymbol name="arrow.up.right.square" size={16} color={theme.colors.buttonBackground} />
          </TouchableOpacity>
        </View>

        {/* Privacy & Data Section */}
        <View style={[styles.section, { backgroundColor: theme.colors.cardBackground }]}>
          <Text style={[styles.sectionHeader, { color: theme.colors.secondaryText }]}>PRIVACY & DATA</Text>
          
          <TouchableOpacity style={[styles.settingItem, { borderBottomColor: theme.colors.border }]} onPress={clearCacheData}>
            <Text style={[styles.settingLabel, { color: theme.colors.primaryText }]}>Clear Cache</Text>
            <IconSymbol name="trash" size={16} color={theme.colors.error} />
          </TouchableOpacity>


          <TouchableOpacity style={[styles.settingItem, { borderBottomWidth: 0 }]} onPress={deleteFalApiKey}>
            <Text style={[styles.settingLabel, { color: theme.colors.primaryText }]}>Delete Fal.ai API Key</Text>
            <IconSymbol name="trash" size={16} color={theme.colors.error} />
          </TouchableOpacity>
        </View>

        {/* General Settings Section */}
        <View style={[styles.section, { backgroundColor: theme.colors.cardBackground }]}>
          <Text style={[styles.sectionHeader, { color: theme.colors.secondaryText }]}>GENERAL SETTINGS</Text>
          
          <View style={[styles.settingItem, { borderBottomColor: theme.colors.border }]}>
            <Text style={[styles.settingLabel, { color: theme.colors.primaryText }]}>Dark/Light mode</Text>
            <Switch
              value={isDarkMode}
              onValueChange={toggleDarkMode}
              trackColor={{ false: '#39393D', true: theme.colors.buttonBackground }}
              thumbColor={isDarkMode ? '#FFFFFF' : '#FFFFFF'}
            />
          </View>

          <TouchableOpacity style={[styles.settingItem, { borderBottomWidth: 0 }]} onPress={openNotificationSettings}>
            <Text style={[styles.settingLabel, { color: theme.colors.primaryText }]}>Notification preferences</Text>
            <IconSymbol name="chevron.right" size={16} color={theme.colors.secondaryText} />
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
          <View style={[styles.modalContainer, { backgroundColor: theme.colors.cardBackground }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.primaryText }]}>{errorModalTitle}</Text>
            <Text style={[styles.modalMessage, { color: theme.colors.secondaryText }]}>{errorModalMessage}</Text>
            
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
          <View style={[styles.modalContainer, { backgroundColor: theme.colors.cardBackground }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.primaryText }]}>{confirmModalTitle}</Text>
            <Text style={[styles.modalMessage, { color: theme.colors.secondaryText }]}>{confirmModalMessage}</Text>
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.colors.surfaceSecondary }]}
                onPress={() => {
                  setConfirmModalVisible(false);
                  setConfirmAction(null);
                }}
              >
                <Text style={[styles.modalButtonText, { color: theme.colors.primaryText }]}>Cancel</Text>
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
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
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
    color: '#000000',
  },
  headerSpacer: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 16,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  sectionHeaderWithIcon: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  settingsIcon: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    marginBottom: 16,
  },
  centeredProfileContainer: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  profileImageContainer: {
    position: 'relative',
    alignItems: 'center',
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F5F5F5',
  },
  editBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
  },
  centeredProfileInfo: {
    alignItems: 'center',
    marginTop: 12,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
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
    borderBottomColor: '#F3F4F6',
  },
  settingLabel: {
    fontSize: 16,
    color: '#000000',
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
    color: '#000000',
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
    color: '#000000',
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
    color: '#10B981',
  },
  getApiKeyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  getApiKeyText: {
    fontSize: 16,
    color: '#6B7280',
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
    color: '#6B7280',
    fontWeight: '400',
  },
  bottomSpacing: {
    height: 160,
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

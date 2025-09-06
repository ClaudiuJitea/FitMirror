import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  FlatList,
  Dimensions,
  Alert,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { storageService, getGalleryItems, clearMockData } from '@/services/storage';
import { useTheme } from '../../components/contexts/ThemeContext';

const { width } = Dimensions.get('window');
const ITEM_SIZE = (width - 60) / 2;

interface GalleryItem {
  id: string;
  uri: string;
  type: 'user' | 'outfit' | 'result';
  timestamp: number;
}

export default function GalleryScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const [galleryData, setGalleryData] = useState<GalleryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  useEffect(() => {
    loadGalleryData();
  }, []);

  const loadGalleryData = async () => {
    try {
      setIsLoading(true);
      // Clear any existing mock data first
      await clearMockData();
      const items = await getGalleryItems();
      setGalleryData(items);
    } catch (error) {
      // Silent fail for gallery data loading
    } finally {
      setIsLoading(false);
    }
  };

  const handleItemPress = (item: GalleryItem) => {
    if (item.type === 'result') {
      // Navigate to result view
      router.push({
        pathname: '/result',
        params: {
          imageUri: item.uri,
          isFromGallery: 'true',
        },
      });
    } else {
      // Show custom modal for user photos and outfits
      setSelectedItem(item);
      setModalVisible(true);
    }
  };

  const navigateToStyleMe = (item: GalleryItem) => {
    router.push({
      pathname: '/processing',
      params: {
        imageUri: item.uri,
        mode: item.type === 'user' ? 'look' : 'outfit',
      },
    });
  };

  const deleteItem = (itemId: string) => {
    setItemToDelete(itemId);
    setDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    
    try {
      await storageService.deleteGalleryItem(itemToDelete);
      setGalleryData(items => items.filter(item => item.id !== itemToDelete));
    } catch (error) {
      Alert.alert('Error', 'Failed to delete item');
    } finally {
      setDeleteModalVisible(false);
      setItemToDelete(null);
    }
  };

  const startNewStyleMe = () => {
    router.push('/(tabs)');
  };

  const renderGalleryItem = ({ item }: { item: GalleryItem }) => (
    <TouchableOpacity
      style={styles.galleryItem}
      onPress={() => handleItemPress(item)}
    >
      <Image
        source={{ uri: item.uri }}
        style={styles.itemImage}
        contentFit="cover"
        transition={200}
      />
      <View style={[styles.itemBadge, styles[`${item.type}Badge`]]}>
        <IconSymbol
          name={
            item.type === 'user' 
              ? 'person.fill' 
              : item.type === 'outfit' 
              ? 'tshirt.fill' 
              : 'sparkles'
          }
          size={12}
          color="#FFFFFF"
        />
      </View>
    </TouchableOpacity>
  );

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
        <Text style={[styles.headerTitle, { color: theme.colors.primaryText }]}>Gallery</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Gallery Grid */}
      <FlatList
        data={galleryData}
        renderItem={renderGalleryItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.galleryGrid}
      />

      {/* Start New Style-Me Button */}
      <View style={[styles.bottomContainer, { paddingBottom: insets.bottom + 90, backgroundColor: theme.colors.background, borderTopColor: theme.colors.border }]}>
        <TouchableOpacity
          style={[styles.startButton, { backgroundColor: theme.colors.buttonBackground }]}
          onPress={startNewStyleMe}
        >
          <IconSymbol name="plus" size={20} color={theme.colors.buttonText} />
          <Text style={[styles.startButtonText, { color: theme.colors.buttonText }]}>Start New Style-Me</Text>
        </TouchableOpacity>
      </View>

      {/* Custom Action Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: theme.colors.cardBackground }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.primaryText }]}>Gallery Item</Text>
            <Text style={[styles.modalMessage, { color: theme.colors.secondaryText }]}>
              This is a {selectedItem?.type === 'user' ? 'user photo' : 'clothing item'}. What would you like to do?
            </Text>
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.colors.surfaceSecondary }]}
                onPress={() => {
                  setModalVisible(false);
                }}
              >
                <Text style={[styles.modalButtonText, { color: theme.colors.primaryText }]}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.primaryModalButton]}
                onPress={() => {
                  if (selectedItem) {
                    navigateToStyleMe(selectedItem);
                  }
                  setModalVisible(false);
                }}
              >
                <Text style={[styles.modalButtonText, styles.primaryModalButtonText]}>
                  Use for Style-Me
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.destructiveModalButton]}
                onPress={() => {
                  if (selectedItem) {
                    deleteItem(selectedItem.id);
                  }
                  setModalVisible(false);
                }}
              >
                <Text style={[styles.modalButtonText, styles.destructiveModalButtonText]}>
                  Delete
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={deleteModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: theme.colors.cardBackground }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.primaryText }]}>Delete Item</Text>
            <Text style={[styles.modalMessage, { color: theme.colors.secondaryText }]}>
              Are you sure you want to delete this item?
            </Text>
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.colors.surfaceSecondary }]}
                onPress={() => {
                  setDeleteModalVisible(false);
                  setItemToDelete(null);
                }}
              >
                <Text style={[styles.modalButtonText, { color: theme.colors.primaryText }]}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.destructiveModalButton]}
                onPress={confirmDelete}
              >
                <Text style={[styles.modalButtonText, styles.destructiveModalButtonText]}>
                  Delete
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
  galleryGrid: {
    padding: 20,
    paddingBottom: 170,
  },
  row: {
    justifyContent: 'space-between',
  },
  separator: {
    height: 20,
  },
  galleryItem: {
    width: ITEM_SIZE,
    height: ITEM_SIZE * 1.3,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F5F5F5',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  itemBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userBadge: {
    backgroundColor: '#000000',
  },
  outfitBadge: {
    backgroundColor: '#000000',
  },
  resultBadge: {
    backgroundColor: '#000000',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
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

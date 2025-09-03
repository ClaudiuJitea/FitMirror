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
import { storageService, getGalleryItems } from '@/services/storage';

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
      const items = await getGalleryItems();
      
      // Add some mock data for demo if no items exist
      if (items.length === 0) {
        const mockItems = [
          { id: '1', uri: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=300&h=400&fit=crop', type: 'user' as const, timestamp: Date.now() - 86400000 },
          { id: '2', uri: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=300&h=400&fit=crop', type: 'outfit' as const, timestamp: Date.now() - 172800000 },
          { id: '3', uri: 'https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?w=300&h=400&fit=crop', type: 'result' as const, timestamp: Date.now() - 259200000 },
          { id: '4', uri: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=300&h=400&fit=crop&crop=face', type: 'user' as const, timestamp: Date.now() - 345600000 },
          { id: '5', uri: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=300&h=400&fit=crop', type: 'outfit' as const, timestamp: Date.now() - 432000000 },
          { id: '6', uri: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=300&h=400&fit=crop', type: 'result' as const, timestamp: Date.now() - 518400000 },
        ];
        
        // Save mock items to storage for demo
        for (const item of mockItems) {
          await storageService.saveGalleryItem(item.uri, item.type);
        }
        
        setGalleryData(mockItems);
      } else {
        setGalleryData(items);
      }
      
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

  const navigateToTryOn = (item: GalleryItem) => {
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

  const startNewTryOn = () => {
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
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <IconSymbol name="chevron.left" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gallery</Text>
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

      {/* Start New Try-On Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={styles.startButton}
          onPress={startNewTryOn}
        >
          <IconSymbol name="plus" size={20} color="#FFFFFF" />
          <Text style={styles.startButtonText}>Start New Try-On</Text>
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
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Gallery Item</Text>
            <Text style={styles.modalMessage}>
              This is a {selectedItem?.type === 'user' ? 'user photo' : 'clothing item'}. What would you like to do?
            </Text>
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => {
                  setModalVisible(false);
                }}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.primaryModalButton]}
                onPress={() => {
                  if (selectedItem) {
                    navigateToTryOn(selectedItem);
                  }
                  setModalVisible(false);
                }}
              >
                <Text style={[styles.modalButtonText, styles.primaryModalButtonText]}>
                  Use for Try-On
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
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Delete Item</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to delete this item?
            </Text>
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => {
                  setDeleteModalVisible(false);
                  setItemToDelete(null);
                }}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
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
  galleryGrid: {
    padding: 20,
    paddingBottom: 100,
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
    backgroundColor: '#4CAF50',
  },
  outfitBadge: {
    backgroundColor: '#2196F3',
  },
  resultBadge: {
    backgroundColor: '#FF9800',
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
    borderTopColor: '#F5F5F5',
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

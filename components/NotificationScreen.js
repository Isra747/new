import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Image,
} from 'react-native';
import Footer from './Footer';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NotificationScreen = ({ navigation }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [readItems, setReadItems] = useState(new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const petString = await AsyncStorage.getItem('selectedPet');
        const pet = petString ? JSON.parse(petString) : null;
  
        if (!pet || !pet.id) {
          setError('No pet selected');
          setLoading(false);
          return;
        }
  
        // ✅ Use pet.user_email instead of stored stale email
        const user_email = pet.user_email;
  
        if (!user_email) {
          setError('No user_email found for selected pet');
          setLoading(false);
          return;
        }
  
        console.log('🐾 Selected pet from AsyncStorage:', pet.id);
        console.log('✅ user_email (from pet object):', user_email);
  
        const url = `https://u76rpadxda.us-east-1.awsapprunner.com/notifications?user_email=${encodeURIComponent(user_email)}&pet_id=${encodeURIComponent(pet.id)}`;
        const res = await fetch(url);
        const data = await res.json();
  
        console.log('🔔 Fetched notifications:', data);
        setNotifications(data);
  
        const saved = await AsyncStorage.getItem('read_notifications');
        const parsed = saved ? JSON.parse(saved) : [];
        setReadItems(new Set(parsed));
      } catch (err) {
        console.error('Fetch error:', err);
        setError('Failed to fetch notifications');
      } finally {
        setLoading(false);
      }
    };
  
    fetchNotifications();
  }, []);
  
  
  

  const handleMarkAsRead = async (id) => {
    setReadItems((prev) => {
      const updated = new Set(prev);
      updated.add(id);
      AsyncStorage.setItem('read_notifications', JSON.stringify(Array.from(updated)));
      return updated;
    });
  };

  const handlePress = (id) => {
    if (selectionMode) {
      setSelectedIds((prev) => {
        const newSet = new Set(prev);
        newSet.has(id) ? newSet.delete(id) : newSet.add(id);
        return newSet;
      });
    } else {
      handleMarkAsRead(id);
    }
  };

const handleDeleteSelected = async () => {
  const ids = Array.from(selectedIds);

  if (ids.length === 0) {
    // Instead of alerting only, also exit selection mode
    setSelectionMode(false);
    return;
  }

  try {
    const res = await fetch('https://u76rpadxda.us-east-1.awsapprunner.com/api/delete-notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    });

    const data = await res.json();

    if (res.ok) {
      alert('Notifications deleted successfully');

      // Update UI
      setNotifications((prev) => prev.filter((n) => !selectedIds.has(n.id)));

      // Remove from read items
      setReadItems((prev) => {
        const updated = new Set(prev);
        ids.forEach((id) => updated.delete(id));
        AsyncStorage.setItem('read_notifications', JSON.stringify(Array.from(updated)));
        return updated;
      });

      // Reset UI state
      setSelectedIds(new Set());
      setSelectionMode(false);
    } else {
      alert(`Failed to delete notifications: ${data.error || 'Unknown error'}`);
    }
  } catch (err) {
    console.error('Delete error:', err);
    alert('Network error while deleting notifications.');
  }
};



  const unreadCount = notifications.filter((n) => !readItems.has(n.id)).length;
  const readCount = notifications.length - unreadCount;

  if (loading) {
    return <ActivityIndicator style={{ flex: 1 }} size="large" color="#6c4b3c" />;
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        renderItem={({ item }) => {
          const isRead = readItems.has(item.id);
          const isSelected = selectedIds.has(item.id);
          return (
            <TouchableOpacity
              onPress={() => handlePress(item.id)}
              onLongPress={() => setSelectionMode(true)}
              style={[styles.card, isSelected && styles.selectedCard]}
            >
              <Text style={[styles.title, isRead && styles.readTitle]}>{item.title}</Text>
              <Text style={[styles.body, isRead && styles.readBody]}>{item.body}</Text>
              <Text style={styles.date}>{new Date(item.created_at).toLocaleString()}</Text>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <Text style={styles.empty}>No notifications found.</Text>
        }
        ListHeaderComponent={
          <>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Image source={require('../assets/back.png')} style={styles.back} />
            </TouchableOpacity>
  
            <Text style={styles.header}>Notifications</Text>
            <Text style={styles.subHeader}>
              Read: {readCount} | Unread: {unreadCount}
            </Text>
  
            {selectionMode ? (
              <TouchableOpacity
                onPress={handleDeleteSelected}
                style={styles.deleteButton}
              >
                <Text style={styles.deleteText}>Delete ({selectedIds.size})</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={() => setSelectionMode(true)}
                style={styles.selectModeButton}
              >
                <Text style={styles.selectText}>Select</Text>
              </TouchableOpacity>
            )}
          </>
        }
      />
      <Footer />
    </View>
  );
  
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e0cfc7',
    padding: 16,
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#6c4b3c',
    textAlign: 'center',
  },
  subHeader: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    color: '#fff',
    backgroundColor: '#6c4b3c',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedCard: {
    backgroundColor: '#fdd',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  readTitle: {
    fontWeight: 'normal',
  },
  body: {
    fontSize: 14,
    marginTop: 4,
    fontWeight: 'bold',
    color: '#333',
  },
  readBody: {
    fontWeight: 'normal',
  },
  date: {
    fontSize: 12,
    marginTop: 8,
    textAlign: 'right',
    color: '#333',
  },
  back: {
    width: 20,
    height: 20,
    marginRight: 15,
    marginTop: 40,
    marginLeft: 10,
  },
  empty: {
    textAlign: 'center',
    color: '#888',
    marginTop: 40,
    fontSize: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: '#a00',
    padding: 8,
    borderRadius: 8,
    alignSelf: 'center',
    marginBottom: 8,
    marginLeft:270,
  },
  deleteText: {
    color: 'white',
    fontWeight: 'bold',
  },
  selectModeButton: {
    backgroundColor: '#6c4b3c',
    padding: 8,
    borderRadius: 8,
    alignSelf: 'center',
    marginBottom: 8,
    marginLeft:290,
  },
  selectText: {
    color: 'white',
    forEachmat: 'bold',
     backgroundColor: '#6c4b3c',
  },
});

export default NotificationScreen;

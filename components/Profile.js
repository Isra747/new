import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, TextInput, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Footer from './Footer';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Profile = ({ navigation }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // Eye icon state

  useEffect(() => {
    const fetchUserEmail = async () => {
      try {
        const storedEmail = await AsyncStorage.getItem('userEmail');
        if (storedEmail) {
          setEmail(storedEmail);
        }
      } catch (error) {
        console.error('Error fetching stored user email:', error);
      }
    };

    fetchUserEmail();
  }, []);

  useEffect(() => {
    if (!email) return;

    const fetchUserData = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const response = await fetch(`https://u76rpadxda.us-east-1.awsapprunner.com/api/user/${email}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (!response.ok) throw new Error(`HTTP Error! Status: ${response.status}`);

        const data = await response.json();
        console.log('Fetched Data:', data);
        setName(data.name || '');
        setEmail(data.email || '');
        setPassword(data.password || '');
      } catch (error) {
        console.error('Error fetching user data:', error);
        Alert.alert('Error', 'Failed to fetch user data.');
      }
    };

    fetchUserData();
  }, [email]);

  const handleLogout = async () => {
    try {
        await AsyncStorage.removeItem('selectedPet');  // Clear previous pet data
        await AsyncStorage.removeItem('token');        // Clear token
        navigation.navigate("LoginScreen");  // Navigate to login screen
    } catch (error) {
        console.error("Error logging out:", error);
    }
};



  const handleUpdate = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`https://u76rpadxda.us-east-1.awsapprunner.com/api/userupdate/${email}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ name, password }),
      });

      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

      const data = await response.json();
      console.log('Update Response:', data);
      Alert.alert('Success', 'Profile updated successfully');
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile.');
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Image source={require('../assets/back.png')} style={styles.backButton} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.editButton} onPress={() => setIsEditing(!isEditing)}>
        <Icon name="edit" size={24} color="#5a4635" />
      </TouchableOpacity>
      <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Icon name="logout" size={28} color="#5a4635" />
        </TouchableOpacity>
      <Text style={styles.title}>{isEditing ? 'Edit Profile' : 'Profile'}</Text>
      <View style={styles.profileImageContainer}>
        <Image source={require('../assets/profile.jpg')} style={styles.profileImage} />
      </View>
      <View style={styles.infoContainer}>
        <ProfileItem label="Name" value={name} isEditing={isEditing} onChange={setName} />
        <ProfileItem label="Email" value={email} isEditing={false} />
        <PasswordItem 
          password={password} 
          setPassword={setPassword} 
          isEditing={isEditing} 
          showPassword={showPassword} 
          setShowPassword={setShowPassword} 
        />
      </View>
      {isEditing && (
        <TouchableOpacity style={styles.saveButton} onPress={handleUpdate}>
          <Text style={styles.saveButtonText}>Save Changes</Text>
        </TouchableOpacity>
      )}
      <Footer />
    </View>
  );
};

// Name & Email Input Component
const ProfileItem = ({ label, value, isEditing, onChange }) => (
  <View style={styles.profileItem}>
    <Text style={styles.label}>{label}</Text>
    {isEditing ? (
      <TextInput style={styles.input} value={value} onChangeText={onChange} placeholder={`Enter ${label}`} />
    ) : (
      <Text style={styles.value}>{value}</Text>
    )}
  </View>
);

// Password Input with Eye Icon
const PasswordItem = ({ password, setPassword, isEditing, showPassword, setShowPassword }) => (
  <View>
    <View style={styles.passwordContainer}>
    <Text style={styles.label}>Password</Text>
      {isEditing ? (
        <TextInput 
          style={[styles.input, { flex: 1 }]} 
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
        />
      ) : (
        <Text style={[styles.value, { flex: 1 }]}>{showPassword ? password : '••••••••'}</Text>
      )}
      <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
        <Icon name={showPassword ? 'visibility' : 'visibility-off'} size={24} color="#a0765b" />
      </TouchableOpacity>
    </View>
  </View>
);


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e0cfc7',
    padding: 20,
  },
  backButton: {
    width: 20,
    height: 20,
    marginRight: 25,
    marginTop: 33,
  },
  editButton: {
    position: 'absolute',
    top: 295,
    right: 30,
    zIndex: 1,
  },
  logoutButton: {
    position: 'absolute',
    top: 45,
    right: 30,
    zIndex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#6c4b3c',
    textAlign: 'center',
    marginBottom: 20,
    marginTop: 20,
  },
  profileImageContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: '#a0765b',
  },
  infoContainer: {
    marginTop: 50,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  profileItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
    marginBottom: 15,
    alignItems: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6c4b3c',
    flex: 1,
  },
  value: {
    fontSize: 16,
    color: '#333',
    flex: 2,
    textAlign: 'right',
  },
  input: {
    fontSize: 16,
    color: '#333',
    flex: 2,
    textAlign: 'right',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingVertical: 5,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eyeIcon: {
    marginLeft: 10,

  },
  saveButton: {
    backgroundColor: '#6c4b3c',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default Profile;

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Image,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const ActivateFoodDispenserScreen = ({ navigation }) => {
  const [dispenserUUID, setDispenserUUID] = useState('');
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [status, setStatus] = useState('');

  const handlePairDispenser = () => {
    if (dispenserUUID.trim() === '') {
      setErrorModalVisible(true);
    } else {
      navigation.navigate('Pair Iot', { dispenserUUID }); // ✅ Pass UUID to next screen
    }
  };

  const testPetIdSend = async () => {
    try {
      const petString = await AsyncStorage.getItem('selectedPet');
      const userEmail = await AsyncStorage.getItem('userEmail');
      const token = await AsyncStorage.getItem('token');
  
      if (!petString || !userEmail || !token) {
        Alert.alert("Missing Info", "Pet, user, or token not found.");
        return;
      }
  
      const pet = JSON.parse(petString);
      const payload = {
        device_id: dispenserUUID || 'dispenser001',
        pet_id: pet.id,
        user_email: userEmail
      };
  
      setStatus("📡 Sending dispenser info to server...");
      console.log("📦 Payload:", payload);
  
      const response = await axios.post(
        'http://10.211.0.107:3000/api/link-dispenser',
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
  
      if (response.data.success) {
        setStatus("✅ Dispenser linked to pet");
        Alert.alert("✅ Success", "Dispenser linked to pet!");
      } else {
        setStatus("❌ Failed to link dispenser");
        Alert.alert("Success", response.data.message || "Linking failed.");
      }
    } catch (error) {
      console.error("❌ Link Error:", error.message);
    
      if (error.response?.status === 409) {
        Alert.alert("Dispenser Already Linked", error.response.data.error);
      } else {
        Alert.alert("Error", error.response?.data?.error || error.message);
      }
    
      setStatus("❌ Error sending data");
    }
    
  };
  const handleDisconnectDispenser = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const petData = await AsyncStorage.getItem('selectedPet');
      const parsedPet = JSON.parse(petData);
      const petId = parsedPet?.id;
  
      const dispenserId = 'dispenser001'; // ✅ Replace with actual dispenser ID logic

      if (!token || !petId || !dispenserId) {
        Alert.alert("Missing Info", "Login, pet, or dispenser info is missing.");
        return;
      }
  
      const response = await axios.delete('http://10.211.0.107:3000/api/unlink-dispenser', {
        // ✅ send both device_id and pet_id
        data: {
          device_id: dispenserId,
          pet_id: petId,
        },
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
  
      if (response.status === 200) {
        Alert.alert("✅ Dispenser Disconnected", response.data.message);
        setStatus("Dispenser unlinked.");
      } else {
        Alert.alert("Error", "Unexpected server response");
      }
  
    } catch (error) {
      console.error("❌ Unlink Error:", error);
      const msg = error.response?.data?.error || "Failed to unlink Dispenser.";
      Alert.alert("Error", msg);
    }
  };
  
  
  
  
  
  const closeErrorModal = () => setErrorModalVisible(false);

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Image source={require('../assets/back.png')} style={styles.back} />
      </TouchableOpacity>
      <View style={styles.content}>
        <Text style={styles.title}>Let’s activate your Food Dispenser</Text>
        <Text style={styles.subtitle}>
          Ensure the dispenser is within range of the Wi-Fi router
        </Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Food Dispenser</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter Food Dispenser UUID"
            placeholderTextColor="#777777"
            value={dispenserUUID}
            onChangeText={setDispenserUUID}
          />
        </View>

        <Image
          source={require('../assets/128.png')}
          style={styles.dispenserImage}
        />

        <View style={styles.inlineButtons}>
        <TouchableOpacity 
            style={[styles.pairButton, styles.disconnectButton]}
            onPress={handleDisconnectDispenser}
          >
            <Text style={styles.pairButtonText}>Disconnect</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.pairButton, styles.testButton]}
            onPress={testPetIdSend}
          >
            <Text style={styles.pairButtonText}>Test Send Pet ID</Text>
          </TouchableOpacity>
        </View>

        {!!status && <Text style={styles.statusText}>{status}</Text>}
      </View>

      <Modal transparent visible={errorModalVisible} animationType="fade">
        <View style={styles.alertOverlay}>
          <View style={styles.alertBox}>
            <Text style={styles.alertTitle}>Oops!</Text>
            <Text style={styles.alertMessage}>Please enter the Food Dispenser UUID.</Text>
            <TouchableOpacity style={styles.alertButton} onPress={closeErrorModal}>
              <Text style={styles.alertButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e0cfc7',
  },
  content: {
    flex: 1,
    backgroundColor: '#e0cfc7',
    padding: 20,
    alignItems: 'center',
  },
  back: {
    width: 20,
    height: 20,
    marginRight: 25,
    marginTop: 50,
    marginLeft: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'black',
    marginBottom: 7,
    marginRight: 70,
  },
  subtitle: {
    fontSize: 14,
    color: 'black',
    marginBottom: 30,
    marginRight: 100,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 30,
  },
  label: {
    fontSize: 18,
    color: 'black',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  input: {
    height: 45,
    borderRadius: 10,
    backgroundColor: '#F5F0EB',
    color: 'black',
    paddingHorizontal: 15,
    fontSize: 16,
  },
  dispenserImage: {
    width: 400,
    height: 350,
    marginBottom: 10,
  },
  inlineButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginTop: 10,
  },
  pairButton: {
    backgroundColor: '#6c4b3c',
    borderRadius: 30,
    paddingVertical: 12,
    paddingHorizontal: 25,
  },
  testButton: {
    backgroundColor: '#4a3b2c',
  },
  pairButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  statusText: {
    marginTop: 20,
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertBox: {
    width: '80%',
    backgroundColor: '#FFF8F0',
    borderRadius: 20,
    padding: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 10,
  },
  alertTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#5C4033',
    marginBottom: 10,
  },
  alertMessage: {
    fontSize: 16,
    color: 'black',
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: 'bold',
  },
  alertButton: {
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#6c4b3c',
  },
  alertButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default ActivateFoodDispenserScreen;

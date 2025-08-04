import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Image,
  TouchableOpacity,
  Alert,
  Modal,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import WifiManager from 'react-native-wifi-reborn';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';


const ActivateFoodDispenserScreen = ({ navigation }) => {
  const [ssid, setSsid] = useState('');
  const [password, setPassword] = useState('');
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [status, setStatus] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  // Request permissions on component mount
  useEffect(() => {
    requestPermissions();
  }, []);

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
  
      const response = await axios.delete('https://u76rpadxda.us-east-1.awsapprunner.com/api/unlink-dispenser', {
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


  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
        ]);
       
        if (granted['android.permission.ACCESS_FINE_LOCATION'] === PermissionsAndroid.RESULTS.GRANTED) {
          console.log('Location permissions granted');
        } else {
          console.log('Location permissions denied');
          Alert.alert('Permission Required', 'Location permission is required for WiFi scanning');
        }
      } catch (err) {
        console.warn(err);
      }
    }
  };

  const connectToESP32 = async () => {
    try {
      setStatus("Connecting to Food Dispenser...");
      setIsConnecting(true);
     
      console.log("Attempting to connect to Food Dispenser network...");
     
      // Check if already connected to ESP32
      const currentSSID = await WifiManager.getCurrentWifiSSID();
      console.log("Current SSID:", currentSSID);
     
      if (currentSSID === "Dispenser") {
        setStatus("Connected to Food Dispenser ✅");
        return true;
      }
     
      // Connect to ESP32
      await WifiManager.connectToProtectedSSID("Dispenser", "12345678", true);
     
      // Wait a bit for connection to stabilize
      await new Promise(resolve => setTimeout(resolve, 3000));
     
      // Verify connection
      const newSSID = await WifiManager.getCurrentWifiSSID();
      console.log("New SSID after connection:", newSSID);
     
      if (newSSID === "Dispenser") {
        setStatus("Connecting to Food Dispenser ✅");
        return true;
      } else {
        throw new Error("Failed to connect to Food Dispenser network");
      }
    } catch (error) {
      console.error("WiFi Connection Error:", error);
      let errorMsg = "Failed to connect to Food Dispenser: " + error.message;
     
      if (error.message.includes('permission')) {
        errorMsg = "Location permission required. Please grant location permission in settings.";
      } else if (error.message.includes('SSID')) {
        errorMsg = "Food Dispenser network not found. Please ensure Food Dispenser is in setup mode.";
      }
     
      setStatus(errorMsg);
      Alert.alert("Connection Error", errorMsg);
      return false;
    } finally {
      setIsConnecting(false);
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
      const dispenserId = 'dispenser001'; // Or get it dynamically if needed

      const payload = {
        device_id: dispenserId,
        pet_id: pet.id,
        user_email: userEmail
      };
      
  
      setStatus("📡 Sending dispenser info to server...");
      console.log("📦 Payload:", payload);
  
      const response = await axios.post(
        'https://u76rpadxda.us-east-1.awsapprunner.com/api/link-dispenser',
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

  const sendCredentialsToESP32 = async () => {
    try {
      setStatus("Sending Wi-Fi credentials to Food Dispenser...");
     
      // First, test if ESP32 is reachable
      setStatus("Testing Food Dispenser connection...");
      console.log("Testing Food Dispenser connection at: http://192.168.4.1/");
     
      try {
        const testResponse = await axios.get("http://192.168.4.1/", { timeout: 5000 });
        console.log("Food Dispenser Test Response:", testResponse.data);
        setStatus("Food Dispenser is reachable ✅");
      } catch (testError) {
        console.log("Food Dispenser Test Error:", testError.message);
        setStatus("Food Dispenser not reachable. Trying alternative IPs...");
       
        // Try alternative common ESP32 IPs
        const alternativeIPs = ['192.168.4.1', '192.168.1.1', '10.0.0.1'];
        let esp32Reachable = false;
       
        for (const ip of alternativeIPs) {
          try {
            const altResponse = await axios.get(`http://${ip}/`, { timeout: 3000 });
            console.log(`Food Dispenser found at ${ip}:`, altResponse.data);
            setStatus(`Food Dispenser found at ${ip} ✅`);
            esp32Reachable = true;
            break;
          } catch (altError) {
            console.log(`${ip} not reachable:`, altError.message);
          }
        }
       
        if (!esp32Reachable) {
          throw new Error("Food Dispenser not found on any common IP address");
        }
      }
     
      // Try different common ESP32 endpoints
      const endpoints = [
        '/credentials',
        '/wifi',
        '/setup',
        '/config',
        '/'
      ];
     
      let success = false;
      let lastError = null;
     
      for (const endpoint of endpoints) {
        try {
          console.log(`Trying endpoint: http://192.168.4.1${endpoint}`);
          setStatus(`Trying endpoint: ${endpoint}...`);
         
          // Try different data formats
          const dataFormats = [
            { ssid, password }, // JSON format
            { ssid: ssid, password: password }, // Explicit JSON
            `ssid=${ssid}&password=${password}`, // Form data
            JSON.stringify({ ssid, password }) // Stringified JSON
          ];
         
          for (let i = 0; i < dataFormats.length; i++) {
            try {
              const data = dataFormats[i];
              const headers = i < 2 ? {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              } : {
                'Content-Type': 'application/x-www-form-urlencoded'
              };
             
              console.log(`Trying format ${i + 1} with endpoint ${endpoint}`);
             
              const response = await axios.post(
                `http://192.168.4.1${endpoint}`,
                data,
                {
                  timeout: 10000,
                  headers
                }
              );
             
              console.log(`Success with endpoint ${endpoint}, format ${i + 1}:`, response.data);
              setStatus(`Success with endpoint ${endpoint}, format ${i + 1} ✅`);
              success = true;
             
              
      if (response.data === "Connected" || response.status === 200) {
        setStatus("Food Dispenser Connected to Wi-Fi ✅");
        Alert.alert("Success", "Food Dispenser connected successfully!");

        await testPetIdSend(); // ✅ Call backend link here

        return; // ✅ Exit the whole function
      }

             
              break; // If this format worked, don't try others
             
            } catch (formatError) {
              console.log(`Format ${i + 1} failed:`, formatError.message);
            }
          }
         
          if (success) break; // If endpoint worked, don't try others
         
        } catch (error) {
          console.log(`Failed with endpoint ${endpoint}:`, error.message);
          lastError = error;
        }
      }
     
      if (!success) {
        throw lastError || new Error("All endpoints failed");
      }
     
    } catch (error) {
      console.error("Food Dispenser Connection Error:", error);
      let errorMessage = "Failed to communicate with Food Dispenser.";
     
      if (error.code === 'ECONNREFUSED') {
        errorMessage = "Food Dispenser not found. Please ensure  is powered on and in setup mode.";
      } else if (error.code === 'ENOTFOUND') {
        errorMessage = "Cannot reach Food Dispenser. Please check if you're connected to Food Dispenser network.";
      } else if (error.code === 'ETIMEDOUT') {
        errorMessage = "Connection timeout. Please try again.";
      }
     
      setStatus("Failed to send credentials: " + error.message);
      Alert.alert("Connection Error", errorMessage);
    }
  };
  const handleProvision = async () => {
    if (isConnecting) return;
  
    // ✅ If BOTH fields empty → relink only
    if (ssid.trim() === '' && password.trim() === '') {
      console.log("SSID + password empty → skip Wi-Fi, relink only");
      setStatus("Linking dispenser to pet...");
      await testPetIdSend();
      return;
    }
  
    // ✅ If only ONE is empty → show error modal
    if (ssid.trim() === '' || password.trim() === '') {
      setErrorModalVisible(true);
      return;
    }
  
    // ✅ Else → do full provision
    console.log("Starting provision process...");
    console.log("SSID:", ssid);
    console.log("Password length:", password.length);
  
    const connected = await connectToESP32();
    if (connected) {
      console.log("WiFi connected → sending credentials...");
      setTimeout(sendCredentialsToESP32, 2000);
    } else {
      Alert.alert(
        "Connection Failed",
        "Could not connect to Food Dispenser WiFi network. Please check if Food Dispenser is in setup mode."
      );
    }
  };
  

  const closeErrorModal = () => setErrorModalVisible(false);

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()}>
             <Image source={require('../assets/back.png')} style={styles.back} />
           </TouchableOpacity>
      <View style={styles.content}>
        <Text style={styles.title}>Let's activate your Food Dispenser</Text>
        <Text style={styles.subtitle}>
          Ensure the dispenser is powered on and in setup mode
        </Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Wi-Fi Network Name (SSID)</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your Wi-Fi name"
            placeholderTextColor="#777777"
            value={ssid}
            onChangeText={setSsid}
            editable={!isConnecting}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Wi-Fi Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your Wi-Fi password"
            placeholderTextColor="#777777"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            editable={!isConnecting}
          />
        </View>

        <Image
          source={require('../assets/128.png')}
          style={styles.dispenserImage}
          resizeMode="contain"
        />
  <View style={styles.inlineButtons}>
  <TouchableOpacity 
                    style={[styles.pairButton, styles.disconnectButton]}
                    onPress={handleDisconnectDispenser}
                  >
                    <Text style={styles.pairButtonText}>Disconnect</Text>
                  </TouchableOpacity>
        <TouchableOpacity
          style={[styles.pairButton, isConnecting && styles.disabledButton]}
          onPress={handleProvision}
          disabled={isConnecting}
        >
          <Text style={styles.pairButtonText}>
            {isConnecting ? "Connecting..." : "Pair"}
          </Text>
        </TouchableOpacity>

        {!!status && <Text style={styles.statusText}>{status}</Text>}
        
                  </View>
      </View>

      <Modal transparent visible={errorModalVisible} animationType="fade">
        <View style={styles.alertOverlay}>
          <View style={styles.alertBox}>
            <Text style={styles.alertTitle}>Missing Information</Text>
            <Text style={styles.alertMessage}>
              Please enter both your Wi-Fi network name and password to continue.
            </Text>
            <TouchableOpacity
              style={styles.alertButton}
              onPress={closeErrorModal}
            >
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
    padding:2
  },
  content: {
    flex: 1,
    backgroundColor: '#e0cfc7',
    padding: 20,
    marginTop: 0,
    alignItems: 'center',
  },
  back: {
    width: 20,
    height: 20,
    marginRight: 25,
    marginTop: 45,
    marginLeft: 20,
  },
  title: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: 'black',
    marginBottom: 7, 
    marginRight: 10, 
    marginLeft:-43 
  },
  subtitle: {
    fontSize: 14,
    color: 'black',
    marginBottom: 30,
    marginRight: 100,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 12,
  },
  label: {
    fontSize: 18,
    color: 'black',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  inlineButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 30,
    marginTop: -20,
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
  pairButton: {
    backgroundColor: '#6c4b3c',
    borderRadius: 30,
    paddingVertical: 12,
    paddingHorizontal: 25,
  },
  disabledButton: {
    opacity: 0.6,
  },
  pairButtonText: {
    color: '#fff',
    fontSize: 16,
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
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    margin: 20,
    alignItems: 'center',
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: 'black',
  },
  alertMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
  },
  alertButton: {
    backgroundColor: '#6c4b3c',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  alertButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ActivateFoodDispenserScreen;
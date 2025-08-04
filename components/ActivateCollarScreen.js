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
import Icon from 'react-native-vector-icons/MaterialIcons';
import WifiManager from 'react-native-wifi-reborn';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';



const ActivateCollarScreen = ({ navigation }) => {
  const [ssid, setSsid] = useState('');
  const [password, setPassword] = useState('');
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [status, setStatus] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);


  // Request permissions on component mount
  useEffect(() => {
    requestPermissions();
  }, []);
  const [deviceId, setDeviceId] = useState('collar001'); // or dynamically load if needed

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

  const handleDisconnectCollar = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const petData = await AsyncStorage.getItem('selectedPet');
      const parsedPet = JSON.parse(petData);
      const petId = parsedPet?.id;
  
      if (!token || !petId) {
        Alert.alert("Missing Info", "Login or pet selection is missing.");
        return;
      }
  
      const response = await axios.delete('https://u76rpadxda.us-east-1.awsapprunner.com/api/unlink-collar', {
        // ✅ send both device_id and pet_id
        data: {
          device_id: deviceId,
          pet_id: petId,
        },
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
  
      if (response.status === 200) {
        Alert.alert("✅ Collar Disconnected", response.data.message);
        setStatus("Collar unlinked.");
      } else {
        Alert.alert("Error", "Unexpected server response");
      }
  
    } catch (error) {
      console.error("❌ Unlink Error:", error);
      const msg = error.response?.data?.error || "Failed to unlink collar.";
      Alert.alert("Error", msg);
    }
  };
  

  const connectToESP32 = async () => {
    try {
      setStatus("Connecting to Collar...");
      setIsConnecting(true);
      
      console.log("Attempting to connect to Collar network...");
      
      // Check if already connected to ESP32
      const currentSSID = await WifiManager.getCurrentWifiSSID();
      console.log("Current SSID:", currentSSID);
      
      if (currentSSID === "Collar") {
        setStatus("Connected to Collar");
        return true;
      }
      
      // Connect to ESP32
      await WifiManager.connectToProtectedSSID("Collar", "12345678", true);
      
      // Wait a bit for connection to stabilize
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Verify connection
      const newSSID = await WifiManager.getCurrentWifiSSID();
      console.log("New SSID after connection:", newSSID);
      
      if (newSSID === "Collar") {
        setStatus("Connecting to Collar ✅");
        return true;
      } else {
        throw new Error("Failed to connect to Collar network");
      }
    } catch (error) {
      console.error("WiFi Connection Error:", error);
      let errorMsg = "Failed to connect to Collar: " + error.message;
      
      if (error.message.includes('permission')) {
        errorMsg = "Location permission required. Please grant location permission in settings.";
      } else if (error.message.includes('SSID')) {
        errorMsg = "Collar network not found. Please ensure Collar is in setup mode.";
      }
      
      setStatus(errorMsg);
      Alert.alert("Connection Error", errorMsg);
      return false;
    } finally {
      setIsConnecting(false);
    }
  };



  const testLinkCollar = async () => {
    try {
      const petData = await AsyncStorage.getItem('selectedPet');
      const parsedPet = JSON.parse(petData);
      console.log("🐾 Selected Pet (raw):", petData);
  
      const petId = parsedPet?.id; // ✅ use 'id' here, not 'pet_id'
  
      if (!petId) {
        Alert.alert("Missing Pet", "No pet selected. Please select a pet profile first.");
        return;
      }
  
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert("Missing Token", "Please log in again.");
        return;
      }
  
      const response = await axios.post('https://u76rpadxda.us-east-1.awsapprunner.com/api/link-collar', {
        device_id: 'collar001', // or 'mqtt' — must match your ESP32 identifier
        pet_id: petId,
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
  
      if (response.status === 200) {
        Alert.alert("✅ Success", "Collar successfully linked to pet!");
      } else {
        Alert.alert("Error", "Unexpected response from server.");
      }
    } catch (error) {
      //console.error("❌ Test Link Collar Error:", error);
      const errorMsg = error.response?.data?.error || "Something went wrong.";
    
      if (error.response?.status === 409) {
        Alert.alert("Collar In Use", errorMsg);
      } else {
        Alert.alert("Error", errorMsg);
      }
    }
    
  };
  
  
  








  const sendCredentialsToESP32 = async () => {
    try {
      setStatus("Sending Wi-Fi credentials to Collar...");
      
      // First, test if ESP32 is reachable
      setStatus("Testing Collar connection...");
      console.log("Testing Collar connection at: http://192.168.4.1/");
      
      try {
        const testResponse = await axios.get("http://192.168.4.1/", { timeout: 5000 });
        console.log("Collar Test Response:", testResponse.data);
        setStatus("Collar is reachable ✅");
      } catch (testError) {
        console.log("Collar Test Error:", testError.message);
        setStatus("Collar not reachable. Trying alternative IPs...");
        
        // Try alternative common ESP32 IPs
        const alternativeIPs = ['192.168.4.1', '192.168.1.1', '10.0.0.1'];
        let esp32Reachable = false;
        
        for (const ip of alternativeIPs) {
          try {
            const altResponse = await axios.get(`http://${ip}/`, { timeout: 3000 });
            console.log(`Collar found at ${ip}:`, altResponse.data);
            setStatus(`Collar found at ${ip} ✅`);
            esp32Reachable = true;
            break;
          } catch (altError) {
            console.log(`${ip} not reachable:`, altError.message);
          }
        }
        
        if (!esp32Reachable) {
          throw new Error("Collar not found on any common IP address");
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
      a
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
                setStatus("Collar Connected to Wi-Fi ✅");
                Alert.alert("Success", "Collar connected successfully!");
                return;
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
      console.error("Collar Connection Error:", error);
      let errorMessage = "Failed to communicate with device.";
      
      if (error.code === 'ECONNREFUSED') {
        errorMessage = "Collar not found. Please ensure Collar is powered on and in setup mode.";
      } else if (error.code === 'ENOTFOUND') {
        errorMessage = "Cannot reach device. Please check if you're connected to Collar network.";
      } else if (error.code === 'ETIMEDOUT') {
        errorMessage = "Connection timeout. Please try again.";
      }
      
      setStatus("Failed to send credentials: " + error.message);
      Alert.alert("Connection Error", errorMessage);
    }
  };

  const handleProvision = async () => {
    if (ssid.trim() === '' || password.trim() === '') {
      setErrorModalVisible(true);
      return;
    }
  
    if (isConnecting) return;
  
    console.log("Starting provision process...");
    console.log("SSID:", ssid);
    console.log("Password length:", password.length);
    
    const connected = await connectToESP32();
    if (connected) {
      console.log("WiFi connected successfully, sending credentials...");
      
      setTimeout(async () => {
        await sendCredentialsToESP32(); // send Wi-Fi details
        
        // 🟢 Automatically try to link collar after credentials are sent
        setTimeout(async () => {
          console.log("🧪 Automatically testing collar linking...");
          await testLinkCollar();
        }, 2000); // small delay to ensure Wi-Fi reconnect happens
      }, 2000);
      
    } else {
      console.log("WiFi connection failed");
      Alert.alert("Connection Failed", "Could not connect to Collar WiFi network. Please check if Collar is in setup mode.");
    }
  };
  

  const closeErrorModal = () => setErrorModalVisible(false);

  return (
    <View style={styles.container}>
       <TouchableOpacity onPress={() => navigation.goBack()}>
        <Image source={require('../assets/back.png')} style={styles.back} />
      </TouchableOpacity>
      <View style={styles.content}>
        <Text style={styles.title}>Let’s activate your Collar</Text>
        <Text style={styles.subtitle}>
          Make sure the collar is within range of Wi-Fi router
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
  <View style={styles.passwordWrapper}>
    <TextInput
      style={[styles.input, { flex: 1 }]}
      placeholder="Enter your Wi-Fi password"
      placeholderTextColor="#777777"
      secureTextEntry={!showPassword}
      value={password}
      onChangeText={setPassword}
      editable={!isConnecting}
    />
    <TouchableOpacity
      onPress={() => setShowPassword(!showPassword)}
      style={styles.eyeIcon}
    >
      <Icon name={showPassword ? 'visibility' : 'visibility-off'} size={22} color="#6c4b3c" />
    </TouchableOpacity>
  </View>
</View>

        <Image
          source={require('../assets/123.png')}
          style={styles.collarImage}
          resizeMode="contain"
        />
<View style={styles.inlineButtons}>
  <TouchableOpacity 
    style={[styles.pairButton, styles.disconnectButton]}
    onPress={handleDisconnectCollar}
  >
    <Text style={styles.pairButtonText}>Disconnect</Text>
  </TouchableOpacity>

  {/* <TouchableOpacity 
    style={[styles.pairButton, isConnecting && styles.disabledButton]}
    onPress={handleProvision}
    disabled={isConnecting}
  >
    <Text style={styles.pairButtonText}>
      {isConnecting ? "Connecting..." : "Pair"}
    </Text>
  </TouchableOpacity> */}

<TouchableOpacity 
  style={[styles.pairButton, { marginTop: 10 }]} 
  onPress={testLinkCollar}
>
<Text style={styles.pairButtonText}> Link Collar</Text>
</TouchableOpacity> 
</View>

        



        {!!status && <Text style={styles.statusText}>{status}</Text>}
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

  inlineButtons: {
    flexDirection: 'row',
    justifyContent: 'center', // center both buttons horizontally
    alignItems: 'center',
    gap: 10, // add spacing between buttons (React Native 0.71+)
    marginTop: -20,
  },
  
  pairButton: {
    backgroundColor: '#6c4b3c',
    borderRadius: 30,
    paddingVertical: 12,
    paddingHorizontal: 30, // ✅ Reduce width so both fit in one row
  },
  
  disconnectButton: {
    backgroundColor: '#8b0000',
    marginRight: 0, // ✅ remove custom margin
    paddingHorizontal: 30,
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
    marginRight: 145,
    marginTop:-10
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
  input: {
    height: 45,
    borderRadius: 10,
    backgroundColor: '#F5F0EB',
    color: 'black',
    paddingHorizontal: 15,
    fontSize: 16,
  },
  collarImage: {
    width: 400,
    height: 350,
    marginBottom: 10,
  },
 
  disabledButton: {
    opacity: 0.6,
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
  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F0EB',
    borderRadius: 10,
    paddingRight: 10,
  },
  eyeIcon: {
    paddingHorizontal: 5,
    paddingVertical: 8,
  },  
});

export default ActivateCollarScreen;
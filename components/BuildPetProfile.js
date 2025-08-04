import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet,Image, Alert, Modal } from 'react-native';

const BuildPetProfile = ({ navigation }) => {
  const [petName, setPetName] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const currentStep = 1; 
  const totalSteps = 7;

  const progressWidth = `${(currentStep / totalSteps) * 100}%`;

  const handleNext = () => {
    if (petName.trim() === '') {
      setShowAlert(true); 
    } else {
      navigation.navigate('SelectPetTypeScreen', { petName });
    }
  };

  const closeAlert = () => {
    setShowAlert(false); 
  };

  return (
    <View style={styles.container}>
        <TouchableOpacity onPress={() => navigation.goBack()}> 
        <Image
                        source={require('../assets/back.png')}
                        style={styles.back}
                    />
        </TouchableOpacity>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { width: progressWidth }]} />
      </View>

      <Text style={styles.title}>First things first, what’s your pet’s name?</Text>
      <TextInput
  style={styles.input}
  placeholder="Enter name"
  placeholderTextColor="#A9A9A9"
  value={petName}
  onChangeText={(text) => {
    const filteredText = text.replace(/[^A-Za-z\s]/g, ""); // Only letters and spaces
    const words = filteredText.trim().split(/\s+/);
  
    if (words.length <= 2) {
      setPetName(filteredText);
    } else {
      Alert.alert("Invalid Input", "You can't add more than 2 words for the pet's name.");
    }
  }}
  
/>

        <TouchableOpacity
        style={styles.button}
        onPress={handleNext}
      >
        <Text style={styles.buttonText}>Next</Text>
      </TouchableOpacity>

      <Modal transparent visible={showAlert} animationType="fade">
        <View style={styles.alertOverlay}>
          <View style={styles.alertBox}>
            <Text style={styles.alertTitle}>Oops!</Text>
            <Text style={styles.alertMessage}>Please enter your pet’s name to proceed.</Text>
            <TouchableOpacity style={styles.alertButton} onPress={closeAlert}>
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
    justifyContent: 'left',
    alignItems: 'left',
    padding: 20,
  },
  progressBarContainer: {
    width: '100%',
    height: 10,
    backgroundColor: '#E0E0E0',
    borderRadius: 5,
    marginBottom: 20,
    overflow: 'hidden',
    marginTop:70
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#6c4b3c',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4A4A4A',
    textAlign: 'left',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: '#A9A9A9',
    paddingHorizontal: 5,
    marginBottom: 20,
    fontSize: 16,
    color: 'black', 
    marginTop:20
  },
  button: {
    backgroundColor: '#6c4b3c',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginTop:350
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    alignContent:'center',
    alignSelf:'center',
    fontSize: 16,
  },
  back:{
    width: 20,
    height: 20,
    marginTop:30
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
    padding: 20,
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
    color: '#8B4513',
    marginBottom: 10,
  },
  alertMessage: {
    fontSize: 16,
    color: '#4A4A4A',
    textAlign: 'center',
    marginBottom: 20,
  },
  alertButton: {
    backgroundColor: '#8B4513',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 15,
  },
  alertButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
});

export default BuildPetProfile;
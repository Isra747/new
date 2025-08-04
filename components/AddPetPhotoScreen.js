import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Modal } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/Feather';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AddPetPhotoScreen = ({ navigation, route }) => {
  const { petName, petType, gender, selectedBreed, birthday, weight } = route.params;
  const birthdayDate = new Date(birthday);

  const [petImage, setPetImage] = useState(null);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const currentStep = 7;
  const totalSteps = 7;
  const progressWidth = `${(currentStep / totalSteps) * 100}%`;

  // Function to select image from the gallery
  const selectImage = () => {
    launchImageLibrary({ mediaType: 'photo', quality: 1 }, (response) => {
      if (response.assets && response.assets.length > 0) {
        setPetImage(response.assets[0].uri); // Save the selected image URI
      }
    });
  };

  // Function to send pet data to API
  const handleNext = async () => {
    setIsLoading(true);
    setMessage('');

    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        setMessage('User not authenticated');
        setIsLoading(false);
        return;
      }

      // Prepare FormData for the image and other pet data
      const petData = new FormData();
      petData.append('name', petName);
      petData.append('type', petType);
      petData.append('gender', gender);
      petData.append('breed', selectedBreed);
      petData.append('date', birthdayDate.toISOString());
      petData.append('weight', weight);

      // If image is selected, append it to FormData
      if (petImage) {
        const uriParts = petImage.split('.');
        const fileType = uriParts[uriParts.length - 1];
        petData.append('petimage', {
          uri: petImage,
          type: `image/${fileType}`,
          name: `petimage.${fileType}`,
        });
      }

      // Make API call to add pet
      const response = await fetch('https://u76rpadxda.us-east-1.awsapprunner.com/api/pets', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: petData,
      });

      const result = await response.json();
      if (response.ok) {
        setMessage('Pet added successfully!');
        setModalVisible(true);
      } else {
        setMessage(result.error || 'Failed to add pet.');
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage('Error occurred while adding pet.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.topContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Image source={require('../assets/back.png')} style={styles.back} />
        </TouchableOpacity>
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: progressWidth }]} />
        </View>
      </View>

      <View style={styles.text}>
        <Text style={styles.title}>All Done!</Text>
        <Text style={styles.title}>{petName}'s profile is all set.</Text>
        <Text style={styles.subtitle}>Upload a picture of {petName}</Text>
      </View>

      <Image source={petImage ? { uri: petImage } : require('../assets/bcat.png')} style={styles.cat} />

      <TouchableOpacity style={styles.selectButton} onPress={selectImage}>
        <Icon name="plus" size={20} color="white" style={styles.icon} />
        <Text style={styles.selectButtonText}>Select Photo</Text>
      </TouchableOpacity>

      {message ? <Text style={styles.messageText}>{message}</Text> : null}

      <TouchableOpacity style={styles.nextButton} onPress={handleNext} disabled={isLoading}>
        <Text style={styles.nextButtonText}>{isLoading ? 'Loading...' : 'Next'}</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Success!</Text>
            <Text style={styles.modalMessage}>{petName} has been added successfully.</Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setModalVisible(false);
                navigation.navigate('Home');
              }}>
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#e0cfc7', padding: 20 },
  topContainer: { flexDirection: 'row', alignItems: 'flex-start', width: '100%', marginTop: 40 },
  back: { width: 20, height: 20, marginRight: 25 },
  progressBarContainer: { flex: 1, height: 10, backgroundColor: '#E0E0E0', borderRadius: 5, marginTop: 5, overflow: 'hidden' },
  progressBar: { height: '100%', backgroundColor: '#6c4b3c' },
  title: { fontSize: 22, fontWeight: 'bold', color: 'black' },
  subtitle: { fontSize: 18, fontWeight: '400', color: 'black' },
  cat: { width: 150, height: 150, alignSelf: 'center', marginTop: 100 },
  text: { marginTop: 50 },
  selectButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#8d624e', paddingVertical: 12, borderRadius: 0, alignSelf: 'center', width: 160, marginTop: 2 },
  icon: { marginRight: 10 },
  selectButtonText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  nextButton: { backgroundColor: '#6c4b3c', paddingVertical: 15, borderRadius: 30, alignItems: 'center', marginTop: 180 },
  nextButtonText: { fontSize: 18, fontWeight: '600', color: '#fff' },
  messageText: { marginTop: 10, fontSize: 16, color: 'red', textAlign: 'center' },
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' },
  modalContent: { width: 300, backgroundColor: 'white', padding: 20, borderRadius: 10, alignItems: 'center' },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: 'green' },
  modalMessage: { fontSize: 16, marginVertical: 10, textAlign: 'center' },
  modalButton: { backgroundColor: '#8B4513', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 5, marginTop: 10 },
  modalButtonText: { fontSize: 16, color: 'white' },
});

export default AddPetPhotoScreen;

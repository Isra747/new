import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet , Alert} from 'react-native';

const PetWeightScreen = ({ navigation, route }) => {
  const { petName, birthday, petType, gender, selectedBreed } = route.params; // Receiving all data from previous screen
  const [weight, setWeight] = useState('');
  const birthdayDate = new Date(birthday); // Convert the birthday string back to Date

  const currentStep = 6;
  const totalSteps = 7;
  const progressWidth = `${(currentStep / totalSteps) * 100}%`;

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

      <Text style={styles.title}>How much does {petName} weight?</Text>

      <TextInput
  style={styles.input}
  placeholder="Enter weight in kg"
  keyboardType="numeric"
  value={weight}
  onChangeText={(text) => {
    // Remove everything except digits and dots
    let filteredText = text.replace(/[^0-9.]/g, '');
  
    // Prevent multiple decimal points
    const dotCount = (filteredText.match(/\./g) || []).length;
    if (dotCount > 1) {
      Alert.alert("Invalid Input", "Only one decimal point is allowed.");
      return;
    }
  
    setWeight(filteredText);
  }}
  
/>

      <TouchableOpacity
        style={[styles.button, !weight && styles.disabledButton]}
        onPress={() =>
          navigation.navigate('AddPetPhotoScreen', {
            petName,
            petType,
            gender,
            selectedBreed,
            birthday: birthdayDate.toISOString(), // Convert to string
            weight
          })
          
        }
        disabled={!weight}
      >
        <Text style={styles.buttonText}>Next</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e0cfc7',
    padding: 20,
  },
  topContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: '100%',
    marginTop: 40,
  },
  back: {
    width: 20,
    height: 20,
    marginRight: 25,
  },
  progressBarContainer: {
    flex: 1,
    height: 10,
    backgroundColor: '#E0E0E0',
    borderRadius: 5,
    marginTop: 5,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#6c4b3c',
  },
  title: {
    marginTop: 50,
    textAlign: 'left',
    fontSize: 22,
    fontWeight: '600',
    color: 'black',
    marginBottom: 15,
  },
  input: {
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: '#A9A9A9',
    paddingHorizontal: 5,
    marginBottom: 20,
    fontSize: 16,
    color: 'black',
    marginTop: 20,
  },
  button: {
    backgroundColor: '#6c4b3c',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginTop: 450,
  },
  disabledButton: {
    backgroundColor: '#8d624e',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    alignSelf: 'center',
    fontSize: 16,
  },
});

export default PetWeightScreen;
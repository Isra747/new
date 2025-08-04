import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';

const SelectPetGenderScreen = ({ navigation, route }) => {
  const { petName, petType } = route.params;
  const [selectedGender, setSelectedGender] = useState(null);

  const currentStep = 3; 
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

      <Text style={styles.title}>Choose {petName}'s Gender</Text>
      <View style={styles.genderContainer}>
        <TouchableOpacity
          style={[
            styles.genderOption,
            selectedGender === 'male' && styles.selectedOption,
          ]}
          onPress={() => setSelectedGender('male')}
        >
          <Image
            source={require('../assets/Male.png')}
            style={styles.genderImage}
          />
          <Text style={styles.genderText}>Male</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.genderOption,
            selectedGender === 'female' && styles.selectedOption,
          ]}
          onPress={() => setSelectedGender('female')}
        >
          <Image
            source={require('../assets/Female.png')}
            style={styles.genderImage}
          />
          <Text style={styles.genderText}>Female</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        style={[styles.button, !selectedGender && styles.disabledButton]}
        onPress={() =>
          navigation.navigate('SelectPetBreedScreen', {
            petName,
            petType,
            gender: selectedGender,
          })
        }
        disabled={!selectedGender}
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
    marginTop: 30,
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4A4A4A',
    textAlign: 'left',
    marginBottom: 20,
    marginTop: 80,
  },
  genderContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop:40,
    marginBottom: 30,
  },
  genderOption: {
    alignItems: 'center',
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: '#E3D6D0',
    borderRadius: 10,
    padding: 20,
  },
  selectedOption: {
    borderColor: '#8B4513',
  },
  genderImage: {
    width: 80,
    height: 80,
    marginBottom: 10,
  },
  genderText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4A4A4A',
  },
  button: {
    backgroundColor: '#6c4b3c',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginTop: 230,
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

export default SelectPetGenderScreen;

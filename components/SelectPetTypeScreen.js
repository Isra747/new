import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';

const SelectPetTypeScreen = ({ navigation, route }) => {
  const [selectedType, setSelectedType] = useState(null);
  const petName = route?.params?.petName || 'Your pet'; 
  const currentStep = 2; 
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

      <Text style={styles.title}>{petName} is a...</Text>
      <View style={styles.optionsContainer}>
       
        <TouchableOpacity
          style={[styles.option, selectedType === 'dog' && styles.selectedOption]}
          onPress={() => setSelectedType('dog')}
        >
          <Image source={require('../assets/dog.png')} style={styles.petImage} />
          <Text style={styles.optionText}>Dog</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.option, selectedType === 'cat' && styles.selectedOption]}
          onPress={() => setSelectedType('cat')}
        >
          <Image source={require('../assets/cat.png')} style={styles.petImage} />
          <Text style={styles.optionText}>Cat</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.button, !selectedType && styles.disabledButton]}
        onPress={() =>
          navigation.navigate('SelectPetGenderScreen', { petType: selectedType, petName })
        }
        disabled={!selectedType}
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
    marginBottom: 20,
    overflow: 'hidden',
    marginTop: 5, 
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
    marginTop:70
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginBottom: 30,
    width: '100%',
    marginTop:40
  },
  option: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    padding: 15,
    backgroundColor: '#FFFFFF',
  },
  selectedOption: {
    borderColor: '#8B4513',
    backgroundColor: '#FAF3EC',
  },
  petImage: {
    width: 100,
    height: 100,
    marginBottom: 10,
  },
  optionText: {
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

export default SelectPetTypeScreen;
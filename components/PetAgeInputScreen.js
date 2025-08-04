import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

const PetAgeInputScreen = ({ navigation, route }) => {
  // Destructure the passed params from the route
  const { petName, petType, gender, selectedBreed } = route.params;

  const initialDate = new Date(); // Set the initial date
  const [date, setDate] = useState(initialDate);
  const [showPicker, setShowPicker] = useState(false);
  const [isDateSelected, setIsDateSelected] = useState(false); // Track if the date is selected

  const currentStep = 5;
  const totalSteps = 7;
  const progressWidth = `${(currentStep / totalSteps) * 100}%`;

  const handleDateChange = (event, selectedDate) => {
    setShowPicker(false);
    if (selectedDate) {
      setDate(selectedDate);
      setIsDateSelected(true); // Mark the date as selected
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

      {/* Using the passed petName here */}
      <Text style={styles.title}>When is {petName}'s Birthday?</Text>
      <Text style={styles.subtitle}>(If unknown, approximate date will do)</Text>

      <TouchableOpacity>
        <Image source={require('../assets/bcat.png')} style={styles.cat} />
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setShowPicker(true)} style={styles.datePicker}>
        <Text style={styles.dateText}>{date.toDateString()}</Text>
      </TouchableOpacity>

      {showPicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="spinner"
          onChange={handleDateChange}
          maximumDate={new Date()}
        />
      )}

      <TouchableOpacity
        style={[styles.nextButton, !isDateSelected && styles.disabledButton]} // Disable if date is not selected
        onPress={() =>
          navigation.navigate('PetWeightScreen', {
            petName,
            petType,
            gender,
            selectedBreed,
            birthday: date.toISOString(), // Convert date to ISO string before passing
          })
        }
        disabled={!isDateSelected} // Only enable when date is selected
      >
        <Text style={styles.nextButtonText}>Next</Text>
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
  subtitle: {
    fontSize: 16,
    textAlign: 'left',
    color: '#777',
    marginBottom: 30,
  },
  datePicker: {
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: '#A9A9A9',
    paddingHorizontal: 5,
    marginBottom: 20,
    fontSize: 16,
    color: 'black',
    marginTop: 20,
  },
  dateText: {
    fontSize: 18,
    marginTop: 10,
    textAlign: 'center',
    alignContent: 'center',
    justifyContent: 'center',
  },
  nextButton: {
    backgroundColor: '#6c4b3c',
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 150,
  },
  disabledButton: {
    backgroundColor: '#8d624e',
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  cat: {
    width: 150,
    height: 150,
    marginBottom: 20,
    alignSelf: 'center',
    marginTop: 90,
  },
});

export default PetAgeInputScreen;

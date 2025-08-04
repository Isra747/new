import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';

const AccountCreatedScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your account has been {'\n'}created!</Text>
      <Text style={styles.subtitle}>
        To make the most out of PetProtect, we’ll{'\n'}get to know your pet better. Tap below and{'\n'}share details.
      </Text>
      <Image source={require('../assets/1.png')} style={styles.image} />
      
  
      <View style={styles.buttonsContainer}>
      <TouchableOpacity
          style={[styles.cancelButton, styles.flexButton]}
          onPress={() => navigation.goBack()}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.flexButton]}
          onPress={() => navigation.navigate('BuildPetProfile')}>
          <Text style={styles.buttonText}>Build Pet Profile</Text>
        </TouchableOpacity>
        
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e0cfc7',
    justifyContent: 'flex-start',
    padding: 20,
  },
  image: {
    width: 150,
    height: 150,
    marginBottom: 30,
    alignSelf: 'center',
    marginTop: 150,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'black',
    marginBottom: 10,
    marginTop: 60,
  },
  subtitle: {
    fontSize: 16,
    color: 'black',
    marginBottom: 40,
    marginTop: 10,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 50,
  },
  flexButton: {
    flex: 1,
    marginHorizontal: 5, // Adds spacing between buttons
  },
  button: {
    backgroundColor: '#6c4b3c',
    paddingVertical: 17,
    borderRadius: 25,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelButton: {
    borderColor: '#6c4b3c',
    borderWidth: 1,
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#6c4b3c',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default AccountCreatedScreen;

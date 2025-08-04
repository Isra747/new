import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';

const Welcome = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <View style={styles.main}>
        <Image
          source={require('../assets/paw1.png')}
          style={styles.pawImage1}
        />
        <Text style={styles.title}>
          Monitor your Pet's{'\n'}health anytime,{'\n'}anywhere.
        </Text>
        <Text style={styles.quote}>
          "A healthy pet is a happy pet!"
        </Text>
        <Image
          source={require('../assets/paw.png')}
          style={styles.pawImage}
        />
      </View>
      <Text style={styles.subtitle}>Let's create your PetProtect account:</Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('SignupScreen')}
      >
        <View style={styles.buttonContent}>
          <Image
            source={require('../assets/mail.png')}
            style={styles.buttonImage}
       
          />
          <Text style={styles.buttonText}>Continue with Email</Text>
        </View>
      </TouchableOpacity>
      <Text style={styles.terms}>
        By creating an account you agree to PetProtect's {'\n'}terms of service & EULA.
      </Text>
      <Text style={styles.loginText}>
        Already have an account?{' '}
        <Text
          style={styles.loginLink}
          onPress={() => navigation.navigate('LoginScreen')}
        >
          Log in
        </Text>
      </Text>
      <TouchableOpacity
        style={styles.learnMoreButton}
        onPress={() => navigation.navigate('Food Dispenser')}
      >
        <Text style={styles.learnMoreText}>Learn More</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e0cfc7',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    padding: 20,
  },
  title: {
    fontSize: 25,
    fontWeight: 'bold',
    textAlign: 'left',
    marginTop: 0,
  },
  quote: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#7a5c44',
    marginTop: 8,
    marginBottom: 8,
    textAlign: 'left',
  },
  main: {
    marginTop: 60,
  },
  pawImage1: {
    width: 80,
    height: 75,
    marginHorizontal: 140,
    marginBottom: -18,
  },
  pawImage: {
    width: 110,
    height: 110,
    marginHorizontal: 180,
    marginTop: -65,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 20,
    marginTop: 290,
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#6c4b3c',
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 25,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonImage: {
    width: 24,
    height: 24,
    marginRight: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  terms: {
    fontSize: 12,
    textAlign: 'left',
    color: '#666',
    marginBottom: 20,
  },
  loginText: {
    fontSize: 14,
    color: 'black',
  },
  loginLink: {
    color: '#6c4b3c',
    fontWeight: 'bold',
    fontSize: 16,
  },
  learnMoreButton: {
    marginTop: 18,
    alignSelf: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: '#6c4b3c',
  },
  learnMoreText: {
    color: '#6c4b3c',
    fontWeight: 'bold',
    fontSize: 15,
  },
});

export default Welcome;

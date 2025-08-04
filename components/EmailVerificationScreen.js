import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Linking, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const EmailVerificationScreen = ({ route }) => {
  const navigation = useNavigation();
  const { email } = route.params;
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(false);

  const openEmailApp = async () => {
    setLoading(true);
  
    try {
      const gmailURL = 'googlegmail://inbox';
      const outlookURL = 'ms-outlook://';
      const yahooURL = 'ymail://';
      const appleMailURL = 'message://'; // iOS only
  
      const supportedUrls = [gmailURL, outlookURL, yahooURL, appleMailURL];
  
      let opened = false;
  
      for (const url of supportedUrls) {
        const canOpen = await Linking.canOpenURL(url);
        if (canOpen) {
          await Linking.openURL(url);
          opened = true;
          break;
        }
      }
  
      if (!opened) {
        // Last fallback - open Gmail in browser
        await Linking.openURL('https://mail.google.com/');
        alert("Opened Gmail in browser. Or check manually.");
      }
    } catch (error) {
      alert("No email app found!");
    }
  
    setTimeout(() => {
      setLoading(false);
      navigation.navigate('LoginScreen');
    }, 1000);
  };
  
  


  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Image source={require('../assets/back.png')} style={styles.back} />
      </TouchableOpacity>

      <View style={styles.formContainer}>
        <Text style={styles.title}>
          {isVerified ? "Email Verified!" : "We've sent you an email."}
        </Text>

        <Text style={styles.subtitle}>
          {isVerified 
            ? "Redirecting to login screen..." 
            : "Confirm your account by tapping the button in the email. \nMake sure you refresh and check the spam folder."
          }
        </Text>

        <Image source={require('../assets/dog.png')} style={styles.image} />

        {loading ? (
          <ActivityIndicator size="large" color="#8B4513" />
        ) : (
          <TouchableOpacity style={styles.button} onPress={openEmailApp}>
            <Text style={styles.buttonText}>Open Email App</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#e0cfc7', padding: 20, marginTop: 30 },
  formContainer: { padding: 20, width: '100%', maxWidth: 400, borderRadius: 10, marginTop: 10 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, textAlign: 'left' },
  subtitle: { fontSize: 16, textAlign: 'left', color: '#666', marginBottom: 20 },
  image: { width: 150, height: 150, marginBottom: 30, alignSelf: 'center', marginTop: 150 },
  button: { backgroundColor: '#5C4033', paddingVertical: 15, paddingHorizontal: 30, borderRadius: 25, marginTop: 90 },
  buttonText: { color: 'white', fontWeight: 'bold', alignSelf: 'center', fontSize: 16 },
  back: { width: 20, height: 20, marginBottom: 20 },
});

export default EmailVerificationScreen;

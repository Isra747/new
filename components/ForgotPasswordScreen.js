import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Image } from 'react-native';

const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert("Error", "Please enter your email.");
      return;
    }
    
    setLoading(true);

    try {
      const response = await fetch('https://u76rpadxda.us-east-1.awsapprunner.com/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      setLoading(false);

      if (response.ok) {
        Alert.alert("Success", "Verification code sent to your email.");
        setCodeSent(true); // Move to enter code step
      } else {
        Alert.alert("Error", data.message || "Failed to send verification code.");
      }
    } catch (error) {
      setLoading(false);
      Alert.alert("Error", "Something went wrong. Please try again.");
    }
  };

  const handleVerifyCode = async () => {
    if (!code) {
      Alert.alert("Error", "Please enter the verification code.");
      return;
    }
  
    setLoading(true);
  
    try {
      const response = await fetch('https://u76rpadxda.us-east-1.awsapprunner.com/api/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });
  
      const data = await response.json();
      setLoading(false);
  
      if (response.ok) {
        Alert.alert("Success", "Code verified successfully.");
        navigation.navigate('ResetPassword', { email, code });
      } else {
        Alert.alert("Error", data.message || "Invalid verification code. Please try again.");
      }
    } catch (error) {
      setLoading(false);
      Alert.alert("Error", "Something went wrong. Please try again.");
    }
  };
  

  return (
    <View style={styles.container}>
       <TouchableOpacity onPress={() => navigation.goBack()}>
                      <Image source={require('../assets/back.png')} style={styles.back} />
                    </TouchableOpacity>
      <Text style={styles.title}>Forgot Password</Text>
      <Text style={styles.subtitle}>Enter your email to receive a verification code.</Text>

      <TextInput
        style={styles.input}
        placeholder="Enter Email"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
      />

      {codeSent && (
        <TextInput
          style={styles.input}
          placeholder="Enter Verification Code"
          keyboardType="numeric"
          value={code}
          onChangeText={setCode}
        />
      )}

      <TouchableOpacity
        style={[styles.button, loading && styles.disabledButton]}
        onPress={codeSent ? handleVerifyCode : handleForgotPassword}
        disabled={loading}
      >
        {loading ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>{codeSent ? "Verify Code" : "Send Code"}</Text>}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#e0cfc7', padding: 20,  },
  title: { fontSize: 22, fontWeight: 'bold', color: '#4A4A4A', marginBottom: 5, marginTop:270},
  subtitle: { fontSize: 14, color: '#4A4A4A', marginBottom: 20, },
  input: { width: '100%', padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#E0E0E0', marginBottom: 15, backgroundColor: '#FFFFFF' },
  button: { backgroundColor: '#6c4b3c', paddingVertical: 15, borderRadius: 25, alignItems: 'center' },
  disabledButton: { backgroundColor: '#A9A9A9' },
  buttonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  back: {
    width: 20,
    height: 20,
    marginRight: 25,
    top:35
  },
});

export default ForgotPasswordScreen;


import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    const loadRememberedEmail = async () => {
      const savedEmail = await AsyncStorage.getItem('rememberedEmail');
      if (savedEmail) {
        setEmail(savedEmail);
        setRememberMe(true);
      }
    };
    loadRememberedEmail();
  }, []);

  const validateEmail = (email) => {
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return regex.test(email);
  };

  const validateInputs = () => {
    let valid = true;

    if (!email || !validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      valid = false;
    } else {
      setEmailError('');
    }

    if (!password || password.length < 6) {
      setPasswordError('Password must be at least 6 characters long');
      valid = false;
    } else {
      setPasswordError('');
    }

    return valid;
  };

  const handleLogin = async () => {
    if (!validateInputs()) return;

    setLoading(true);
    try {
      const response = await fetch('https://u76rpadxda.us-east-1.awsapprunner.com/api/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      setLoading(false);

      if (response.ok && data.access_token) {
        await AsyncStorage.setItem('token', data.access_token);
        await AsyncStorage.setItem('userEmail', email);

        if (rememberMe) {
          await AsyncStorage.setItem('rememberedEmail', email);
        } else {
          await AsyncStorage.removeItem('rememberedEmail');
        }

        Alert.alert("Success", "Login Successful!", [
          {
            text: "OK",
            onPress: () => {
              if (data.hasPets) {
                navigation.navigate('Home');
              } else {
                navigation.navigate('AccountCreatedScreen');
              }
            }
          }
        ]);
      } else {
        Alert.alert("Error", data.message || "Login failed");
      }
    } catch (error) {
      setLoading(false);
      console.error('Login error:', error);
      Alert.alert("Error", "Something went wrong. Please try again.");
    }
  };

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword', { email });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Log in</Text>
      <Text style={styles.subtitle}>Fill in your PetProtect user details</Text>

      <View style={styles.main}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#6D5D5B"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            if (emailError) setEmailError('');
          }}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#6D5D5B"
            secureTextEntry={!passwordVisible}
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (passwordError) setPasswordError('');
            }}
          />
          <TouchableOpacity onPress={() => setPasswordVisible(!passwordVisible)} style={styles.icon}>
            <Ionicons name={passwordVisible ? 'eye' : 'eye-off'} size={24} color="#6D5D5B" />
          </TouchableOpacity>
        </View>
        {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
      </View>

      <View style={styles.rememberMeContainer}>
        <TouchableOpacity onPress={() => setRememberMe(!rememberMe)}>
          <Ionicons name={rememberMe ? 'checkbox' : 'square-outline'} size={24} color="#6D5D5B" />
        </TouchableOpacity>
        <Text style={styles.rememberMeText}>Remember Me</Text>
      </View>

      <TouchableOpacity onPress={handleForgotPassword}>
        <Text style={styles.forgotPassword}>Forgot password?</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
        {loading ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Log in</Text>}
      </TouchableOpacity>

      <Text style={styles.signUpText}>
        Don't have an account?{' '}
        <Text style={styles.signUpLink} onPress={() => navigation.navigate('SignupScreen')}>
          Sign Up
        </Text>
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E3D6D0',
    justifyContent: 'flex-start',
    padding: 20,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    marginTop: 90,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: 'black',
    marginBottom: 20,
  },
  main: {
    marginTop: 50,
  },
  input: {
    backgroundColor: '#F5F0EB',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    marginTop: 20,
    color: '#6D5D5B',
  },
  passwordContainer: {
    position: 'relative',
  },
  icon: {
    position: 'absolute',
    right: 15,
    top: 28,
  },
  forgotPassword: {
    textAlign: 'right',
    color: '#5C4033',
    marginBottom: 20,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 10,
  },
  rememberMeText: {
    marginLeft: 10,
    color: '#6D5D5B',
  },
  button: {
    backgroundColor: '#6c4b3c',
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 100,
    marginBottom: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  signUpText: {
    textAlign: 'center',
    color: '#6c4b3c',
  },
  signUpLink: {
    color: '#5C4033',
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginBottom: 10,
    textAlign: 'left',
  },
});

export default LoginScreen;
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  StyleSheet,
  Modal,
  ScrollView,
} from 'react-native';
import { CheckBox } from 'react-native-elements';

const SignupScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isChecked, setIsChecked] = useState(false);
  const [showPolicy, setShowPolicy] = useState(false);

  // Strong Form Validation
  const validateForm = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Name is required.');
      return false;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address.');
      return false;
    }

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      Alert.alert('Error', 'Password must be at least 8 characters long and include at least one number and alphabet.');
      return false;
    }

    if (!isChecked) {
      Alert.alert('Error', 'You must accept the policy to proceed.');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
  
    try {
      const response = await fetch('https://u76rpadxda.us-east-1.awsapprunner.com/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
  
      const data = await response.json(); 
  
      if (response.ok) {
        Alert.alert('Success', data.message);
        navigation.navigate('EmailVerificationScreen', { email });
      } else {
        Alert.alert('Error', data.message || 'Signup failed.');
      }
  
    } catch (error) {
      console.error("Signup Error:", error);
    
      if (error.code === 'ER_DUP_ENTRY') {
        // Duplicate email — handled gracefully
        return res.status(400).json({ message: 'An account with this email already exists.' });
      }
    
      // Default error fallback
      return res.status(500).json({ message: 'Failed to register. Please try again later.' });
    }
    
  };
  

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Image source={require('../assets/back.png')} style={styles.back} />
      </TouchableOpacity>

      <View style={styles.formContainer}>
        <Text style={styles.title}>Your PetProtect account details:</Text>

        <View style={styles.in}>
          <TextInput
            placeholder="Name"
            value={name}
            onChangeText={setName}
            style={styles.input}
          />
          <TextInput
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            keyboardType="email-address"
          />
          <TextInput
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            style={styles.input}
            secureTextEntry
          />
        </View>

        <Text style={styles.terms}>
          By signing up to PetProtect, you agree to our{' '}
          <Text style={styles.policyLink} onPress={() => setShowPolicy(true)}>
            Terms of Service & EULA
          </Text>.
        </Text>

        <View style={styles.checkboxContainer}>
          <CheckBox
            checked={isChecked}
            onPress={() => setIsChecked(!isChecked)}
            checkedColor="#8B4513"
          />
          <Text style={styles.checkboxText}>I have read and accept the policy</Text>
        </View>

        <TouchableOpacity
          style={[styles.button, !isChecked && styles.disabledButton]}
          onPress={handleSubmit}
          disabled={!isChecked}
        >
          <Text style={styles.buttonText}>Next</Text>
        </TouchableOpacity>
      </View>

      {/* Policy Modal */}
      <Modal visible={showPolicy} animationType="slide">
        <View style={styles.modalContainer}>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.modalTitle}>Terms of Service & EULA</Text>
            <Text style={styles.modalText}>
  • By using PetProtect, you agree to monitor your pet responsibly and acknowledge that this app is a support tool—not a replacement for professional veterinary care.{"\n\n"}
  • The app collects and stores data such as your pet’s heart rate, temperature, motion activity, and vaccination schedules to help you care for your pet.{"\n\n"}
  • All information is stored securely and never shared with third parties without your consent.{"\n\n"}
  • Misuse of the app or providing false data may lead to limited functionality or account restrictions.
</Text>


            <TouchableOpacity onPress={() => setShowPolicy(false)} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e0cfc7',
    padding: 20,
    marginTop: 30,
  },
  formContainer: {
    padding: 20,
    width: '100%',
    maxWidth: 400,
    borderRadius: 10,
    marginTop: 40,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  input: {
    backgroundColor: '#E3E3E3',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  in: {
    marginTop: 30,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 15,
  },
  checkboxText: {
    fontSize: 14,
    color: '#5C4033',
  },
  terms: {
    fontSize: 12,
    color: '#666',
    marginBottom: 10,
  },
  policyLink: {
    textDecorationLine: 'underline',
    color: '#5C4033',
  },
  button: {
    backgroundColor: '#5C4033',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#a0765b',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  back: {
    width: 20,
    height: 20,
    marginRight: 25,
  },
  modalContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  modalContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 30,
  },
  closeButton: {
    backgroundColor: '#5C4033',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default SignupScreen;
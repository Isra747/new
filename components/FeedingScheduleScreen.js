import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal,
  Alert, Image, FlatList, TextInput
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import axios from 'axios';

const timeSlots = {
  morning: ['01:41 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM'],
  afternoon: ['12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'],
  night: ['6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM', '10:00 PM', '11:00 PM']
};

const FeedingScheduleScreen = ({ navigation }) => {
  const [morningTime, setMorningTime] = useState('');
  const [afternoonTime, setAfternoonTime] = useState('');
  const [nightTime, setNightTime] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [petId, setPetId] = useState(null);
  const [isUpdateMode, setIsUpdateMode] = useState(false);
  const [manualTime, setManualTime] = useState('');
  const originalSchedule = useRef({});

  useFocusEffect(
    useCallback(() => {
      const fetchPetAndSchedule = async () => {
        const storedPet = await AsyncStorage.getItem('selectedPet');
        const token = await AsyncStorage.getItem('token');

        if (storedPet && token) {
          const parsedPet = JSON.parse(storedPet);
          setPetId(parsedPet.id);

          try {
            const res = await fetch(`https://u76rpadxda.us-east-1.awsapprunner.com/api/feeding-schedule/${parsedPet.id}`, {
              headers: {
                Authorization: `Bearer ${token}`
              }
            });

            if (res.ok) {
              const data = await res.json();
              if (data.schedule) {
                setIsUpdateMode(true);
                setMorningTime(data.schedule.morning);
                setAfternoonTime(data.schedule.afternoon);
                setNightTime(data.schedule.night);
                originalSchedule.current = {
                  morning: data.schedule.morning,
                  afternoon: data.schedule.afternoon,
                  night: data.schedule.night
                };
              } else {
                setIsUpdateMode(false);
                setMorningTime('');
                setAfternoonTime('');
                setNightTime('');
                originalSchedule.current = {};
              }
            }
          } catch (error) {
            console.log('Failed to fetch:', error);
          }
        }
      };

      fetchPetAndSchedule();
    }, [])
  );

  const openTimeSelection = (period) => {
    setSelectedPeriod(period);
    setModalVisible(true);
  };

  const handleSelectTime = (time) => {
    if (selectedPeriod === 'morning') setMorningTime(time);
    if (selectedPeriod === 'afternoon') setAfternoonTime(time);
    if (selectedPeriod === 'night') setNightTime(time);
    setModalVisible(false);
  };

  const convertTo24Hour = (input) => {
    const time = input.trim().toUpperCase();
  
    // Match 12-hour format: "4:30 PM", "11:15 AM"
    const match12 = time.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/);
    if (match12) {
      let [_, hour, minute, period] = match12;
      hour = parseInt(hour, 10);
      if (period === 'PM' && hour < 12) hour += 12;
      if (period === 'AM' && hour === 12) hour = 0;
      return `${String(hour).padStart(2, '0')}:${minute}`;
    }
  
    // Match 24-hour format: "04:30", "16:30"
    const match24 = time.match(/^([01]?[0-9]|2[0-3]):([0-5][0-9])$/);
    if (match24) {
      return `${String(match24[1]).padStart(2, '0')}:${match24[2]}`;
    }
  
    throw new Error("Invalid time format");
  };
  
  const handleManualSend = async () => {
    if (!manualTime) {
      Alert.alert('Input Required', 'Please enter a time like 4:30 PM');
      return;
    }
  
    try {
      const converted = convertTo24Hour(manualTime.trim());
      const cmd = `set ${converted}`;
  
      // 🟢 Call backend API to publish via MQTT
      const response = await axios.post('https://u76rpadxda.us-east-1.awsapprunner.com/api/manual-set', {
        command: cmd
      });
  
      console.log('Published via backend:', cmd);
      Alert.alert('Success', `Sent: ${cmd}`);
      setManualTime('');
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to send command. Please enter a valid time like 4:30 PM');
    }
  };
  
  const handleSubmit = async () => {
    if (!morningTime || !afternoonTime || !nightTime || !petId) {
      setErrorModalVisible(true);
      return;
    }
  
    try {
      const token = await AsyncStorage.getItem('token');
  
      const response = await axios.post("https://u76rpadxda.us-east-1.awsapprunner.com/api/feeding-schedule", {
        petId,
        morning: morningTime,
        afternoon: afternoonTime,
        night: nightTime
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
  
      console.log('Schedule response:', response.data);
      setSuccessModalVisible(true);
    } catch (error) {
      console.error('Error saving schedule:', error);
      Alert.alert('Error', 'Something went wrong while updating the schedule.');
    }
  };
  

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Image source={require('../assets/back.png')} style={styles.back} />
      </TouchableOpacity>
       <Image source={require("../assets/paw3.png")} style={styles.topRightImage} resizeMode="contain" />
        <Image source={require("../assets/paw3.png")} style={styles.bottomLeftImage} resizeMode="contain" />

      <View style={styles.content}>
        <Text style={styles.title}>Set Feeding Schedule</Text>
        <Text style={styles.subtitle}>Choose feeding times for your pet</Text>

        <Text style={styles.label}>Morning</Text>
        <TouchableOpacity style={styles.dropdown} onPress={() => openTimeSelection('morning')}>
          <Text style={styles.dropdownText}>{morningTime || 'Select Time'}</Text>
        </TouchableOpacity>

        <Text style={styles.label}>Afternoon</Text>
        <TouchableOpacity style={styles.dropdown} onPress={() => openTimeSelection('afternoon')}>
          <Text style={styles.dropdownText}>{afternoonTime || 'Select Time'}</Text>
        </TouchableOpacity>

        <Text style={styles.label}>Night</Text>
        <TouchableOpacity style={styles.dropdown} onPress={() => openTimeSelection('night')}>
          <Text style={styles.dropdownText}>{nightTime || 'Select Time'}</Text>
        </TouchableOpacity>

        <Text style={styles.label}>Test Manual Feeding Time</Text>
        <View style={styles.manualInputRow}>
          <TextInput
            style={styles.manualInput}
            placeholder="e.g. 4:30 PM"
            placeholderTextColor="#888"
            value={manualTime}
            onChangeText={setManualTime}
          />
          <TouchableOpacity style={styles.manualButton} onPress={handleManualSend}>
            <Text style={styles.manualButtonText}>Send</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.addButton} onPress={handleSubmit}>
          <Text style={styles.addButtonText}>
            {isUpdateMode ? 'Update Schedule' : 'Add Schedule'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Time Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Select Time</Text>
            <FlatList
              data={timeSlots[selectedPeriod]}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.modalItem} onPress={() => handleSelectTime(item)}>
                  <Text style={styles.modalItemText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.closeButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal visible={successModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Image source={require('../assets/124.png')} style={styles.checkIcon} />
            <Text style={styles.modalTitle}>Schedule {isUpdateMode ? 'Updated' : 'Added'} Successfully!</Text>
            <TouchableOpacity style={styles.closeButton} onPress={() => setSuccessModalVisible(false)}>
              <Text style={styles.closeButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Error Modal */}
      <Modal transparent visible={errorModalVisible} animationType="fade">
        <View style={styles.alertOverlay}>
          <View style={styles.alertBox}>
            <Text style={styles.alertTitle}>Oops!</Text>
            <Text style={styles.alertMessage}>Please select all feeding times.</Text>
            <TouchableOpacity style={styles.alertButton} onPress={() => setErrorModalVisible(false)}>
              <Text style={styles.alertButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#e0cfc7', padding: 20 },
  title: { fontSize: 18, fontWeight: 'bold', color: 'black', marginBottom: 7 },
  subtitle: { fontSize: 14, color: 'black', marginBottom: 30 },
  label: { fontSize: 16, color: 'black', fontWeight: 'bold', marginBottom: 5 ,zIndex:10},
  dropdown: {
    width: '100%', height: 45, backgroundColor: '#F5F0EB',
    borderRadius: 10, justifyContent: 'center', paddingHorizontal: 15, marginBottom: 20,zIndex:1
  },
  dropdownText: { color: 'black', fontSize: 16 , zIndex:10},
  addButton: {
    backgroundColor: '#6c4b3c', borderRadius: 30, marginTop: 20,
    paddingVertical: 12, paddingHorizontal: 5, marginLeft: 150
  },
  addButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
  back: { width: 20, height: 20, marginRight: 25, marginTop: 30, marginBottom: 100 },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center',
  },
  modalContainer: {
    width: 300, backgroundColor: '#E3D6D0', borderRadius: 15, padding: 20, alignItems: 'center', elevation: 10,
  }, topRightImage: {
    width: 250,
    height: 250,
    position: 'absolute',
    top: 10,
    right: -140,
},
bottomLeftImage: {
  width: 250,
  height: 250,
  position: 'absolute',
  bottom: 20,
  left: -30,
  zIndex: 0,
},

  checkIcon: { width: 50, height: 50, marginBottom: 15, tintColor: '#6c4b3c' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: 'black', marginBottom: 20 },
  modalItem: { padding: 10, borderBottomWidth: 1, borderBottomColor: '#6c4b3c', width: '100%' },
  modalItemText: { fontSize: 16, color: 'black', textAlign: 'center' },
  closeButton: { marginTop: 15, marginLeft: 200 },
  closeButtonText: { color: 'black', fontSize: 14, fontWeight: 'bold' },
  alertOverlay: {
    flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center',
  },
  alertBox: {
    width: '80%', backgroundColor: '#FFF8F0', borderRadius: 20, padding: 14, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 10,
  },
  alertTitle: { fontSize: 20, fontWeight: 'bold', color: '#5C4033', marginBottom: 10 },
  alertMessage: {
    fontSize: 16, color: 'black', textAlign: 'center', marginBottom: 20, fontWeight: 'bold',
  },
  alertButton: {
    borderRadius: 10, marginTop: -10, paddingHorizontal: 20, paddingVertical: 10, marginLeft: 200,
  },
  alertButtonText: { color: 'black', fontWeight: 'bold', fontSize: 14, textAlign: 'center' },
  content: { flex: 1, backgroundColor: '#e0cfc7', padding: 20, marginTop: 30 },
  manualInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  manualInput: {
    flex: 1,
    backgroundColor: '#F5F0EB',
    borderRadius: 10,
    paddingHorizontal: 15,
    height: 45,
    fontSize: 16,
    color: 'black',
  },
  manualButton: {
    backgroundColor: '#6c4b3c',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginLeft: 10,
  },
  manualButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default FeedingScheduleScreen;
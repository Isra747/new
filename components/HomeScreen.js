import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Alert, TextInput, ScrollView, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedProps, withTiming, Easing } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/native';
import Footer from './Footer';
import PetHeader from './PetHeader';
import FloatingActionButton from './FloatingActionButton';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import VaccinationDetails from './VaccinationDetails';
import ActivateFoodDispenserScreen from './ActivateFoodDispenserScreen';


const alertFlags = {
  lowTemp: false,
  highTemp: false,
  lowHeartRate: false,
  highHeartRate: false,
  injury: false,
};


const sendAlert = async (title, body) => {
  try {
    // Get Expo push token from AsyncStorage
    let expoPushToken = await AsyncStorage.getItem('expoPushToken');
    // Get user_email from AsyncStorage
    let user_email = await AsyncStorage.getItem('user_email');
    if (!user_email) {
      // Try to get from selectedPet if available
      const selectedPet = await AsyncStorage.getItem('selectedPet');
      if (selectedPet) {
        const parsedPet = JSON.parse(selectedPet);
        user_email = parsedPet.user_email || '';
      }
    }
    // Attach latest sensor data for context
    let sensorData = {};
    try {
      sensorData = await AsyncStorage.getItem('latestSensorData');
      if (sensorData) sensorData = JSON.parse(sensorData);
      else sensorData = {};
    } catch {}
    // Try to send remote push notification via backend
    let remoteSent = false;
    if (expoPushToken) {
      try {
        await axios.post('https://u76rpadxda.us-east-1.awsapprunner.com/api/send-push-alert', {
          token: expoPushToken,
          title,
          body,
          user_email,
          data: sensorData,
        });
        remoteSent = true;
      } catch (e) {
        console.log('Failed to send remote push notification:', e);
      }
    }
    // Fallback: Schedule local notification if remote push fails
    if (!remoteSent) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: true,
        },
        trigger: null,
      });
    }
    // Also send to backend for DB logging
    await axios.post('https://u76rpadxda.us-east-1.awsapprunner.com/notifications', {
      title,
      body,
      user_email,
      data: sensorData,
    });
  } catch (e) {
    console.log('Failed to send notification (local/DB):', e);
  }
};

const checkAlerts = async (sensorData, heartRateValue, alertFlags, type, age) => {
  const range = getVitalsRange(type, age);
  if (!range) return;

  const tempStatus = getStatusLabel(sensorData.temperature_f, range.temperature);
  const heartRateStatus = getStatusLabel(heartRateValue, range.heartRate);

  // ✅ Reset flags when vitals return to normal
  if (tempStatus === 'Normal') {
    alertFlags.lowTemp = false;
    alertFlags.highTemp = false;
  }

  if (heartRateStatus === 'Normal') {
    alertFlags.lowHeartRate = false;
    alertFlags.highHeartRate = false;
  }

  if (sensorData.motion_state !== 'HIT/CRASH') {
    alertFlags.injury = false;
  }

  // ✅ Trigger alerts when abnormal condition is detected

  if (tempStatus === 'Low' && !alertFlags.lowTemp) {
    alertFlags.lowTemp = true;
    await sendAlert('🥶 Low Temperature Alert!', 'Your pet\'s temperature is dangerously low.');
  }

  if (tempStatus === 'High' && !alertFlags.highTemp) {
    alertFlags.highTemp = true;
    await sendAlert('🌡️ High Temperature Alert!', 'Your pet\'s temperature is too high.');
  }

  if (heartRateStatus === 'Low' && !alertFlags.lowHeartRate) {
    alertFlags.lowHeartRate = true;
    await sendAlert('💓 Low Heart Rate Alert!', 'Your pet\'s heart rate is dangerously low.');
  }

  if (heartRateStatus === 'High' && !alertFlags.highHeartRate) {
    alertFlags.highHeartRate = true;
    await sendAlert('💓 High Heart Rate Alert!', 'Your pet\'s heart rate is too high.');
  }

  if (
    sensorData.motion_state === 'HIT/CRASH' &&
    heartRateStatus === 'High' &&
    !alertFlags.injury
  ) {
    alertFlags.injury = true;
    await sendAlert('🚨 Injury Alert!', 'Potential injury detected with high heart rate.');
  }
};


const getDueSoonVaccines = (schedule, statuses) => {
 const today = new Date();
 const sevenDaysLater = new Date();
 sevenDaysLater.setDate(today.getDate() + 7);

 return schedule.filter((vaccine) => {
 const status = statuses[vaccine.key] || "Pending";
 if (status === "Done") return false;

 const dueDate = new Date(vaccine.next);
 return dueDate >= today && dueDate <= sevenDaysLater;
 });
};

const DOG_VACCINES = [
 { key: "DHPP_1", name: "DHPP", dose: 1, given: "2025-07-05", next: "2025-07-19" },
 { key: "DHPP_2", name: "DHPP", dose: 2, given: "2025-07-19", next: "2025-08-02" },
 { key: "DHPP_RABIES_3", name: "DHPP + Rabies", dose: 3, given: "2025-08-02", next: "2026-08-02" },
 { key: "DHPP_RABIES_4", name: "DHPP + Rabies", dose: 4, given: "2026-08-02", next: "2029-08-02" },
 { key: "DHPP_RABIES_5", name: "DHPP + Rabies", dose: 5, given: "2029-08-02", next: "2032-08-02" },
];

const CAT_VACCINES = [
 { key: "FVRCP_1", name: "FVRCP", dose: 1, given: "2025-07-03", next: "2025-07-24" },
 { key: "FVRCP_2", name: "FVRCP", dose: 2, given: "2025-07-24", next: "2025-08-13" },
 { key: "FVRCP_3", name: "FVRCP", dose: 3, given: "2025-08-13", next: "2026-08-13" },
 { key: "FVRCP_4", name: "FVRCP", dose: 4, given: "2026-08-13", next: "2029-08-13" },
 { key: "RABIES_1", name: "Rabies", dose: 1, given: "2025-07-03", next: "2026-07-03" },
 { key: "RABIES_2", name: "Rabies", dose: 2, given: "2026-07-03", next: "2029-07-03" },
];

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// Table for heart rate and temperature ranges (°F) by species and age group
const VITALS_TABLE = {
 cat: [
 { group: 'Kitten', minAge: 0, maxAge: 1, heartRate: [200, 260], temp: [100.4, 102.9] },
 { group: 'Adult', minAge: 1, maxAge: 8, heartRate: [140, 220], temp: [100.4, 102.9] },
 { group: 'Senior', minAge: 8, maxAge: 100, heartRate: [120, 180], temp: [100.4, 102.9] },
 ],
 dog: [
 { group: 'Puppy', minAge: 0, maxAge: 1, heartRate: [160, 220], temp: [99.5, 102.6] },
 { group: 'Adult', minAge: 1, maxAge: 8, heartRate: [70, 120], temp: [99.5, 102.6] },
 { group: 'Senior', minAge: 8, maxAge: 100, heartRate: [50, 100], temp: [99.5, 102.6] },
 ],
};

// Returns { heartRate: [low, high], temperature: [low, high] } for the given type and age (in years)
const getVitalsRange = (type, age) => {
 //console.log("🐾 Getting vitals for:", type, "Age:", age);
 const table = VITALS_TABLE[type?.toLowerCase()];
 if (!table) {
 console.warn("⚠️ Invalid pet type:", type);
 return { heartRate: [60, 140], temperature: [101.0, 102.5] };
 }

 for (const row of table) {
 if (age >= row.minAge && age < row.maxAge) {
 //console.log("🎯 Matched group:", row.group, row.heartRate);
 return { heartRate: row.heartRate, temperature: row.temp };
 }
 }

 console.warn("⚠️ No matching group found. Using fallback.");
 return { heartRate: [60, 140], temperature: [101.0, 102.5] };
};



const getStatusLabel = (value, [low, high]) => {
 if (value < low) return 'Low';
 if (value > high) return 'High';
 return 'Normal';
};

const HomeScreen = ({ navigation }) => {
 useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const notifData = response.notification.request.content.data;
    });
    return () => subscription.remove();
  }, []);
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        // 1. Fetch latest sensor data from backend
        const response = await fetch('https://u76rpadxda.us-east-1.awsapprunner.com/api/motion-data/latest');
        const sensorData = await response.json();
        const heartRate = sensorData.heart_rate;
  
        // Save to AsyncStorage for sendAlert
        await AsyncStorage.setItem('latestSensorData', JSON.stringify(sensorData));
  
        // 2. Get pet info
        const petString = await AsyncStorage.getItem('selectedPet');
        const pet = JSON.parse(petString);
        const type = pet?.type;
        const age = pet?.age;
  
        // 3. Run alert check
        if (sensorData && heartRate && type && age) {
          await checkAlerts(sensorData, heartRate, alertFlags, type, age);
        }
      } catch (err) {
        console.log('❌ Monitoring error:', err);
      }
    }, 5000); // Check every 5 seconds
  
    return () => clearInterval(interval); // Cleanup
  }, []);
  

  

 const name = "Buddy";
const [age, setAge] = useState(null);
const [isCollarConnected, setIsCollarConnected] = useState(false);
const [isDispenserConnected, setIsDispenserConnected] = useState(false);
const [isSevereCrash, setIsSevereCrash] = useState(false);
const [feedingStatusList, setFeedingStatusList] = useState([]);



const [petType, setPetType] = useState(null);
 const image = require('../assets/pet.jpg');

 // State for sensor data
 const [sensorData, setSensorData] = useState({
 temperature_f: 0,
 motion_state: 'Stable', // Can be 'Stable', 'Motion', or 'Hit/Crash'
 loading: true,
 error: null
 });

 // Dummy data for heart rate
 const [heartRateValue, setHeartRateValue] = useState(0); // Dynamic value now
 const [alertSent, setAlertSent] = useState(false);
 const [vaccineStatuses, setVaccineStatuses] = useState({});
const [dueSoonVaccines, setDueSoonVaccines] = useState([]);



 // Use the upper bound of the pet's normal heart rate as the max for animation
 const [vitalsRange, setVitalsRange] = useState({
 heartRate: [60, 140],
 temperature: [101.0, 102.5],
});
 const [heartRateStatus, setHeartRateStatus] = useState('--');
 const [temperatureStatus, setTemperatureStatus] = useState('--');
 const heartRateMaxValue = vitalsRange.heartRate[1];
 
 function convertTo24Hour(input) {
  const time = input.trim().toUpperCase();
  const match12 = time.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/);
  if (match12) {
    let [_, hour, minute, period] = match12;
    hour = parseInt(hour);
    if (period === 'PM' && hour < 12) hour += 12;
    if (period === 'AM' && hour === 12) hour = 0;
    return `${String(hour).padStart(2, '0')}:${minute}`;
  }

  const match24 = time.match(/^([01]?[0-9]|2[0-3]):([0-5][0-9])$/);
  if (match24) {
    return `${String(match24[1]).padStart(2, '0')}:${match24[2]}`;
  }

  return input;
}

 // Calculate activity percentage based on motion state
 const getActivityValue = (motionState) => {
 switch(motionState) {
 case 'STABLE': return 10;
 case 'MOVING': return 65;
 case 'HIT/CRASH': return 95;
 default: return 1;
 }
 };
 const activityValue = getActivityValue(sensorData.motion_state);
 const activityMaxValue = 100;

 // Get color based on motion state
 const getActivityColor = (motionState) => {
 switch(motionState) {
 case 'Stable': return 'green';
 case 'Motion': return 'blue'; // blue
 case 'Hit/Crash': return 'red';
 default: return 'green';
 }
 };
 //const isSevereCrash = sensorData.motion_state === 'HIT/CRASH' && heartRateValue > 160;

 const activityColor = getActivityColor(sensorData.motion_state);

 const [isEditing, setIsEditing] = useState(false);
 const [feedingTimes, setFeedingTimes] = useState([]);
 const [petId, setPetId] = useState(null);
 
 const heartRateProgress = useSharedValue(2 * Math.PI * 45);
 const temperatureProgress = useSharedValue(2 * Math.PI * 45);
 const activityProgress = useSharedValue(2 * Math.PI * 45);

 const calculateProgress = (value, maxValue) => {
 const circumference = 2 * Math.PI * 45;
 const safeValue = Math.max(0, Math.min(value, maxValue));
 return circumference - (safeValue / maxValue) * circumference;
 };

const getStatusColor = (status) => {
 if (status === 'Low' || status === 'High') return 'red'; // 🔴 for both
 return 'green'; // ✅ Normal
};

const fetchFeedingSchedule = async (petId, token) => {
  try {
    const response = await axios.get(`https://u76rpadxda.us-east-1.awsapprunner.com/api/feeding-schedule/${petId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const schedule = response.data.schedule;

    // ✅ Converts "7:00 AM" or "3:00 PM" to minutes since midnight
    const parseTimeToMinutes = (timeStr) => {
      const [time, meridiem] = timeStr.trim().split(' ');
      let [hour, minute] = time.split(':').map(Number);

      if (meridiem === 'PM' && hour !== 12) hour += 12;
      if (meridiem === 'AM' && hour === 12) hour = 0;

      return hour * 60 + minute;
    };

    // ✅ Checks if the scheduled time has already passed
    const isPast = (timeStr, label) => {
      if (!timeStr) {
       // console.log(`⏳ [${label}] No time provided — defaulting to Upcoming`);
        return false;
      }

      const scheduleMinutes = parseTimeToMinutes(timeStr);
      const now = new Date();
      const nowMinutes = now.getHours() * 60 + now.getMinutes();

      // console.log(`⏱️ [${label}] Now: ${now.getHours()}:${now.getMinutes()} = ${nowMinutes} mins`);
      // console.log(`📆 [${label}] Scheduled: ${timeStr} = ${scheduleMinutes} mins`);
      // console.log(`🔍 [${label}] Status: ${nowMinutes >= scheduleMinutes ? 'Completed' : 'Upcoming'}`);

      return nowMinutes >= scheduleMinutes;
    };

    // ✅ Build the final transformed schedule array
    const transformed = [
      {
        id: 1,
        time: schedule.morning,
        status: isPast(schedule.morning, 'Morning') ? 'Completed' : 'Upcoming',
      },
      {
        id: 2,
        time: schedule.afternoon,
        status: isPast(schedule.afternoon, 'Afternoon') ? 'Completed' : 'Upcoming',
      },
      {
        id: 3,
        time: schedule.night,
        status: isPast(schedule.night, 'Night') ? 'Completed' : 'Upcoming',
      },
    ];

    //console.log('✅ Transformed Schedule:', transformed);

    setFeedingTimes(transformed);
  } catch (error) {
    console.error('❌ Failed to fetch feeding schedule:', error);
  }
};



let lastFetchedTimestamp = null;
let isFetching = false;
const fetchMotionData = async (typeOverride, ageOverride) => {
  if (isFetching) return;
  isFetching = true;
 try {
  const petString = await AsyncStorage.getItem('selectedPet');
  const token = await AsyncStorage.getItem('token');
  if (!petString) throw new Error('No selected pet found');
  if (!token) throw new Error('No authentication token found');

  const pet = JSON.parse(petString);
  const petId = pet?.id;
  if (!petId) throw new Error('Invalid pet ID');

  const response = await axios.get(`https://u76rpadxda.us-east-1.awsapprunner.com/api/motion-data/latest`, {
    headers: { Authorization: `Bearer ${token}` },
    params: { pet_id: petId },
  });
  //const { temperature_f, motion_state, heart_rate, timestamp } = response.data;
  const { temperature_f, motion_state, heart_rate, timestamp } = response.data;

  const cleanedTimestamp = timestamp.replace('Z', ''); 
  const backendTime = new Date(cleanedTimestamp).getTime();
  const deviceTime = Date.now();
  const timeDiff = (deviceTime - backendTime) / 1000;
  
  // ✅ Logs
  console.log("🕒 Backend timestamp (raw):", timestamp);
  console.log("🕛 Cleaned (Pakistan time):", new Date(backendTime).toString());
  console.log("⏱️ Current device time:", new Date(deviceTime).toString());
  console.log("⚖️ Difference in seconds:", timeDiff);
  
    if (timeDiff > 20) {
      throw new Error('Data is stale');
    }
    
    if (timestamp === lastFetchedTimestamp) {
      return;
    }
    lastFetchedTimestamp = timestamp;
    const newSensorData = {
      temperature_f,
      motion_state,
      heart_rate,
      loading: false,
      error: null,
    };

    //("✅ Fresh data, updating UI with:", newSensorData);
    setSensorData(newSensorData);
    setHeartRateValue(heart_rate);
    setIsCollarConnected(true);

    const type = typeOverride;
    const petAge = ageOverride;
    const range = getVitalsRange(type, petAge);
    setVitalsRange(range);
    // ✅ Immediately compute status
    const dynamicHeartRateStatus = getStatusLabel(heart_rate, range.heartRate);
    const tempStatus = getStatusLabel(temperature_f, range.temperature);
    
    setHeartRateStatus(dynamicHeartRateStatus);
    setTemperatureStatus(tempStatus);
    
    // ✅ Compute crash condition dynamically
    const isSevere = motion_state === 'HIT/CRASH' && dynamicHeartRateStatus === 'High';
    setIsSevereCrash(isSevere);
    
    //console.log("⚠️ Is Severe Crash:", isSevere);
 
    await checkAlerts(newSensorData, heart_rate, alertFlags, type, petAge);
  } catch (error) {
 //  console.warn("🚨 Error occurred in fetchMotionData:", error.message);
    const status = error?.response?.status;
    //if (status === 403) console.warn('🔒 Pet is not connected to any collar');
    if (error.message === '❌ Invalid timestamp format') console.warn('🛑 Timestamp parse error');

    setIsCollarConnected(false);
    setSensorData({
      temperature_f: '--',
      motion_state: '--',
      heart_rate: '--',
      loading: false,
    });
  } finally {
    isFetching = false;
  }
};

 const handleRefresh = () => {
 setSensorData(prev => ({ ...prev, loading: true }));
 fetchMotionData();
 };

 const handleTimeChange = (id, newTime) => {
 setFeedingTimes((prevTimes) =>
 prevTimes.map((item) =>
 item.id === id ? { ...item, time: newTime } : item
 )
 );
 };

 const animatedHeartRateProps = useAnimatedProps(() => ({
 strokeDashoffset: heartRateProgress.value,
 }));

 const animatedTemperatureProps = useAnimatedProps(() => ({
 strokeDashoffset: temperatureProgress.value,
 }));

 const animatedActivityProps = useAnimatedProps(() => ({
 strokeDashoffset: activityProgress.value,
 }));

useFocusEffect(
 useCallback(() => {
 const loadPetAndVitals = async () => {
 try {
 const storedPet = await AsyncStorage.getItem('selectedPet');
 const token = await AsyncStorage.getItem('token');
 if (!storedPet || !token) return;
 
 const parsedPet = JSON.parse(storedPet);
 const type = parsedPet.type?.toLowerCase();
 
 const ageString = parsedPet.age.toLowerCase();
 let ageInYears = 0;
 
 const yearMatch = ageString.match(/(\d+)\s*year/);
 const monthMatch = ageString.match(/(\d+)\s*month/);
 
 const years = yearMatch ? parseInt(yearMatch[1]) : 0;
 const months = monthMatch ? parseInt(monthMatch[1]) : 0;
 
 ageInYears = years + months / 12;
 //console.log("✅ Parsed ageInYears:", ageInYears);
 
 setPetId(parsedPet.id);
 setAge(ageInYears);
 setPetType(type);
 
 const vitals = getVitalsRange(type, ageInYears);
 setVitalsRange(vitals);
 setHeartRateStatus(getStatusLabel(heartRateValue, vitals.heartRate));
 setTemperatureStatus(getStatusLabel(sensorData.temperature_f, vitals.temperature));
 
 await fetchMotionData(type, ageInYears);
 
 await fetchFeedingSchedule(parsedPet.id, token);
 
 const vaccineRes = await axios.get(`https://u76rpadxda.us-east-1.awsapprunner.com/api/pets/${parsedPet.id}/vaccine-statuses`, {
 headers: { Authorization: `Bearer ${token}` }
 });
 
 const statuses = vaccineRes.data;
 setVaccineStatuses(statuses);
 
 const schedule = type === 'dog' ? DOG_VACCINES : CAT_VACCINES;
 const due = getDueSoonVaccines(schedule, statuses);
 setDueSoonVaccines(due);
 
 try {
  const dispenserResponse = await axios.get(
    `https://u76rpadxda.us-east-1.awsapprunner.com/api/dispenser-for-pet/${parsedPet.id}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  const weightResponse = await axios.get('https://u76rpadxda.us-east-1.awsapprunner.com/api/weight-latest');

  const isLinked = dispenserResponse.data?.device_id;
  const isFresh = weightResponse.data?.isFresh;

  
  
  if (isLinked && isFresh) {
    setIsDispenserConnected(true);
    console.log("✅ Dispenser is connected and MQTT is live");
  } else {
    setIsDispenserConnected(false);
    console.log("❌ Dispenser not connected or MQTT inactive");
  } 

} catch (err) {
  setIsDispenserConnected(false);
  console.log("🚫 Error checking dispenser connection:", err.message);
}


} catch (err) {
console.error("❌ Error loading pet/vitals/feed/vaccine data:", err.message);
}
};
 
 loadPetAndVitals();

 const calculatedHeartRate = calculateProgress(heartRateValue, heartRateMaxValue);
 const calculatedTemp = calculateProgress(sensorData.temperature_f, 120);
 const calculatedActivity = calculateProgress(
 getActivityValue(sensorData.motion_state),
 activityMaxValue
 );

 heartRateProgress.value = withTiming(calculatedHeartRate, { duration: 1500 });
 temperatureProgress.value = withTiming(calculatedTemp, { duration: 1500 });
 activityProgress.value = withTiming(calculatedActivity, { duration: 1500 });

 return () => {
 heartRateProgress.value = 2 * Math.PI * 45;
 temperatureProgress.value = 2 * Math.PI * 45;
 activityProgress.value = 2 * Math.PI * 45;
 };
 }, [sensorData.temperature_f, sensorData.motion_state, heartRateValue, petType, age])
);

useEffect(() => {
 if (!petType || age === null) return;

 const interval = setInterval(() => {
 fetchMotionData(petType, age);
 }, 1500);

 return () => clearInterval(interval);
}, [petType, age]);

useEffect(() => {
  const fetchScheduleStatus = async () => {
    try {
      const res = await axios.get("https://u76rpadxda.us-east-1.awsapprunner.com/api/schedule-status");
      setFeedingStatusList(res.data);
    } catch (err) {
      console.error('Failed to fetch schedule status:', err);
    }
  };

  fetchScheduleStatus();

  // Refresh every 1 minute
  const interval = setInterval(fetchScheduleStatus, 60000);
  return () => clearInterval(interval);
}, []);



 return (
 <View style={styles.container}>
 <PetHeader
 petName={name}
 petAge={age}
 petImage={image}
 onDrawerPress={() => navigation.openDrawer()}
 />

 <ScrollView contentContainerStyle={styles.scrollContainer}>
 <Image source={require('../assets/paw3.png')} style={styles.topRightImage} resizeMode="contain" />
 <Image source={require('../assets/paw3.png')} style={styles.bottomLeftImage} resizeMode="contain" />
 
 <View style={styles.topRow}>
 <Text style={styles.topLeftText}>
 {isCollarConnected ? '🟢 Collar is connected!' : '🔴 Collar is not connected'}
</Text> 
 </View>

 {sensorData.error && (
 <Text style={styles.errorText}>{sensorData.error}</Text>
 )}

 <View style={styles.squaresColumn}>
 <View style={styles.squaresRow}>
 <TouchableOpacity onPress={() => navigation.navigate('HeartRate')} style={styles.square}>
 <Text style={styles.squareText}>Heart Rate</Text>
 <View style={styles.circleContainer}>
 <View style={styles.readingRing}>
 <Svg width="100" height="100">
 <Circle cx="50" cy="50" r="45" stroke="#e0e0e0" strokeWidth="8" fill="transparent" />
 <AnimatedCircle
 cx="50"
 cy="50"
 r="45"
 stroke={getStatusColor(heartRateStatus)}
 strokeWidth="8"
 fill="transparent"
 strokeDasharray={2 * Math.PI * 45}
 animatedProps={animatedHeartRateProps}
 strokeLinecap="round"
/>
 </Svg>
 </View>
 <View style={styles.readingCircle}>
 <Text style={styles.readingText}>
 {sensorData.loading || typeof sensorData.heart_rate !== 'number'
 ? '--'
 : sensorData.heart_rate.toFixed(0)}
</Text>
 <Text style={styles.readingLabel}>
 {heartRateStatus} ({'BPM'})
</Text>
 </View>
 </View>
 </TouchableOpacity>

 <TouchableOpacity onPress={() => navigation.navigate('Temperature')} style={styles.square}>
 <Text style={styles.squareText}>Temperature</Text>
 <View style={styles.circleContainer}>
 <View style={styles.readingRing}>
 <Svg width="100" height="100">
 <Circle cx="50" cy="50" r="45" stroke="#e0e0e0" strokeWidth="8" fill="transparent" />
 <AnimatedCircle
 cx="50"
 cy="50"
 r="45"
 stroke={getStatusColor(temperatureStatus)}
 strokeWidth="8"
 fill="transparent"
 strokeDasharray={2 * Math.PI * 45}
 animatedProps={animatedTemperatureProps}
 strokeLinecap="round"
 />
 </Svg>
 </View>
 <View style={styles.readingCircle}>
 <Text style={styles.readingText}>
 {sensorData.loading || typeof sensorData.temperature_f !== 'number'
 ? '--'
 : sensorData.temperature_f.toFixed(1)}
</Text>
<Text style={styles.readingLabel}>
 {temperatureStatus} (°F)
</Text>
 </View>
 </View>
 </TouchableOpacity>
 </View>

 <View style={styles.squaresRow}>
 <TouchableOpacity
 onPress={() => navigation.navigate('Activity')}
 style={[
 styles.square,
 isSevereCrash && { backgroundColor: '#e0cfc7', borderColor: '#a30000', borderWidth: 2 },
 ]}
 >
 <Text style={styles.squareText}>Activity</Text>
 <View style={styles.circleContainer}>
 <View style={styles.readingRing}>
 <Svg width="100" height="100">
 <Circle cx="50" cy="50" r="45" stroke="#e0e0e0" strokeWidth="8" fill="transparent" />
 <AnimatedCircle
 cx="50"
 cy="50"
 r="45"
 stroke={isSevereCrash ? '#a30000' : activityColor}
 strokeWidth="8"
 fill="transparent"
 strokeDasharray={2 * Math.PI * 45}
 animatedProps={animatedActivityProps}
 strokeLinecap="round"
 />
 </Svg>
 </View>
 <View style={styles.readingCircle}>
 <Text style={styles.readingText}>
 {sensorData.loading ? '--' : activityValue}%
 </Text>
 <Text style={styles.readingLabel}>
 {isSevereCrash ? '🚨 Injury?' : sensorData.motion_state}
</Text>
 </View>
 </View>
 </TouchableOpacity>

 <TouchableOpacity onPress={() => navigation.navigate('DiseaseDetection')} style={styles.square}>
 <Text style={styles.squareText}>Disease Detection</Text>
 <Image source={require('../assets/disease.png')} style={styles.diseaseIcon} resizeMode="contain" />
 </TouchableOpacity>
 </View>
 </View>

 <View style={styles.topRow1}>
  <Text style={styles.topLeftText}>
    {isDispenserConnected ? '🟢 Dispenser is connected!' : '🔴 Dispenser is not connected'}
  </Text>
</View>

<View style={styles.separateSquare}>
 <Text style={styles.separateSquareText}>Feeding Schedule</Text>
 <TouchableOpacity
    onPress={() => {
      if (!isDispenserConnected) {
        Alert.alert(
          'No Dispenser Connected',
          'Please connect a food dispenser first.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Connect',
              onPress: () => navigation.navigate('Food Dispenser'),
            },
          ]
        );
      } else {
        navigation.navigate('FeedingScheduleScreen');
      }
    }}
    style={styles.editSaveIcon}
  >
  <Ionicons name="create" size={24} color="#5C4033" />

  </TouchableOpacity>
 <View style={styles.separatorLine} />
 {Array.isArray(feedingTimes) && feedingTimes.map((item) => {
  const matchingStatusItem = feedingStatusList.find((statusItem) => statusItem.time === convertTo24Hour(item.time));
  const resolvedStatus = matchingStatusItem?.status || item.status || 'Upcoming';

  return (
    <View key={item.id} style={styles.feedingRow}>
      <Ionicons name="time" style={styles.clockIcon} />
      {isEditing ? (
        <TextInput
          style={styles.feedingTextInput}
          value={item.time}
          onChangeText={(text) => handleTimeChange(item.id, text)}
        />
      ) : (
        <Text style={styles.feedingText}>
          {item.time} - {resolvedStatus}
        </Text>
      )}
      <View
        style={[
          styles.statusIndicator,
          {
            backgroundColor:
              resolvedStatus === 'Completed' ? 'green' :
              resolvedStatus === 'Upcoming' ? 'yellow' :
              resolvedStatus === 'Failed' ? 'red' :
              'white'
          },
        ]}
      />
    </View>
  );
})}

 </View>

 {dueSoonVaccines.length > 0 ? (
 <TouchableOpacity
 style={styles.dueSoonCard}
 onPress={() => navigation.navigate('VaccinationDetails')}>
 <Text style={styles.dueSoonTitle}>📅 Due Soon Vaccines</Text>

 {dueSoonVaccines.map((vaccine) => (
 <View key={vaccine.key} style={styles.dueSoonRow}>
 <Text style={styles.dueSoonText}>
 💉 {vaccine.name} — Dose {vaccine.dose}
 </Text>
 <Text style={styles.dueSoonDate}>Due: {vaccine.next}</Text>
 </View>
 ))}
</TouchableOpacity>
) : (
 <Text style={{ marginTop: 10, fontStyle: 'italic', color: '#666' }}>
 ✅ No upcoming vaccinations. You're all caught up!
 </Text>
)}

 <TouchableOpacity onPress={() => Linking.openURL('https://www.petmd.com/general/what-to-do-in-pet-emergency')}>
 <Text style={styles.article}>Articles</Text>
 <View style={styles.articlesquare}>
 <Image source={require('../assets/FirstAid.jpg')} style={styles.articleImage} />
 <View style={styles.textContainer}>
 <Text style={styles.title}>What To Do in a Pet Emergency</Text>
 <Text style={styles.subtitle}>If your pet is sick or hurt, they can't tell you what happened .... Read More</Text>
 </View>
 </View>
 </TouchableOpacity>

 <TouchableOpacity onPress={() => Linking.openURL('https://www.smalldoorvet.com/learning-center/wellness/best-ways-to-exercise-with-dogs')}>
 <View style={styles.articlesquare}>
 <Image source={require('../assets/exercise.jpg')} style={styles.articleImage} />
 <View style={styles.textContainer}>
 <Text style={styles.title}>The 9 Best Ways to Exercise With Your Dog</Text>
 <Text style={styles.subtitle}>The benefits of exercise are numerous and well established .... Read More</Text>
 </View>
 </View>
 </TouchableOpacity>

 <TouchableOpacity onPress={() => Linking.openURL('https://southhuntsvillevethospital.com/how-to-find-the-right-diet-for-your-pets-age-and-breed/')}>
 <View style={styles.articlesquare}>
 <Image source={require('../assets/billi.jpg')} style={styles.articleImage} />
 <View style={styles.textContainer}>
 <Text style={styles.title}>How to Find The Right Diet For Your Pet's Age And Breed</Text>
 <Text style={styles.subtitle}>A poor diet can lead to various health issues, such as obesity, .... Read More</Text>
 </View>
 </View>
 </TouchableOpacity>
 </ScrollView>

 <FloatingActionButton />

 <Footer />
 </View>
 );
};

const styles = StyleSheet.create({
 container: {
 flex: 1,
 backgroundColor: '#e0cfc7',
 },
 scrollContainer: {
 flexGrow: 1,
 justifyContent: 'center',
 alignItems: 'center',
 padding: 16,
 paddingTop: 0,
 },
 diseaseIcon: {
 width: 150,
 height: 100,
 alignSelf: 'center',
 marginTop: 0,
 },
 topRightImage: {
 width: 300,
 height: 300,
 position: 'absolute',
 top: -90,
 right: -160,
 },
 bottomLeftImage: {
 width: 300,
 height: 300,
 position: 'absolute',
 bottom: 70,
 left: -30,
 },
 topRow: {
 flexDirection: 'row',
 alignItems: 'center',
 justifyContent: 'space-between',
 marginTop: 0,
 marginBottom: 0,
 },
 topRow1: {
 flexDirection: 'row',
 alignItems: 'center',
 justifyContent: 'space-between',
 marginTop: 0,
 marginBottom: -20,
 },
 batteryContainer: {
 flexDirection: 'row',
 alignItems: 'center',
 },
 refreshIcon: {
 fontSize: 24,
 color: '#5C4033',
 marginRight: 15,
 },
 refreshLoading: {
 color: '#999',
 },
 batteryIcon: {
 fontSize: 30,
 color: '#000',
 },
 batteryIcon1: {
 fontSize: 30,
 color: '#000',
 marginLeft: 100,
 marginTop: 0,
 },
 topLeftText: {
 fontSize: 18,
 fontWeight: 'bold',
 color: '#000',
 marginTop: 0,
 },
 errorText: {
 color: 'red',
 textAlign: 'center',
 marginVertical: 5,
 },
 squaresColumn: {
 flexDirection: 'column',
 justifyContent: 'center',
 alignItems: 'center',
 width: '100%',
 marginTop: 0,
 },
 squaresRow: {
 flexDirection: 'row',
 justifyContent: 'space-evenly',
 width: '100%',
 marginBottom: 0,
 },
 square: {
 width: 150,
 height: 160,
 backgroundColor: '#e3d6d0',
 margin: 10,
 borderRadius: 15,
 shadowColor: '#000',
 shadowOffset: { width: 0, height: 2 },
 shadowOpacity: 0.25,
 shadowRadius: 3.84,
 elevation: 5,
 justifyContent: 'center',
 alignItems: 'center',
 paddingTop: 10,
 },
 squareText: {
 fontSize: 14,
 fontWeight: 'bold',
 color: '#000',
 textAlign: 'center',
 marginBottom: 10,
 },
 circleContainer: {
 width: 100,
 height: 100,
 position: 'relative',
 justifyContent: 'center',
 alignItems: 'center',
 },
 readingRing: {
 position: 'absolute',
 width: 60,
 height: 60,
 borderRadius: 25,
 backgroundColor: 'transparent',
 borderWidth: 2,
 borderColor: '#000',
 justifyContent: 'center',
 alignItems: 'center',
 },
 readingCircle: {
 width: 90,
 height: 90,
 borderRadius: 45,
 backgroundColor: '#fff',
 justifyContent: 'center',
 alignItems: 'center',
 borderWidth: 2,
 borderColor: '#000',
 },
 readingText: {
 fontSize: 20,
 fontWeight: 'bold',
 color: '#000',
 textAlign: 'center',
 },
 readingLabel: {
 fontSize: 12,
 color: '#000',
 textAlign: 'center',
 },
 separateSquare: {
 width: '90%',
 minHeight: 180,
 backgroundColor: '#e3d6d0',
 borderRadius: 15,
 shadowColor: '#000',
 shadowOffset: { width: 0, height: 2 },
 shadowOpacity: 0.25,
 shadowRadius: 3.84,
 elevation: 5,
 marginTop: 30,
 justifyContent: 'center',
 alignItems: 'center',
 padding: 10,
 },
 separateSquareText: {
 fontSize: 16,
 fontWeight: 'bold',
 color: '#000',
 textAlign: 'center',
 marginBottom: 20,
 },
 editSaveIcon: {
 fontSize: 24,
 color: '#000',
 position: 'absolute',
 top: 20,
 right: 10,
 },
 separatorLine: {
 width: '100%',
 height: 1,
 backgroundColor: '#000',
 marginVertical: 10,
 },
 feedingRow: {
 flexDirection: 'row',
 alignItems: 'center',
 marginTop: 8,
 width: '100%',
 },
 clockIcon: {
 fontSize: 14,
 color: '#000',
 marginRight: 10,
 },
 feedingText: {
 fontSize: 14,
 color: '#000',
 flex: 1,
 },
 feedingTextInput: {
 fontSize: 14,
 color: '#000',
 flex: 1,
 borderBottomWidth: 1,
 borderBottomColor: '#000',
 paddingVertical: 5,
 },
 statusIndicator: {
 width: 10,
 height: 10,
 borderRadius: 5,
 marginLeft: 10,
 },
 article: {
 fontSize: 18,
 fontWeight: 'bold',
 color: '#000',
 marginTop: 10,
 },
 articlesquare: {
 width: 315,
 height: 280,
 backgroundColor: '#e3d6d0',
 borderRadius: 15,
 shadowColor: '#000',
 shadowOffset: { width: 0, height: 2 },
 shadowOpacity: 0.25,
 shadowRadius: 3.84,
 elevation: 5,
 marginTop: 30,
 justifyContent: 'center',
 alignItems: 'center',
 padding: 10,
 bottom: 15,
 },
 articleImage: {
 width: 315,
 height: 180,
 borderRadius: 15,
 marginTop: -25,
 },
 title: {
 fontSize: 20,
 fontWeight: 'bold',
 color: 'black',
 marginLeft: -2,
 marginTop: 10
 },
 subtitle: {
 fontSize: 16,
 color: 'black', 
 marginTop: 5,
 },
 dueSoonCard: {
 width: '90%',
 backgroundColor: '#f7eee6',
 borderRadius: 15,
 padding: 15,
 marginTop: 20,
 elevation: 3,
 },
 dueSoonTitle: {
 fontSize: 16,
 fontWeight: 'bold',
 marginBottom: 10,
 color: '#5C4033',
 },
 dueSoonRow: {
 marginBottom: 8,
 },
 dueSoonText: {
 fontSize: 14,
 color: '#333',
 },
 dueSoonDate: {
 fontSize: 13,
 color: '#5C4033',
 },
 vaccineCard: {
 width: '90%',
 backgroundColor: '#f6ede8',
 borderRadius: 15,
 padding: 15,
 marginTop: 20,
 elevation: 5,
 shadowColor: '#000',
 shadowOffset: { width: 0, height: 2 },
 shadowOpacity: 0.2,
 shadowRadius: 3,
 },
 
 vaccineCardTitle: {
 fontSize: 16,
 fontWeight: 'bold',
 color: '#5C4033',
 marginBottom: 10,
 textAlign: 'left',
 },
 
 vaccineItem: {
 flexDirection: 'row',
 alignItems: 'flex-start',
 marginBottom: 12,
 },
 
 vaccineName: {
 fontSize: 14,
 fontWeight: '500',
 color: '#333',
 },
 
 vaccineDate: {
 fontSize: 13,
 color: '#7a5e48',
 },
});

export default HomeScreen;
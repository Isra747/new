import 'react-native-gesture-handler'; // ✅ MUST be first for gesture handler

import React, { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createDrawerNavigator } from '@react-navigation/drawer';

import { BackHandler, Platform, Alert } from 'react-native'; // ✅ BackHandler to exit app
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Components / Screens
import Welcome from './components/Welcome';
import LoginScreen from './components/LoginScreen';
import SignupScreen from './components/SignupScreen';
import AccountCreatedScreen from './components/AccountCreatedScreen';
import BuildPetProfile from './components/BuildPetProfile';
import SelectPetTypeScreen from './components/SelectPetTypeScreen';
import SelectPetGenderScreen from './components/SelectPetGenderScreen';
import SelectPetBreedScreen from './components/SelectPetBreedScreen';
import PetAgeInputScreen from './components/PetAgeInputScreen';
import PetWeightScreen from './components/PetWeightScreen';
import AddPetPhotoScreen from './components/AddPetPhotoScreen';
import EmailVerificationScreen from './components/EmailVerificationScreen';
import ResetPassword from './components/ResetPasswordScreen';
import ForgotPasswordScreen from './components/ForgotPasswordScreen';
import HomeScreen from './components/HomeScreen';
import Profile from './components/Profile';
import HeartRate from './components/HeartRate';
import Temperature from './components/Temperature';
import Activity from './components/Activity';
import PetProfile from './components/PetProfile';
import ActivateCollarScreen from './components/ActivateCollarScreen';
import ActivateFoodDispenserScreen from './components/ActivateFoodDispenserScreen';
import ManuallyTriggerScreen from './components/ManuallyTriggerScreen';
import FeedingScheduleScreen from './components/FeedingScheduleScreen';
import NearbyVetsLocation from './components/NearbyVetsLocation';
import DiseaseDetection from './components/DiseaseDetection';
import DiseaseResult from './components/DiseaseResult';
import Notification from './components/NotificationScreen';
import VaccinationDetails from './components/VaccinationDetails';

const Drawer = createDrawerNavigator();
const Stack = createStackNavigator();

// 🔔 Push Notification Setup
async function registerForPushNotificationsAsync() {
  let token;
  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      alert('Failed to get push notification permissions!');
      return;
    }
    token = (await Notifications.getExpoPushTokenAsync()).data;
    // Save token locally
    await AsyncStorage.setItem('expoPushToken', token);
    // Send token to backend for remote push notifications
    try {
      await fetch('https://u76rpadxda.us-east-1.awsapprunner.com/api/save-push-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
    } catch (e) {
      console.log('Failed to send push token to backend:', e);
    }
  } else {
    //alert('Must use physical device for Push Notifications');
  }
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }
  return token;
}

// ✅ Notification handler
const handleNotification = async (notification) => {
  try {
    const notifRequest = notification.request?.content || {};
    const notifData = notifRequest.data || {};
    const title = notifRequest.title || 'Notification';
    const body = notifRequest.body || '';

    // ✅ Always trust local login context
    const user_email = await AsyncStorage.getItem('user_email');

    let petId = notifData.pet_id;
    if (!petId) {
      const petString = await AsyncStorage.getItem('selectedPet');
      if (petString) {
        const pet = JSON.parse(petString);
        petId = pet?.id;
      }
    }

    if (!user_email || !petId) {
      console.log('⚠️ Cannot save notification: missing user_email or pet_id');
      return;
    }

    const payload = { title, body, data: notifData, pet_id: petId };

    // Save to local storage
    let stored = await AsyncStorage.getItem('notifications');
    let notifications = stored ? JSON.parse(stored) : [];
    notifications.push(payload);
    await AsyncStorage.setItem('notifications', JSON.stringify(notifications));

    // Send to backend
    await fetch('https://u76rpadxda.us-east-1.awsapprunner.com/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    console.log('✅ Notification saved and posted to DB:', payload);

  } catch (e) {
    console.log('❌ Notification save/send error:', e);
  }
};



Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    await handleNotification(notification);
    return {
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    };
  },
});

// ✅ Drawer Navigation
const DrawerNavigator = () => {
  const [isDispenserConnected, setIsDispenserConnected] = useState(false);

  useEffect(() => {
    const checkDispenserStatus = async () => {
      try {
        const storedPet = await AsyncStorage.getItem('selectedPet');
        if (!storedPet) return;
  
        const parsedPet = JSON.parse(storedPet);
  
        // Step 1: Check if dispenser is linked to this pet
        const token = await AsyncStorage.getItem('token'); // make sure token is fetched
        const dispenserRes = await fetch(
          `https://u76rpadxda.us-east-1.awsapprunner.com/api/dispenser-for-pet/${parsedPet.id}`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );
                const dispenserData = await dispenserRes.json();
  
        const isLinked = !!dispenserData.device_id;
  
        // Step 2: If linked, verify MQTT freshness
        let isFresh = false;
        if (isLinked) {
          const weightRes = await fetch(`https://u76rpadxda.us-east-1.awsapprunner.com/api/weight-latest`);
          const weightData = await weightRes.json();
          isFresh = weightData?.isFresh === true;
        }
  
        // Final decision: Only true if linked AND fresh MQTT
        setIsDispenserConnected(isLinked && isFresh);
      } catch (error) {
        console.log('❌ Failed to check dispenser status:', error);
        setIsDispenserConnected(false);
      }
    };
  
    checkDispenserStatus();
  
    const interval = setInterval(checkDispenserStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  

  useEffect(() => {
    // Register for push notifications
    registerForPushNotificationsAsync();
  
    // Listen when a notification is received while app is foregrounded
    const foregroundSubscription = Notifications.addNotificationReceivedListener(notification => {
      handleNotification(notification); // Save & post as usual
    });
  
    // Listen when user taps on notification (foreground/background/terminated)
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
      const notification = response.notification;
      handleNotification(notification); // Save & post
      // You can also navigate based on data if needed here
    });
  
    return () => {
      // Clean up listeners
      foregroundSubscription.remove();
      responseSubscription.remove();
    };
  }, []);
  
  

  return (
    <Drawer.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
        drawerStyle: {
          backgroundColor: '#E3D6D0',
          width: 250,
        },
        drawerLabelStyle: {
          fontSize: 16,
        },
        drawerActiveBackgroundColor: '#6c4b3c',
        drawerInactiveTintColor: 'black',
        drawerActiveTintColor: 'white',
      }}
    >
      <Drawer.Screen name="Home" component={HomeScreen} />
      <Drawer.Screen 
        name="Manually Trigger Food" 
        component={ManuallyTriggerScreen}
        options={{
          drawerItemStyle: isDispenserConnected ? {} : { opacity: 0.5 },
          drawerLabel: isDispenserConnected ? "Manually Trigger Food" : "Manually Trigger Food (No Dispenser)",
        }}
        listeners={({ navigation }) => ({
          drawerItemPress: (e) => {
            if (!isDispenserConnected) {
              e.preventDefault();
              // Optionally show an alert
              Alert.alert(
                'No Dispenser Connected',
                'Please connect a food dispenser first to use this feature.',
                [{ text: 'OK' }]
              );
            }
          },
        })}
      />
      <Drawer.Screen 
        name="Feeding Schedule" 
        component={FeedingScheduleScreen}
        options={{
          drawerItemStyle: isDispenserConnected ? {} : { opacity: 0.5 },
          drawerLabel: isDispenserConnected ? "Feeding Schedule" : "Feeding Schedule (No Dispenser)",
        }}
        listeners={({ navigation }) => ({
          drawerItemPress: (e) => {
            if (!isDispenserConnected) {
              e.preventDefault();
              // Optionally show an alert
              Alert.alert(
                'No Dispenser Connected',
                'Please connect a food dispenser first to use this feature.',
                [{ text: 'OK' }]
              );
            }
          },
        })}
      />
      <Drawer.Screen name="Nearby Vets" component={NearbyVetsLocation} />
      <Drawer.Screen name="Add Another Pet" component={BuildPetProfile} />
      <Drawer.Screen name="Vaccination Detail" component={VaccinationDetails} />
    </Drawer.Navigator>
  );
};

export default function App() {
  // 🔔 Push notification registration
  useEffect(() => {
    registerForPushNotificationsAsync();
  }, []);

  // ✅ Exit app on back press (from any screen)
  useEffect(() => {
    const backAction = () => {
      BackHandler.exitApp(); // Directly close the app
      return true; // Block default back behavior
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove(); // Cleanup on unmount
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Welcome" screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Welcome" component={Welcome} />
          <Stack.Screen name="Home" component={DrawerNavigator} />
          <Stack.Screen name="Profile" component={Profile} />
          <Stack.Screen name="LoginScreen" component={LoginScreen} />
          <Stack.Screen name="SignupScreen" component={SignupScreen} />
          <Stack.Screen name="EmailVerificationScreen" component={EmailVerificationScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          <Stack.Screen name="ResetPassword" component={ResetPassword} />
          <Stack.Screen name="AccountCreatedScreen" component={AccountCreatedScreen} />
          <Stack.Screen name="BuildPetProfile" component={BuildPetProfile} />
          <Stack.Screen name="SelectPetTypeScreen" component={SelectPetTypeScreen} />
          <Stack.Screen name="SelectPetGenderScreen" component={SelectPetGenderScreen} />
          <Stack.Screen name="SelectPetBreedScreen" component={SelectPetBreedScreen} />
          <Stack.Screen name="PetAgeInputScreen" component={PetAgeInputScreen} />
          <Stack.Screen name="PetWeightScreen" component={PetWeightScreen} />
          <Stack.Screen name="AddPetPhotoScreen" component={AddPetPhotoScreen} />
          <Stack.Screen name="HeartRate" component={HeartRate} />
          <Stack.Screen name="Temperature" component={Temperature} />
          <Stack.Screen name="Activity" component={Activity} />
          <Stack.Screen name="DiseaseDetection" component={DiseaseDetection} />
          <Stack.Screen name="DiseaseResult" component={DiseaseResult} />
          <Stack.Screen name="FeedingScheduleScreen" component={FeedingScheduleScreen} />
          <Stack.Screen name="Nearby Vets" component={NearbyVetsLocation} />
          <Stack.Screen name="PetProfile" component={PetProfile} />
          <Stack.Screen name="Notification" component={Notification} />
          <Stack.Screen name="Connect Collar" component={ActivateCollarScreen} />
          <Stack.Screen name="Food Dispenser" component={ActivateFoodDispenserScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}

import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Animated, Image, Alert } from "react-native";
import { Lock, Unlock } from "lucide-react-native";
import axios from "axios";
import * as Notifications from 'expo-notifications';

const ManuallyTriggerScreen = ({ navigation }) => {
  const [isLocked, setIsLocked] = useState(false);
  const [position] = useState(new Animated.Value(0));
  const [weight, setWeight] = useState("Loading...");
  const toggleLock = async () => {
    try {
      if (!isLocked) {
        // 1. Trigger servo
        await axios.post("https://u76rpadxda.us-east-1.awsapprunner.com/api/servo");
  
        // 2. Set to locked/open state
        setIsLocked(true);
        Animated.timing(position, {
          toValue: -160,
          duration: 300,
          useNativeDriver: true,
        }).start();
  
        // 3. After 3 seconds, auto-close
        setTimeout(() => {
          setIsLocked(false);
          Animated.timing(position, {
            toValue: 0,
            duration: 450,
            useNativeDriver: true,
          }).start();
        }, 3000);
      }
  
    } catch (error) {
      Alert.alert("Error", "Failed to trigger servo.");
      console.error(error);
    }
  };

  const sendPushNotification = async (token) => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Food Dispensed",
        body: "Your pet's food has been dispensed.",
      },
      trigger: null,
    });
  };

  // Fetch weight every 3 seconds
  useEffect(() => {
    const fetchWeight = async () => {
      try {
        const response = await axios.get("https://u76rpadxda.us-east-1.awsapprunner.com/api/weight-latest");
        setWeight(response.data.weight + " kg");
      } catch (err) {
        setWeight("Unavailable");
      }
    };

    fetchWeight(); // initial load
    const interval = setInterval(fetchWeight, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container1}>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Image source={require("../assets/back.png")} style={styles.back} />
      </TouchableOpacity>

      <View style={styles.container}>
        <Image source={require("../assets/paw3.png")} style={styles.topRightImage} resizeMode="contain" />
        <Image source={require("../assets/paw3.png")} style={styles.bottomLeftImage} resizeMode="contain" />

        <Text style={styles.headerText}>Dispense Food</Text>

        <TouchableOpacity style={styles.lockContainer} onPress={toggleLock}>
          <Animated.View style={[styles.lockStatusContainer, { transform: [{ translateY: position }] }]}>
            {isLocked ? <Lock color="white" size={30} /> : <Unlock color="white" size={30} />}
            <Text style={styles.lockStatusText}>{isLocked ? "Close" : "Open"}</Text>
          </Animated.View>
        </TouchableOpacity>

        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>Food Weight</Text>
          <Text style={styles.infoText1}>{weight}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#e0cfc7",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  container1: {
    flex: 1,
    backgroundColor: '#e0cfc7',
  },
  headerText: {
    color: "#6c4b3c",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
  },
  lockContainer: {
    width: 160,
    height: 320,
    borderRadius: 80,
    overflow: "hidden",
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e3d6d0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  topRightImage: {
    width: 250,
    height: 250,
    position: 'absolute',
    top: -40,
    right: -140,
},
bottomLeftImage: {
    width: 250,
    height: 250,
    position: 'absolute',
    bottom: 70,
    left: -30,
},
back: {
  width: 20,
  height: 20,
  marginRight: 25,
  marginTop:50,
  marginLeft:20
},
  lockStatusContainer: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    height: "50%",
    backgroundColor: "#6c4b3c",
    borderTopLeftRadius: 80,
    borderTopRightRadius: 80,
    alignItems: "center",
    justifyContent: "center",
  },
  lockStatusText: {
    color: "white",
    marginTop: 8,
  },
  infoContainer: {
    marginTop: 24,
    padding: 12,
    backgroundColor: "#6c4b3c",
    borderRadius: 16,
    width: 215,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  infoText: {
    color: "white",
    fontSize: 16,
    marginLeft:7
  },
  infoText1: {
    color: "white",
    fontSize: 16,
    marginLeft:7,
    marginRight:10
  },
});

export default ManuallyTriggerScreen;
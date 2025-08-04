import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PetHeader = () => {
    const navigation = useNavigation();
    const [petData, setPetData] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchPetData = async () => {
        setLoading(true);
        try {
            const storedPet = await AsyncStorage.getItem('selectedPet');
          
            if (storedPet) {
              const parsedPet = JSON.parse(storedPet);
              console.log("🐾 Selected pet from AsyncStorage:", parsedPet.id);
              
              setPetData(parsedPet);
              setLoading(false);
              return;
            }
          
      
          const token = await AsyncStorage.getItem('token');
          if (!token) {
            throw new Error("No authentication token found.");
          }
      
          const response = await fetch('https://u76rpadxda.us-east-1.awsapprunner.com/api/pet-profile', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
      
          if (!response.ok) {
            throw new Error(`Failed to fetch pet data: ${response.status}`);
          }
      
          const data = await response.json();
          setPetData(data);
      
          // ✅ Save selected pet to AsyncStorage
          await AsyncStorage.setItem('selectedPet', JSON.stringify(data));
      
        } catch (error) {
          console.error("Error fetching pet data:", error.message);
          Alert.alert("Error", "Could not fetch pet data. Please try again.");
        } finally {
          setLoading(false);
        }
      };
      

    // Automatically refetch pet data when screen is focused
    useFocusEffect(
        useCallback(() => {
            fetchPetData();
        }, [])
    );

    if (loading) {
        return (
            <View style={styles.headerContainer}>
                <ActivityIndicator size="small" color="#fff" />
            </View>
        );
    }

    return (
        <View style={styles.headerContainer}>
            <TouchableOpacity onPress={() => navigation.openDrawer()}>
                <Ionicons name="menu" size={28} color="#fff" />
            </TouchableOpacity>

            <View style={styles.petTextContainer}>
                <Text style={styles.petName}>{petData?.name || "Pet Name"}</Text>
                <Text style={styles.petAge}>{petData?.age ? `${petData.age}` : "Age Unknown"}</Text>
            </View>

            <TouchableOpacity onPress={() => navigation.navigate("PetProfile")}>
                <Image
        source={{ uri: petData.petimage }} 
        style={styles.petImage}
      />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    headerContainer: {
        width: '100%',
        backgroundColor: '#5C4033',
        padding: 14,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 2,
        marginTop: 30,
    },
    petTextContainer: {
        flex: 1,
        justifyContent: 'center',
        marginLeft: 40,
    },
    petName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    petAge: {
        fontSize: 14,
        color: '#f0f0f0',
    },
    petImage: {
        width: 60,
        height: 60,
        borderRadius: 30,
        marginLeft: 12,
        borderWidth: 2,
        borderColor: '#fff',
    },
});

export default PetHeader;

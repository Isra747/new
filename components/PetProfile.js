import React, { useState, useEffect } from 'react';
import { 
 View, Text, Image, TouchableOpacity, TextInput, 
 StyleSheet, ActivityIndicator, Alert, ScrollView, Modal 
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Footer from './Footer';
import { Picker } from '@react-native-picker/picker';
import { launchImageLibrary } from 'react-native-image-picker';


const catBreeds = [
 "Persian", "Maine Coon", "Siamese", "Ragdoll", "Bengal", "Scottish Fold", "Sphynx",
 "Abyssinian", "British Shorthair", "American Shorthair", "Russian Blue", "Norwegian Forest Cat",
 "Burmese", "Birman", "Turkish Van", "Oriental Shorthair", "Exotic Shorthair", "Cornish Rex",
 "Devon Rex", "Tonkinese","Mixed"
];

const dogBreeds = [
 "Labrador Retriever", "German Shepherd", "Golden Retriever", "Bulldog", "Poodle",
 "Beagle", "Shih Tzu", "Chihuahua", "Dachshund", "Boxer", "Cocker Spaniel", "Siberian Husky",
 "Rottweiler", "Great Dane", "Yorkshire Terrier", "Basset Hound", "Collie", "Australian Shepherd",
 "Pug", "Cavalier King Charles Spaniel","Mixed"
];


const formatDate = (dateString) => {
 const date = new Date(dateString);
 const yyyy = date.getFullYear();
 const mm = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
 const dd = String(date.getDate()).padStart(2, '0');
 return `${yyyy}-${mm}-${dd}`;
};


const PetProfile = ({ navigation, route }) => {
  const [newImage, setNewImage] = useState(null);
 const [isEditing, setIsEditing] = useState(false);
 const [petData, setPetData] = useState(null);
 const [loading, setLoading] = useState(true);
 const [isModalVisible, setIsModalVisible] = useState(false);
 const [petList, setPetList] = useState([]);



 useEffect(() => {
 fetchPetData();
 }, []);

 
 const fetchPetData = async () => {
 try {
 const storedPet = await AsyncStorage.getItem('selectedPet');
 if (storedPet) {
 const pet = JSON.parse(storedPet);
 setPetData(pet);
 console.log('Selected Pet ID:', pet.id); // Log the pet ID to the console
 setLoading(false);
 return;
 }
 
 const token = await AsyncStorage.getItem('token');
 if (!token) {
 Alert.alert('Authentication Error', 'Please log in again.');
 return;
 }
 
 const response = await fetch(`https://u76rpadxda.us-east-1.awsapprunner.com/api/pet-profile`, {
 method: 'GET',
 headers: { 
 'Content-Type': 'application/json', 
 Authorization: `Bearer ${token}` 
 },
 });
 
 const data = await response.json();
 if (data.error) {
 Alert.alert('Error', data.error);
 return;
 }
 
 setPetData(data);
 console.log('Selected Pet ID:', data.id); // Log the pet ID to the console
 await AsyncStorage.setItem('selectedPet', JSON.stringify(data));
 } catch (error) {
 Alert.alert('Error', 'Failed to fetch pet profile.');
 } finally {
 setLoading(false);
 }
 };
 
 const handleDeletePet = async (petId) => {
 // Show confirmation dialog
 Alert.alert(
 "Delete Pet",
 "Are you sure you want to delete this pet profile? This action cannot be undone.",
 [
 {
 text: "Cancel",
 style: "cancel"
 },
 { 
 text: "Delete", 
 onPress: async () => {
 try {
 const token = await AsyncStorage.getItem('token');
 if (!token) {
 Alert.alert('Authentication Error', 'Please log in again.');
 return;
 }
 
 const response = await fetch(`https://u76rpadxda.us-east-1.awsapprunner.com/api/petdelete/${petId}`, {
 method: 'DELETE',
 headers: {
 'Authorization': `Bearer ${token}`,
 'Content-Type': 'application/json'
 }
 });
 
 const data = await response.json();
 
 if (data.message) {
 console.log("Pet deleted successfully");
 // Refresh the pet list after deletion
 fetchPetList();
 // If the deleted pet was the currently displayed pet, handle that case
 if (petData?.id === petId) {
 // You might want to navigate away or clear the current pet data
 setPetData(null);
 await AsyncStorage.removeItem('selectedPet');
 }
 Alert.alert("Success", "Pet profile deleted successfully");
 navigation.navigate('Home')
 } else {
 Alert.alert("Error", "Failed to delete pet");
 }
 } catch (error) {
 console.error("Error deleting pet:", error);
 Alert.alert("Error", "An error occurred while deleting the pet");
 }
 },
 style: "destructive"
 }
 ],
 { cancelable: true }
 );
 };

 const fetchPetList = async () => {
 try {
 const token = await AsyncStorage.getItem('token');
 if (!token) {
 Alert.alert('Authentication Error', 'Please log in again.');
 return;
 }

 const response = await fetch(`https://u76rpadxda.us-east-1.awsapprunner.com/api/pets`, {
 method: 'GET',
 headers: { 
 'Content-Type': 'application/json', 
 Authorization: `Bearer ${token}` 
 },
 });

 const data = await response.json();
 if (data.error) {
 Alert.alert('Error', data.error);
 } else {
 setPetList(data);
 }
 } catch (error) {
 Alert.alert('Error', 'Failed to fetch pet list.');
 }
 };
 const handlePetSelect = async (pet) => {
 setPetData(pet);
 setIsModalVisible(false);
 
 try {
 await AsyncStorage.setItem('selectedPet', JSON.stringify(pet)); // Save selected pet in AsyncStorage
 } catch (error) {
 console.error('Error saving pet:', error);
 }
};
  const updatePetData = async () => {
    if (!petData?.id) {
      Alert.alert("Error", "No pet selected for update.");
      return;
    }

    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Authentication Error', 'Please log in again.');
        return;
      }

      const petId = petData.id;
      const formattedDate = formatDate(petData.date);

      const body = new FormData();
      body.append('name', petData.name);
      body.append('type', petData.type);
      body.append('gender', petData.gender);
      body.append('breed', petData.breed);
      body.append('date', formattedDate);
      body.append('weight', petData.weight);
      body.append('age', petData.age);

      // Append image only if the user selected a new image
      if (newImage) {
        const localUri = newImage;
        const filename = localUri.split('/').pop();
        const fileType = filename.split('.').pop();

        body.append('petimage', {
          uri: localUri,
          name: filename,
          type: `image/${fileType}`,
        });
      }

      const response = await fetch(`https://u76rpadxda.us-east-1.awsapprunner.com/api/petsupdate/${petId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`,
        },
        body: body,
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || "Failed to update pet profile");
      }

      // Update AsyncStorage with the new pet data (including the updated fields)
      await AsyncStorage.setItem('selectedPet', JSON.stringify(petData));
      Alert.alert("Success", responseData.message || "Pet profile updated successfully!");
      setIsEditing(false);
      fetchPetData();  // Fetch the updated data from the server
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  // Move pickImage inside the component so it can access setNewImage and setPetData
  const pickImage = () => {
    const options = {
      mediaType: 'photo',
      maxWidth: 800,
      maxHeight: 800,
      quality: 1,
    };

    launchImageLibrary(options, (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.errorCode) {
        console.log('ImagePicker Error: ', response.errorMessage);
      } else {
        const uri = response.assets[0].uri;
        setNewImage(uri);
        setPetData((prev) => ({ ...prev, petimage: uri }));
      }
    });
  };


 
 if (loading) return <ActivityIndicator size="large" color="#5a4635" style={{ flex: 1 }} />;

 return (
 <View style={{ flex: 1 }}>
 <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }} keyboardShouldPersistTaps="handled">
 <View style={styles.container}>

 <TouchableOpacity style={styles.menuButton} onPress={() => { setIsModalVisible(true); fetchPetList(); }}>
 <Icon name="more-vert" size={24} color="#5a4635" />
 </TouchableOpacity>

 <TouchableOpacity onPress={() => navigation.goBack()}>
 <Image source={require('../assets/back.png')} style={styles.backButton} />
 </TouchableOpacity>

 <TouchableOpacity style={styles.editButton} onPress={() => setIsEditing(!isEditing)}>
 <Icon name="edit" size={24} color="#5a4635" />
 </TouchableOpacity>

 <Text style={styles.title}>Pet Profile</Text>

 <View style={styles.profileImageContainer}>
  <Image
    source={{ uri: newImage || petData?.petimage }}
    style={styles.profileImage}
  />

  {isEditing && (
    <TouchableOpacity style={styles.cameraIcon} onPress={pickImage}>
      <Icon name="photo-camera" size={24} color="#fff" />
    </TouchableOpacity>
  )}
</View>

 <View style={styles.infoContainer}>
 <ProfileItem
 label="Pet Name"
 value={petData?.name}
 isEditing={isEditing}
 onChange={(text) => setPetData({ ...petData, name: text })}
 />

 {/* Pet Type Dropdown */}
 {isEditing ? (
 <View style={styles.profileItem}>
 <Text style={styles.label}>Pet Type</Text>
 <Picker
 selectedValue={petData?.type}
 onValueChange={(itemValue) => {
 setPetData({ ...petData, type: itemValue, breed: '' }); // Reset breed when type changes
 }}
 style={styles.inlinePicker}
 >
 {/* Only show "Select Type" if nothing is selected */}
 {!petData?.type && <Picker.Item label="Select Type" value="" />}
 {/* Show selected type first */}
 {petData?.type && <Picker.Item label={petData.type} value={petData.type} />}
 {/* Then other options excluding the current one */}
 {['dog', 'cat'].filter(opt => opt !== petData?.type).map(opt => (
 <Picker.Item key={opt} label={opt} value={opt} />
 ))}
 </Picker>
 </View>
 ) : (
 <ProfileItem label="Pet Type" value={petData?.type} isEditing={false} />
 )}

 {/* Pet Breed Dropdown */}
 {isEditing ? (
 <View style={styles.profileItem}>
 <Text style={styles.label}>Pet Breed</Text>
 <Picker
 selectedValue={petData?.breed}
 onValueChange={(itemValue) => {
 setPetData({ ...petData, breed: itemValue });
 }}
 style={styles.inlinePicker}
 >
 {!petData?.breed && <Picker.Item label="Select Breed" value="" />}
 {petData?.breed && <Picker.Item label={petData.breed} value={petData.breed} />}
 {(petData?.type === 'dog' ? dogBreeds : petData?.type === 'cat' ? catBreeds : [])
 .filter(b => b !== petData?.breed)
 .map(breed => (
 <Picker.Item key={breed} label={breed} value={breed} />
 ))}
 </Picker>
 </View>
 ) : (
 <ProfileItem label="Pet Breed" value={petData?.breed } isEditing={false} />
 )}

 <ProfileItem
 label="Pet Age"
 value={petData?.age}
 isEditing={isEditing}
 onChange={(text) => setPetData({ ...petData, age: text })}
 />
 <ProfileItem
 label="Pet Weight (kg)"
 value={petData?.weight}
 isEditing={isEditing}
 onChange={(text) => setPetData({ ...petData, weight: text })}
 />

 {/* Gender Dropdown */}
 {isEditing ? (
 <View style={styles.profileItem}>
 <Text style={styles.label}>Gender</Text>
 <Picker
 selectedValue={petData?.gender}
 onValueChange={(itemValue) => {
 setPetData(prev => ({ ...prev, gender: itemValue }));
 }}
 style={styles.inlinePicker}
 >
 {!petData?.gender && <Picker.Item label="Select Gender" value="" />}
 {petData?.gender && <Picker.Item label={petData.gender} value={petData.gender} />}
 {['male', 'female'].filter(opt => opt !== petData?.gender).map(opt => (
 <Picker.Item key={opt} label={opt} value={opt} />
 ))}
 </Picker>
 </View>
 ) : (
 <ProfileItem
 label="Gender"
 value={petData?.gender}
 isEditing={false}
 />
 )}
</View>



 {isEditing && (
 <View style={styles.buttonsContainer}>
 {/* Cancel Button */}
<TouchableOpacity
  style={[styles.cancelButton, styles.flexButton]}
  onPress={async () => {
    const storedPet = await AsyncStorage.getItem('selectedPet');
    if (storedPet) {
      const pet = JSON.parse(storedPet);
      setPetData(pet);      // restore original pet data
      setNewImage(null);    // discard selected image
    }
    setIsEditing(false);     // exit edit mode
  }}
>
  <Text style={styles.cancelButtonText}>Cancel</Text>
</TouchableOpacity>


 {/* Save Button */}
 <TouchableOpacity
 style={[styles.button, styles.flexButton]}
 onPress={() => {
 updatePetData(); 
 }}
 >
 <Text style={styles.buttonText}>Save</Text>
 </TouchableOpacity>
 </View>
)}
 </View>

 <Modal
 animationType="slide"
 transparent={true}
 visible={isModalVisible}
 onRequestClose={() => setIsModalVisible(false)}
 >
 <View style={styles.modalContainer}>
 <View style={styles.modalContent}>
 <Text style={styles.modalTitle}>Your Pets</Text>

 {petList.length === 0 ? (
 <Text style={styles.noPetsText}>No pets found.</Text>
) : (
 <ScrollView style={styles.petListContainer}>
 {petList.map((pet) => (
 <View key={pet.id} style={styles.petItem}>
 {/* Pet Name and Delete Button in one row */}
 <TouchableOpacity
 style={styles.petInfo}
 onPress={() => handlePetSelect(pet)}
 >
 <Icon name="pets" size={20} color="#fff" />
 <Text style={styles.petName}>{pet.name}</Text>
 </TouchableOpacity>

 {/* Delete Button - Now aligned next to pet name */}
 <TouchableOpacity
 style={styles.deleteButton}
 onPress={() => handleDeletePet(pet.id)}
 >
 <Icon name="delete" size={25} color="#fff" />
 </TouchableOpacity>
 </View>
 ))}
 </ScrollView>
)}

 <TouchableOpacity style={styles.modalCloseButton} onPress={() => setIsModalVisible(false)}>
 <Text style={styles.modalCloseButtonText}>Close</Text>
 </TouchableOpacity>
 </View>
 </View>
 </Modal>

 <Footer />
 </ScrollView>
 </View>
 );
};
const ProfileItem = ({ label, value, isEditing, onChange }) => (
 <View style={styles.profileItem}>
 <Text style={styles.label}>{label}</Text>
 {isEditing ? (
 <TextInput style={styles.input} value={value} onChangeText={onChange} placeholder={`Enter ${label}`} />
 ) : (
 <Text style={styles.value}>{value}</Text>
 )}
 </View>
);


const styles = StyleSheet.create({
 container: {
 flex: 1,
 backgroundColor: '#e0cfc7',
 padding: 20,
 },
 backButton: {
 width: 20,
 height: 20,
 marginRight: 25,
 marginTop: 33,
 },
 pickerContainer: {
 borderWidth: 1,
 borderColor: '#ccc',
 borderRadius: 8,
 marginBottom: 10,
 },
 label: {
 fontWeight: '600',
 fontSize: 14,
 color: '#6c4b3c',
 flex: 1,
 marginRight: 10,
 },
 editButton: {
 position: 'absolute',
 top: 330,
 right: 30,
 zIndex: 1,
 },
 menuButton: {
 position: 'absolute',
 top: 50,
 right: 20,
 zIndex: 1,
 },
 title: {
 fontSize: 22,
 fontWeight: 'bold',
 color: '#6c4b3c',
 textAlign: 'center',
 marginBottom: 20,
 marginTop: 50,
 },
 profileImageContainer: {
 alignItems: 'center',
 marginBottom: 20,
 },
 profileImage: {
 width: 120,
 height: 120,
 borderRadius: 60,
 borderWidth: 3,
 borderColor: '#6c4b3c',
 },
 cameraIcon: {
 position: 'absolute',
 bottom: 0,
 right: 110,
 backgroundColor: '#6c4b3c',
 borderRadius: 20,
 padding: 6,
 elevation: 5,
 },
 infoContainer: {
 marginTop: 70,
 backgroundColor: '#fff',
 padding: 20,
 borderRadius: 12,
 shadowColor: '#000',
 shadowOpacity: 0.1,
 shadowRadius: 5,
 elevation: 3,
 },
 profileItem: {
 flexDirection: 'row',
 justifyContent: 'space-between',
 alignItems: 'center',
 borderBottomWidth: 1,
 borderBottomColor: '#eee',
 paddingBottom: 6,
 marginBottom: 15,
 },
 inlinePicker: {
 flex: 1,
 height: 55,
 color: '#6c4b3c',
 marginTop: -25,
 marginBottom: -4,
 },
 value: {
 fontSize: 16,
 color: '#333',
 flex: 2,
 textAlign: 'right',
 },
 input: {
 fontSize: 16,
 color: '#6c4b3c',
 flex: 2,
 textAlign: 'right',
 borderBottomWidth: 1,
 borderBottomColor: '#ddd',
 paddingVertical: 5,
 },
 pickerWrapper: {
 flex: 2,
 justifyContent: 'center',
 alignItems: 'flex-end',
 borderBottomWidth: 1,
 borderBottomColor: '#ddd',
 height: 40,
 },
 picker: {
 width: '100%',
 color: '#6c4b3c',
 fontSize: 16,
 height: 40,
 },
 buttonsContainer: {
 flexDirection: 'row',
 justifyContent: 'space-between',
 alignItems: 'center',
 marginTop: 10,
 marginBottom: 30,
 },
 flexButton: {
 flex: 1,
 marginHorizontal: 5,
 },
 button: {
 backgroundColor: '#6c4b3c',
 paddingVertical: 17,
 borderRadius: 25,
 alignItems: 'center',
 },
 buttonText: {
 color: 'white',
 fontWeight: 'bold',
 fontSize: 16,
 },
 cancelButton: {
 borderColor: '#6c4b3c',
 borderWidth: 1,
 paddingVertical: 15,
 borderRadius: 25,
 alignItems: 'center',
 },
 cancelButtonText: {
 color: '#6c4b3c',
 fontWeight: 'bold',
 fontSize: 16,
 },
 modalContainer: {
 flex: 1,
 justifyContent: 'center',
 alignItems: 'center',
 backgroundColor: 'rgba(0, 0, 0, 0.5)',
 },
 modalContent: {
 width: '80%',
 backgroundColor: '#fff',
 borderRadius: 10,
 padding: 20,
 alignItems: 'center',
 },
 modalButton: {
 backgroundColor: '#6c4b3c',
 padding: 10,
 borderRadius: 5,
 marginTop: 10,
 width: '100%',
 alignItems: 'center',
 },
 modalButtonText: {
 color: '#fff',
 fontWeight: 'bold',
 },
 iconTextContainer: {
 flexDirection: 'row',
 alignItems: 'center',
 backgroundColor: "#6c4b3c",
 },
 icon: {
 marginRight: 10,
 },
 modalCloseButton: {
 marginTop: 10,
 },
 modalCloseButtonText: {
 color: '#8B4513',
 fontWeight: 'bold',
 },
 modalTitle: {
 fontSize: 18,
 fontWeight: 'bold',
 color: '#5a4635',
 marginBottom: 10,
 },
 petListContainer: {
 maxHeight: 200,
 width: '100%',
 },
 petItem: {
 flexDirection: 'row',
 alignItems: 'center',
 justifyContent: 'space-between',
 backgroundColor: '#a0765b',
 padding: 15,
 borderRadius: 10,
 marginVertical: 5,
 },
 petInfo: {
 flexDirection: 'row',
 alignItems: 'center',
 },
 petName: {
 color: '#fff',
 fontSize: 16,
 marginLeft: 10,
 },
 deleteButton: {
 padding: 6,
 },
 noPetsText: {
 color: '#5a4635',
 fontSize: 16,
 marginVertical: 10,
 },
});

export default PetProfile;



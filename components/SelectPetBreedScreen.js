import React, { useState } from 'react';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, Image } from 'react-native';

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

const SelectPetBreedScreen = ({ navigation, route }) => {
  const { petType, petName, gender } = route.params; // Destructure all params from route
  const [searchText, setSearchText] = useState('');
  const [selectedBreed, setSelectedBreed] = useState(null); // State to manage the selected breed

  const breeds = petType === 'cat' ? catBreeds : dogBreeds;

  const filteredBreeds = breeds.filter(breed =>
    breed.toLowerCase().startsWith(searchText.toLowerCase())
  );

  const currentStep = 4;
  const totalSteps = 7;
  const progressWidth = `${(currentStep / totalSteps) * 100}%`;

  const handleBreedSelection = (breed) => {
    setSelectedBreed(breed); // Update the selected breed
    setSearchText(breed); // Update search text to reflect the selected breed
  };

  return (
    <View style={styles.container}>
      <View style={styles.topContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Image source={require('../assets/back.png')} style={styles.back} />
        </TouchableOpacity>

        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: progressWidth }]} />
        </View>
      </View>

      <Text style={styles.title}>Pick {petName}'s breed</Text>

      <View style={styles.searchAndMixedContainer}>
        <View style={styles.searchBarContainer}>
          <TextInput
            style={styles.searchBar}
            placeholder="Search"
            value={searchText}
            onChangeText={setSearchText}
          />
          <TouchableOpacity style={styles.searchIcon}>
            <Icon name="search" size={20} color="#5a4635" />
          </TouchableOpacity>
        </View>
        
       
      </View>

      <FlatList
        data={filteredBreeds}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.breedItem, selectedBreed === item && { backgroundColor: '#e0d6d1' }]} // Highlight selected breed
            onPress={() => handleBreedSelection(item)}
          >
            <Text style={styles.breedText}>{item}</Text>
          </TouchableOpacity>
        )}
      />

      {selectedBreed && (
        <View style={{ marginTop: 20 }}>
          <Text style={{ color: '#5a4635', fontSize: 16, fontWeight: '500' }}>
            Selected Breed: {selectedBreed}
          </Text>
          <TouchableOpacity
            style={styles.nextButton}
            onPress={() =>
              navigation.navigate('PetAgeInputScreen', {
                petName,
                petType,
                gender,
                selectedBreed // Pass all previous data
              })
            }
          >
            <Text style={styles.nextButtonText}>Next</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e0cfc7',
    padding: 20,
  },
  title: {
    marginTop: 50,
    textAlign: 'left',
    fontSize: 22,
    fontWeight: '600',
    color: '#5a4635',
    marginBottom: 15,
  },
  topContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: '100%',
    marginTop: 40,
  },
  back: {
    width: 20,
    height: 20,
    marginRight: 25,
  },
  progressBarContainer: {
    flex: 1,
    height: 10,
    backgroundColor: '#E0E0E0',
    borderRadius: 5,
    marginTop: 5,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#6c4b3c',
  },
  searchAndMixedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    borderWidth: 1,
    borderColor: '#c2b8b2',
    borderRadius: 25,
    backgroundColor: '#fff',
    marginRight: 10,
  },
  searchBar: {
    flex: 1,
    height: 45,
    paddingLeft: 15,
  },
  searchIcon: {
    width: 45,
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e0d6d1',
    borderTopRightRadius: 25,
    borderBottomRightRadius: 25,
  },
  breedItem: {
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0d6d1',
    marginBottom: 5,
  },
  breedText: {
    fontSize: 16,
    fontWeight: '400',
    color: '#5a4635',
  },
  nextButton: {
    backgroundColor: '#6c4b3c',
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 20,
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
});

export default SelectPetBreedScreen;

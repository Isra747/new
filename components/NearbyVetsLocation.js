import React, { useState, useEffect, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, TouchableOpacity, FlatList, StyleSheet, Image, ActivityIndicator
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';

const NearbyVetsScreen = ({ navigation }) => {
  const [location, setLocation] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [vets, setVets] = useState([]);
  const [showVets, setShowVets] = useState(false);
  const [search, setSearch] = useState('');
  const [filteredVets, setFilteredVets] = useState([]);
  const [selectedVet, setSelectedVet] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const mapRef = useRef(null);

  const API_KEY = 'AIzaSyCPnC7pCS8_0cFSfJb20Y2IFYNb50QYZ0E';
  const BASE_URL = 'https://maps.googleapis.com';

  // ✅ Fetch current location every time screen is focused
  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;

      const fetchLocation = async () => {
        setLoadingLocation(true);
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== 'granted') {
            alert('Location permission denied. Using fallback location.');
            const fallback = { latitude: 32.1617, longitude: 74.1883 };
            if (isActive) {
              setLocation(fallback);
              centerMap(fallback);
              setLoadingLocation(false);
            }
            return;
          }

          const userLocation = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.BestForNavigation,
          });

          const coords = {
            latitude: userLocation.coords.latitude,
            longitude: userLocation.coords.longitude,
          };

          if (isActive) {
            setLocation(coords);
            centerMap(coords);
            setLoadingLocation(false);
          }
        } catch (e) {
          console.error('Location error:', e);
          const fallback = { latitude: 32.1617, longitude: 74.1883 };
          if (isActive) {
            setLocation(fallback);
            centerMap(fallback);
            setLoadingLocation(false);
          }
        }
      };

      fetchLocation();
      return () => { isActive = false; };
    }, [navigation])
  );

  const centerMap = (coords) => {
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: coords.latitude,
        longitude: coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }, 1000);
    }
  };

  const fetchNearbyVets = async () => {
    if (!location) {
      alert('Location not available yet. Please wait.');
      return;
    }

    try {
      setShowVets(true);
      const response = await fetch(
        `${BASE_URL}/maps/api/place/nearbysearch/json?` +
        new URLSearchParams({
          location: `${location.latitude},${location.longitude}`,
          radius: '3000',
          keyword: 'veterinary',
          key: API_KEY,
        })
      );

      const data = await response.json();

      if (!data.results || data.results.length === 0) {
        alert('No vet clinics found nearby.');
        setShowVets(false);
        return;
      }

      const fetchedVets = data.results.map((vet, index) => ({
        id: vet.place_id || `${index}`,
        name: vet.name || 'Unknown Vet',
        rating: vet.rating !== undefined ? vet.rating : '',
        address: vet.vicinity || vet.formatted_address || 'No address',
        latitude: vet.geometry?.location?.lat || 0,
        longitude: vet.geometry?.location?.lng || 0,
      }));

      setVets(fetchedVets);
      setFilteredVets(fetchedVets);

      if (mapRef.current && fetchedVets.length > 0) {
        const coordinates = [
          { latitude: location.latitude, longitude: location.longitude },
          ...fetchedVets.map(vet => ({ latitude: vet.latitude, longitude: vet.longitude })),
        ];
        mapRef.current.fitToCoordinates(coordinates, {
          edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
          animated: true,
        });
      }
    } catch (err) {
      console.error('Error fetching vets:', err);
      alert('Failed to fetch vets. Check your network or API key.');
      setShowVets(false);
    }
  };

  const fetchDirections = async (vet) => {
    if (!location || !vet) return;

    try {
      const response = await fetch(
        `${BASE_URL}/maps/api/directions/json?` +
        new URLSearchParams({
          origin: `${location.latitude},${location.longitude}`,
          destination: `${vet.latitude},${vet.longitude}`,
          key: API_KEY,
        })
      );

      const data = await response.json();
      if (data.status !== 'OK' || !data.routes?.[0]) {
        alert('No route found.');
        setRouteCoordinates([]);
        return;
      }

      const encodedPolyline = data.routes[0].overview_polyline.points;
      setRouteCoordinates(decodePolyline(encodedPolyline));

      mapRef.current.fitToCoordinates([
        { latitude: location.latitude, longitude: location.longitude },
        { latitude: vet.latitude, longitude: vet.longitude },
      ], { edgePadding: { top: 50, right: 50, bottom: 50, left: 50 }, animated: true });
    } catch (e) {
      console.error('Directions error:', e);
      alert('Failed to fetch directions.');
      setRouteCoordinates([]);
    }
  };

  const decodePolyline = (encoded) => {
    let points = [], index = 0, lat = 0, lng = 0;

    while (index < encoded.length) {
      let b, shift = 0, result = 0;
      do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
      lat += (result & 1) ? ~(result >> 1) : (result >> 1);

      shift = 0; result = 0;
      do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
      lng += (result & 1) ? ~(result >> 1) : (result >> 1);

      points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
    }

    return points;
  };

  const handleVetSelection = (vet) => {
    setSelectedVet(vet);
    setFilteredVets([vet]);
    fetchDirections(vet);
  };

  const handleBackPress = () => navigation.goBack();

  useEffect(() => {
    if (!selectedVet && vets.length > 0) {
      setFilteredVets(vets.filter(vet => vet.name.toLowerCase().includes(search.toLowerCase())));
      setShowVets(true);
    }
  }, [search, vets, selectedVet]);

  return (
    <View style={{ flex: 1 }}>
      <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
        <Image source={require('../assets/back.png')} style={styles.back} />
      </TouchableOpacity>

      {loadingLocation ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#6c4b3c" />
          <Text>Fetching your location...</Text>
        </View>
      ) : (
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          initialRegion={{
            latitude: location?.latitude || 32.1617,
            longitude: location?.longitude || 74.1883,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
        >
          {location && <Marker coordinate={location} title="You" pinColor="blue" />}
          {showVets && !selectedVet && vets.map(vet => (
            <Marker
              key={vet.id}
              coordinate={{ latitude: vet.latitude, longitude: vet.longitude }}
              title={vet.name}
              description={vet.address}
              onPress={() => handleVetSelection(vet)}
              pinColor="red"
            />
          ))}
          {selectedVet && (
            <Marker
              coordinate={{ latitude: selectedVet.latitude, longitude: selectedVet.longitude }}
              title={selectedVet.name}
              description={selectedVet.address}
              pinColor="red"
            />
          )}
          {routeCoordinates.length > 0 && (
            <Polyline coordinates={routeCoordinates} strokeColor="#0000FF" strokeWidth={3} />
          )}
        </MapView>
      )}

      {!loadingLocation && !showVets && (
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.locateButton} onPress={fetchNearbyVets}>
            <Text style={styles.buttonText}>Locate Nearby Vets</Text>
          </TouchableOpacity>
        </View>
      )}

      {showVets && (
        <View style={styles.vetsListContainer}>
          <Text style={styles.title}>Vet List</Text>
          <FlatList
            data={filteredVets}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => handleVetSelection(item)} style={styles.vetItem}>
                <Text style={styles.vetName}>{item.name} - ⭐{item.rating}</Text>
                <Text style={styles.vetAddress}>{item.address}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {selectedVet && (
        <View style={styles.selectedVetContainer}>
          <TouchableOpacity onPress={() => {
            setSelectedVet(null);
            setFilteredVets(vets);
            setRouteCoordinates([]);
          }} style={styles.closeIcon}>
            <Text style={styles.closeText}>×</Text>
          </TouchableOpacity>
          <Text style={styles.selectedVetText}>Selected Vet: {selectedVet.name}</Text>
          <Text style={styles.selectedVetText}>Address: {selectedVet.address}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  backButton: { position: 'absolute', top: 30, left: 10, zIndex: 10 },
  back: { width: 20, height: 20, margin: 10 },
  loaderContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#e0cfc7',
  },
  buttonContainer: {
    position: 'absolute', top: 550, left: '1%', right: '1%', height: 500,
    backgroundColor: 'rgba(217, 204, 197, 0.9)', padding: 10,
    borderRadius: 10, alignItems: 'center',
  },
  locateButton: {
    backgroundColor: '#6c4b3c', marginTop: 100, width: 200, height: 50,
    padding: 10, borderRadius: 8, alignItems: 'center', justifyContent: 'center',
  },
  buttonText: { color: 'white', fontWeight: 'bold', fontSize: 18 },
  vetsListContainer: {
    position: 'absolute', bottom: 0, width: '100%',
    backgroundColor: '#e0cfc7', padding: 10, maxHeight: 250,
  },
  title: { color: 'black', fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
  vetItem: { backgroundColor: '#F5F0EB', padding: 10, marginBottom: 5, borderRadius: 5 },
  vetName: { fontWeight: 'bold' },
  vetAddress: { color: 'gray' },
  selectedVetContainer: {
    position: 'absolute', bottom: 20, backgroundColor: 'white',
    padding: 10, borderRadius: 5, width: '80%', left: '10%', elevation: 5,
  },
  selectedVetText: { fontWeight: 'bold' },
  closeIcon: { position: 'absolute', top: 5, right: 5, padding: 4, zIndex: 1 },
  closeText: { fontSize: 20, fontWeight: 'bold', color: 'gray' },
});

export default NearbyVetsScreen;

import React, { useEffect, useState } from "react";
import { Text, View, StyleSheet, FlatList, ScrollView, Dimensions, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import Footer from "./Footer";
import axios from "axios";
import AsyncStorage from '@react-native-async-storage/async-storage';


const HeartRate = ({ navigation }) => {
  const [heartRateData, setHeartRateData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCollarConnected, setIsCollarConnected] = useState(true);


  // Fetch data from your API
  const fetchHeartRate = async () => {
    console.log('📦 Fetching selected pet for heart rate...');
    try {
      const petString = await AsyncStorage.getItem('selectedPet');
      if (!petString) throw new Error('No selected pet found');
      const pet = JSON.parse(petString);
      const petId = pet?.id;
      if (!petId) throw new Error('Invalid pet ID');
  
      console.log('🐾 Fetching heart rate for pet ID:', petId);
  
      const response = await axios.get("https://u76rpadxda.us-east-1.awsapprunner.com/heart-rate", {
        params: { pet_id: petId }
      });
  
      console.log('✅ Heart rate data:', response.data);
      setHeartRateData(response.data);
      setIsCollarConnected(true);
    } catch (error) {
      const status = error?.response?.status;
  
      // ✅ Gracefully fallback without warning
      if (status === 403) {
        console.log('ℹ️ Pet not linked to collar — no heart rate to show.');
        setIsCollarConnected(false);
      } else {
        console.error("❌ Error fetching heart rate:", error);
      }
  
      setHeartRateData([]);
    } finally {
      setLoading(false);
    }
  };
  

  useEffect(() => {
    fetchHeartRate();
  }, []);

  const validData = heartRateData.filter(item =>
    typeof item.bpm === 'number' &&
    isFinite(item.bpm) &&
    typeof item.time === 'string'
  );
  
  const bpmData = validData.map(item => item.bpm);
  const labels = validData.map(item => item.time);
  const averageBPM = (bpmData.reduce((sum, bpm) => sum + bpm, 0) / (bpmData.length || 1)).toFixed(1);
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'Normal': return '#4CAF50';
      case 'Elevated': return '#FFC107';
      case 'High': return '#F44336';
      default: return '#000';
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.item}>
      <Text style={styles.time}>{item.time}</Text>
      <Text style={styles.bpm}>{item.bpm} BPM</Text>
      <Text style={[styles.status, { color: getStatusColor(item.status) }]}>
        {item.status}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#744e38" />
        <Text>Fetching Heart Rate Data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Image source={require('../assets/back.png')} style={styles.back} />
      </TouchableOpacity>
      {/* <Text style={{ textAlign: 'center', color: isCollarConnected ? 'green' : 'red', marginTop: 5 }}>
  {isCollarConnected ? '🟢 Collar is connected!' : '🔴 Pet not connected to collar'}
</Text> */}


      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 80 }}>
      {bpmData.length > 0 && (
  <View style={styles.chartContainer}>
    <Text style={styles.chartTitle}>Heart Rate Over Time</Text>
    <LineChart
      data={{
        labels: labels,
        datasets: [{ data: bpmData }]
      }}
      width={Dimensions.get('window').width - 50}
      height={220}
      yAxisSuffix=" BPM"
      chartConfig={{
        backgroundColor: '#e3d6d0',
        backgroundGradientFrom: '#e3d6d0',
        backgroundGradientTo: '#e3d6d0',
        decimalPlaces: 0,
        color: (opacity = 1) => `rgba(116, 78, 56, ${opacity})`,
        labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
        style: { borderRadius: 16 },
        propsForDots: { r: '4', strokeWidth: '2', stroke: '#744e38' },
      }}
      bezier
      style={{ marginVertical: 8, borderRadius: 16 }}
      fromZero
      withVerticalLines={false}
      withHorizontalLines={false}
      segments={4}
      formatXLabel={(value) => (labels.indexOf(value) % 2 === 0 ? value : '')}
    />
  </View>
)}


        <View style={styles.statsContainer}>
          <Text style={styles.statsTitle}>Statistics</Text>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{averageBPM} BPM</Text>
              <Text style={styles.statLabel}>Average</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{Math.min(...bpmData)} BPM</Text>
              <Text style={styles.statLabel}>Min</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{Math.max(...bpmData)} BPM</Text>
              <Text style={styles.statLabel}>Max</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Recent Readings</Text>
        <FlatList data={heartRateData} renderItem={renderItem} keyExtractor={item => item.id?.toString() || Math.random().toString()} scrollEnabled={false} />
      </ScrollView>

      <View style={styles.footerContainer}>
        <Footer />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#e0cfc7', padding: 20 },
  backButton: { marginTop: 30, marginBottom: 10 },
  back: { width: 20, height: 20 },
  chartContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginTop: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    alignItems: 'center',
  },
  chartTitle: { fontSize: 18, fontWeight: '600', marginBottom: 10, textAlign: 'center' },
  statsContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  statsTitle: { fontSize: 18, fontWeight: '600', marginBottom: 10, textAlign: 'center' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statBox: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: 18, fontWeight: 'bold', color: '#744e38' },
  statLabel: { fontSize: 14, color: '#555' },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 20 },
  item: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 15, marginVertical: 5, backgroundColor: '#f9f9f9',
    borderRadius: 10, width: '100%',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 5, elevation: 3,
  },
  time: { fontWeight: 'bold' },
  bpm: { fontSize: 16 },
  status: { fontSize: 14 },
  footerContainer: { position: "absolute", bottom: 0, left: 0, right: 0 },
});

export default HeartRate;
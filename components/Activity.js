import React, { useState, useEffect } from "react";
import { Text, View, StyleSheet, Dimensions, ScrollView, TouchableOpacity, Image } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import Footer from "./Footer";
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';


const Activity = ({ navigation }) => {
  const [activityData, setActivityData] = useState({
    motionState: 'Stable',
    chartData: null,
    loading: true,
    error: null
  });
const [calmDuration, setCalmDuration] = useState(0);
const [activeDuration, setActiveDuration] = useState(0);
const [suddenMoves, setSuddenMoves] = useState(0);
const [motionHistory, setMotionHistory] = useState([]);



const fetchMotionData = async () => {
  try {
    const petString = await AsyncStorage.getItem('selectedPet');
    if (!petString) throw new Error('No selected pet');
    const pet = JSON.parse(petString);
    const petId = pet?.id;
    if (!petId) throw new Error('Invalid pet ID');

    const response = await axios.get('https://u76rpadxda.us-east-1.awsapprunner.com/api/motion-data/history', {
      params: { pet_id: petId, limit: 10 }
    });
    const history = response.data;

    const latestEntry = history[history.length - 1];
    const motionState = latestEntry?.motion_state || 'Stable';
    const chartData = generateChartDataFromHistory(history);
    await fetchSummaryData(petId); 
    setMotionHistory(history);
    setActivityData({ motionState, chartData, loading: false, error: null });
  } catch (error) {
    console.error('Error fetching motion data:', error);
    setActivityData(prev => ({ ...prev, loading: false, error: 'Failed to load motion data' }));
  }
};

  const generateChartDataFromHistory = (history) => {
    const labels = history.map(entry =>
      new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', hour12: true })
    );
  
    const dataPoints = history.map(entry => {
      switch (entry.motion_state.toUpperCase()) {    
        case 'STABLE':
          return 30;  // Lower value for stable (calm) state
        case 'MOVING':
          return 70;  // Higher value for moving state
        case 'HIT/CRASH':
          return 100; // Max value for hit/crash (spike)
        default:
          return 30;  // Default to stable
      }
    });
  
    return {
      labels,
      datasets: [{
        data: dataPoints,
        color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
        strokeWidth: 2
      }]
    };
  };

  const calculateSummaryFromHistory = (history) => {
    let calm = 0;
    let active = 0;
    let hits = 0;
  
    const now = new Date();
    const today = now.toDateString();
  
    history.forEach(entry => {
      const entryDate = new Date(entry.timestamp);
      if (entryDate.toDateString() !== today) return;
  
      switch (entry.motion_state.toUpperCase()) {
        case 'STABLE':
          calm++;
          break;
        case 'MOVING':
          active++;
          break;
        case 'HIT/CRASH':
          hits++;
          break;
      }
    });
  
    const minutesPerEntry = 1; // adjust if your entries are more/less frequent
  
    setCalmDuration(calm * minutesPerEntry);      // now in minutes
    setActiveDuration(active * minutesPerEntry);  // now in minutes
    setSuddenMoves(hits);
  };
  const fetchSummaryData = async (petId) => {
    try {
      const response = await axios.get('https://u76rpadxda.us-east-1.awsapprunner.com/api/motion-data/summary-today', {
        params: { pet_id: petId }
      });
      const { calmDuration, activeDuration, suddenMoves } = response.data;
      setCalmDuration(calmDuration);
      setActiveDuration(activeDuration);
      setSuddenMoves(suddenMoves);
    } catch (err) {
      console.error("Failed to fetch summary data", err);
    }
  };
  
  useEffect(() => {
    fetchMotionData();
  }, []);
  

  const getStateColor = (state) => {
    switch (state) {
      case 'STABLE': return '#4CAF50';
      case 'MOVING': return '#2196F3';
      case 'HIT/CRASH': return '#F44336';
      default: return '#4CAF50';
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Image source={require('../assets/back.png')} style={styles.back} />
      </TouchableOpacity>

      {activityData.error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{activityData.error}</Text>
          <TouchableOpacity onPress={fetchMotionData} style={styles.retryButton}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {activityData.loading && (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading activity data...</Text>
        </View>
      )}

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
      <View style={styles.motionCard}>
  <Text style={styles.motionTitle}>Current Motion State</Text>
  <View style={[
    styles.motionPill,
    { backgroundColor: getStateColor(activityData.motionState) }
  ]}>
    <Text style={styles.motionPillText}>{activityData.motionState.toUpperCase()}</Text>
  </View>
</View>


        <Text style={styles.sectionTitle}>Today's Activity Overview</Text>
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: '#e6f4ea' }]}>
            <Text style={styles.cardEmoji}>🛌</Text>
            <Text style={styles.summaryLabel}>Calm Time</Text>
            <Text style={styles.summaryValue}>{calmDuration} min</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: '#e3f2fd' }]}>
            <Text style={styles.cardEmoji}>🏃</Text>
            <Text style={styles.summaryLabel}>Active Time</Text>
            <Text style={styles.summaryValue}>{activeDuration} min</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: '#ffebee' }]}>
            <Text style={styles.cardEmoji}>⚠️</Text>
            <Text style={styles.summaryLabel}>Sudden Moves</Text>
            <Text style={styles.summaryValue}>{suddenMoves}</Text>
          </View>
        </View>

        {activityData.chartData && (
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Motion Activity</Text>
            <LineChart
  data={activityData.chartData}
  width={Dimensions.get('window').width - 50}
  height={220}
  yAxisSuffix=""

  chartConfig={{
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    propsForDots: {
      r: '5',
      strokeWidth: '2',
      stroke: getStateColor(activityData.motionState)
    },
    yAxisInterval: 20,  // Adjust this to add more vertical spacing
  }}
  bezier
  style={styles.chart}
/>

          </View>
        )}

        {/* Recent Timeline */}
        <View style={styles.timelineContainer}>
  <Text style={styles.chartTitle}>Recent Activity</Text>
  {motionHistory.slice(0, 4).map((entry, index) => {
    const time = new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    const motion = entry.motion_state.toUpperCase();

    let emoji = '🛌';
    if (motion === 'MOVING') emoji = '🐾';
    else if (motion === 'HIT/CRASH') emoji = '⚠️';

    return (
      <View key={index} style={styles.timelineItem}>
        <Text>🕒 {time} – {emoji} {motion}</Text>
      </View>
    );
  })}
</View>

      </ScrollView>

      <View style={styles.footerContainer}>
        <Footer />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e7d7cd',
    padding: 20,
  },
  backButton: {
    marginBottom: 30,
    marginTop: 10,
  },
  back: {
    width: 24,
    height: 24,
    marginTop:20
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 10,
    color: '#333',
  },
  stateContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  stateTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  stateIndicator: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  stateText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    marginHorizontal: 6,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
  },
  cardEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#444',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 4,
  },
  chartContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  chart: {
    borderRadius: 16,
  },
  timelineContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    elevation: 3,
  },
  timelineItem: {
    paddingVertical: 6,
  },
  footerContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
    alignItems: 'center',
  },
  errorText: {
    color: '#d32f2f',
    marginBottom: 5,
  },
  retryButton: {
    backgroundColor: '#1976d2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 3,
  },
  retryText: {
    color: 'white',
  },
  loadingContainer: {
    padding: 10,
    alignItems: 'center',
  },
  loadingText: {
    color: '#555',
  },
  motionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingVertical: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  
  motionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333',
  },
  
  motionPill: {
    paddingVertical: 12,
    paddingHorizontal: 36,
    borderRadius: 20,
    backgroundColor: '#4CAF50',
  },
  
  motionPillText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  
});

export default Activity; 
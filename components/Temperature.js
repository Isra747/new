import React, { useState, useEffect } from "react";
import { Text, View, StyleSheet, FlatList, Dimensions, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import Footer from "./Footer";
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Temperature = ({ navigation }) => {
  const [temperatureData, setTemperatureData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState(null);
  const [error, setError] = useState(null);
  const [isCollarConnected, setIsCollarConnected] = useState(true);
  

  useEffect(() => {
    fetchTemperatureData();
  }, []);

  const fetchTemperatureData = async () => {
    try {
      const petString = await AsyncStorage.getItem('selectedPet');
      if (!petString) throw new Error('No selected pet found');
      const pet = JSON.parse(petString);
      const petId = pet?.id;
      if (!petId) throw new Error('Invalid pet ID');
  
      const res = await axios.get('https://u76rpadxda.us-east-1.awsapprunner.com/api/temperature-data/history', {
        params: { limit: 10, pet_id: petId }
      });
  
      setTemperatureData(res.data);
      console.log("🌡️ Temperature data:", res.data);
      generateChartData(res.data);
      setIsCollarConnected(true);
    } catch (err) {
      const status = err?.response?.status;
      if (status === 403) {
        console.warn('🔒 Pet not connected to collar');
        setIsCollarConnected(false);
      } else {
        console.error("Failed to fetch temperature data", err);
        setError("Failed to load data");
      }
  
      setTemperatureData([]);
    } finally {
      setLoading(false); // ✅ Move this here so it's called regardless
    }
  };
  
  

  const generateChartData = (data) => {
    const sorted = [...data].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  
    const labels = sorted.map((entry, index) =>
      index % 2 === 0
        ? new Date(entry.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
          })
        : ''
    );
  
    const values = sorted.map(entry => entry.temperature_f);  // Use temperature_f for Fahrenheit
  
    setChartData({
      labels,
      datasets: [
        {
          data: values,
          color: (opacity = 1) => `rgba(134, 65, 244, ${opacity})`,
          strokeWidth: 2,
        },
      ],
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Normal': return '#4CAF50';
      case 'Elevated': return '#FFC107';
      case 'High': return '#F44336';
      default: return '#000';
    }
  };

  const renderItem = ({ item }) => {
    const time = new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    
    // Safeguard against null temperature (use temperature_f directly)
const temperature =
  typeof item.temperature_f === 'number'
    ? item.temperature_f.toFixed(1)
    : '--';

    
    return (
      <View style={styles.item}>
        <Text style={styles.time}>{time}</Text>
      <Text style={styles.value}>{`${temperature} °F`}</Text>  
        <Text style={[styles.status, { color: getStatusColor(item.status) }]}>{item.status}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Image source={require('../assets/back.png')} style={styles.back} />
      </TouchableOpacity>

      {loading ? (
        <ActivityIndicator size="large" color="#000" style={{ marginTop: 40 }} />
      ) : error ? (
        <Text style={{ color: 'red', textAlign: 'center' }}>{error}</Text>
      ) : (
        <>
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Temperature Over Time</Text>
            {chartData && (
              <LineChart
                data={chartData}
                width={Dimensions.get('window').width - 40}
                height={200}
                yAxisSuffix=" °F"
                chartConfig={{
                  backgroundColor: '#f9f9f9',
                  backgroundGradientFrom: '#f9f9f9',
                  backgroundGradientTo: '#f9f9f9',
                  decimalPlaces: 1,
                  color: (opacity = 1) => `rgba(134, 65, 244, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  propsForDots: {
                    r: '4',
                    strokeWidth: '2',
                    stroke: '#8641f4',
                  },
                }}
                bezier
                style={styles.chart}
              />
            )}
          </View>

          <FlatList
            data={temperatureData}
            renderItem={renderItem}
            keyExtractor={(item, index) => index.toString()}
            style={styles.list}
            contentContainerStyle={styles.listContent}
          />
        </>
      )}

      <Footer />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#e0cfc7', padding: 10 },
  chartContainer: {
    backgroundColor: '#fff', borderRadius: 10, padding: 10, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 5, elevation: 3, alignItems: 'center',
  },
  chartTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  chart: { borderRadius: 16 },
  item: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 10, marginVertical: 5, backgroundColor: '#fff',
    borderRadius: 10, width: '95%', alignSelf: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 5, elevation: 3,
  },
  time: { fontSize: 14, fontWeight: '500', color: '#333' },
  value: { fontSize: 14, fontWeight: 'bold', color: '#555' },
  status: { fontSize: 12, fontWeight: '600' },
  list: { width: '100%' },
  listContent: { alignItems: 'center' },
  back: { width: 20, height: 20, marginRight: 25, marginTop: 30, marginBottom: 20, marginLeft: 10 },
  backButton: { marginBottom: 10 }
});

export default Temperature;
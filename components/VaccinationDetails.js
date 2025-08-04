import React, { useState, useCallback } from "react";
import {
  Text, View, StyleSheet, ScrollView, TouchableOpacity,
  Image, Modal, Alert, ActivityIndicator
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import Footer from "./Footer";

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

const VaccinationDetails = () => {
  const navigation = useNavigation();
  const [pet, setPet] = useState(null);
  const [statuses, setStatuses] = useState({});
  const [selectedVaccine, setSelectedVaccine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");

  useFocusEffect(
    useCallback(() => {
      const fetchStatuses = async () => {
        try {
          setLoading(true);
          const token = await AsyncStorage.getItem("token");
          const petData = await AsyncStorage.getItem("selectedPet");
          if (!token || !petData) return;

          const parsedPet = JSON.parse(petData);
          setPet(parsedPet);

          const res = await fetch(`https://u76rpadxda.us-east-1.awsapprunner.com/api/pets/${parsedPet.id}/vaccine-statuses`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          const data = await res.json();
          setStatuses(data);
        } catch (err) {
          console.error("Error fetching statuses:", err);
        } finally {
          setLoading(false);
        }
      };

      fetchStatuses();
    }, [])
  );

  const scheduleNotification = async (vaccine) => {
    const nextDate = new Date(vaccine.next);
    nextDate.setHours(10, 0, 0);
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `Upcoming Vaccine: ${vaccine.name}`,
        body: `Dose ${vaccine.dose} is due on ${vaccine.next}`,
      },
      trigger: nextDate,
    });
    Alert.alert("Reminder Set", `Notification scheduled for ${vaccine.next}`);
  };

  const handleMarkDone = async (vaccine) => {
    try {
      const token = await AsyncStorage.getItem("token");

      const res = await fetch(`https://u76rpadxda.us-east-1.awsapprunner.com/api/vaccine-status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          petId: pet.id,
          vaccineKey: vaccine.key,
          status: "Done",
        }),
      });

      if (!res.ok) throw new Error("Update failed");

      const updated = { ...statuses, [vaccine.key]: "Done" };
      setStatuses(updated);
      await scheduleNotification(vaccine);
      setSelectedVaccine(null);
    } catch (error) {
      console.error("Error updating status:", error);
      Alert.alert("Error", "Could not mark vaccine as done.");
    }
  };

  const schedule = pet?.type?.toLowerCase() === "dog" ? DOG_VACCINES : CAT_VACCINES;

  const filteredSchedule = schedule.filter((vaccine) => {
    const status = statuses[vaccine.key] || "Pending";
    if (filter === "All") return true;
    return status === filter;
  });

  return (
    <View style={styles.container1}>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Image source={require("../assets/back.png")} style={styles.back} />
      </TouchableOpacity>

      <View style={styles.filterContainer}>
        {['All', 'Pending', 'Done'].map((option) => (
          <TouchableOpacity
            key={option}
            style={[styles.filterButton, filter === option && styles.activeFilter]}
            onPress={() => setFilter(option)}
          >
            <Text style={styles.filterText}>{option}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" style={{ marginTop: 50 }} color="#6c4b3c" />
      ) : (
        <ScrollView style={styles.container}>
          <Text style={styles.title}>Vaccination Schedule for {pet?.name}</Text>
          {filteredSchedule.map((vaccine, index) => {
  const status = statuses[vaccine.key] || "Pending";

  // Check if previous dose (if any) is completed
  const isEnabled =
    index === 0 || (statuses[schedule[index - 1].key] === "Done");

  return (
    <TouchableOpacity
      key={vaccine.key}
      onPress={() => isEnabled && setSelectedVaccine(vaccine)}
      disabled={!isEnabled}
    >
      <View
        style={[
          styles.vaccineCard,
          !isEnabled && { opacity: 0.5 } // visually dim if not enabled
        ]}
      >
        <Text style={styles.vaccineName}>
          {vaccine.name} - Dose {vaccine.dose}
        </Text>
        <Text style={styles.vaccineDate}>Given: {vaccine.given}</Text>
        <Text style={styles.vaccineDate}>Next: {vaccine.next}</Text>
        <Text
          style={[
            styles.vaccineStatus,
            status === "Done" ? styles.done : styles.pending,
          ]}
        >
          Status: {status}
        </Text>
        {!isEnabled && (
          <Text style={{ color: "red", marginTop: 4 }}>
            Complete previous dose to enable
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
})}

        </ScrollView>
      )}

      <Modal
        visible={selectedVaccine !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedVaccine(null)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {selectedVaccine && (
              <>
                <Text style={styles.modalTitle}>{selectedVaccine.name}</Text>
                <Text style={styles.modalText}>Dose: {selectedVaccine.dose}</Text>
                <Text style={styles.modalText}>Given: {selectedVaccine.given}</Text>
                <Text style={styles.modalText}>Next: {selectedVaccine.next}</Text>

                {statuses[selectedVaccine.key] !== "Done" && (
                  <TouchableOpacity
                    style={styles.button}
                    onPress={() => handleMarkDone(selectedVaccine)}
                  >
                    <Text style={styles.buttonText}>Mark as Done & Set Reminder</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.button}
                  onPress={() => setSelectedVaccine(null)}
                >
                  <Text style={styles.buttonText}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      <Footer />
    </View>
  );
};

const styles = StyleSheet.create({
  container1: { 
    flex: 1, 
    backgroundColor: "#e0cfc7" 
  },
  container: { 
    flex: 1, 
    padding: 16 
  },
  back: { 
    width: 20, 
    height: 20, 
    marginTop: 50, 
    marginLeft: 20 
  },
  title: { 
    fontSize: 24, 
    fontWeight: "bold", 
    textAlign: "center", 
    marginBottom: 20 
  },
  filterContainer: {
  flexDirection: "row",
  justifyContent: "center",
  marginBottom: 20,
  gap: 10,
  paddingHorizontal: 10,
},
  filterButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginHorizontal: 5,
    borderRadius: 20,
    backgroundColor: '#d6bfa8'
  },
  activeFilter: {
    backgroundColor: '#6c4b3c',
  },
  filterText: {
    color: '#fff',
    fontWeight: 'bold'
  },
  vaccineCard: {
    backgroundColor: "#fff", padding: 16, borderRadius: 8, marginBottom: 12, elevation: 3,
  },
  vaccineName: { fontSize: 18, fontWeight: "600", color: "#333" },
  vaccineDate: { fontSize: 14, color: "#666", marginTop: 4 },
  vaccineStatus: { fontSize: 14, marginTop: 8, fontWeight: "500" },
  done: { color: "#4CAF50" },
  pending: { color: "#FF5722" },
  modalContainer: {
    flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "#fff", padding: 20, borderRadius: 8, width: "80%",
  },
  modalTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 10 },
  modalText: { fontSize: 16, marginBottom: 10 },
  button: {
    backgroundColor: "#6c4b3c", paddingVertical: 10, paddingHorizontal: 20,
    borderRadius: 10, alignItems: "center", marginTop: 10,
  },
  buttonText: { color: "white", fontSize: 16, fontWeight: "bold" },
});

export default VaccinationDetails;

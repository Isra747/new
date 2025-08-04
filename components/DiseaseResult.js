import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";

const DiseaseResult = ({ route, navigation }) => {
  const { detectedDisease, confidence } = route.params;
  const [showMedicine, setShowMedicine] = useState(false);

  const getDiseaseDetails = (detectedDisease) => {
    const diseases = {
      "Tick fever": {
        medicine: "Antibiotics (Doxycycline)",
        Description: "Vet visit is important for proper medication."
      },
      "Distemper": {
        medicine: "ORS or Pedialyte (Unflavoured)",
        Description: "Vet visit is important for proper medication."
      },
      "Parvovirus": {
        medicine: "IV Fluids for Rehydration",
        Description: "Vet visit is important for proper medication."
      },
      "Hepatitis": {
        medicine: "Amoxicillin",
        Description: "Vet visit is important for proper medication."
      },
      "Tetanus": {
        medicine: "Use Antitoxins",
        Description: "Vet visit is important for proper medication."
      },
      "Chronic kidney disease": {
        medicine: "Maintain Hydration",
        Description: "Vet visit is important for proper medication."
      },
      "Diabetes": {
        medicine: "Maintain Hydration",
        Description: "Vet visit is important for proper medication."
      },
      "Gastrointestinal disease": {
        medicine: "Pedialyte",
        Description: "Vet visit is important for proper medication."
      },
      "Allergies": {
        medicine: "Benadryl 25mg",
        Description: "Vet visit is important for proper medication."
      },
      "Gingitivis": {
        medicine: "Pet-safe Chlorhexidine Rinse or Gel ",
        Description: "Vet visit is important for proper medication."
      },
      "Cancers": {
        medicine: "No Medication",
        Description: "Vet visit is important for proper medication."
      },
      "Skin rashes": {
        medicine: "Chlorhexidine Wipes or Spray",
        Description: "Vet visit is important for proper medication."
      },
    };

    return diseases[detectedDisease] || {
      description: "Please consult a veterinarian for accurate diagnosis.",
      medicine: "Consult a Vet",
      Description: "A veterinarian can suggest proper treatment based on symptoms."
    };
  };

  const { medicine, Description } = getDiseaseDetails(detectedDisease);

  return (
    <View style={styles.container}>
      <View style={styles.c1}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Image source={require('../assets/back.png')} style={styles.back} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.cardHeading1}>Detected Disease</Text>
        <View style={styles.card}>
          <Text style={styles.cardText1}>{detectedDisease}</Text>
        </View>

        <Text style={styles.cardHeading}>Medicine Suggestion</Text>
        <View style={styles.card}>
          {showMedicine ? (
            <>
              <Text style={styles.cardText1}>{medicine}</Text>
              <Text style={styles.cardText}>{Description}</Text>
            </>
          ) : (
            <TouchableOpacity style={styles.button} onPress={() => setShowMedicine(true)}>
              <Text style={styles.buttonText}>Show Suggested Medicine</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 30,
    backgroundColor: "#e0cfc7",
  },
  card: {
    width: "90%",
    backgroundColor: "rgba(217, 204, 197, 0.8)",
    padding: 35,
    marginBottom: 85,
    borderRadius: 15,
    shadowColor: "#000",
    alignItems: "center",
    alignSelf: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  content: {
    marginTop: 50,
    width: "100%",
    alignItems: "center",
  },
  cardHeading: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#8B4513",
    alignSelf: 'flex-start',
    marginBottom: 10,
    marginLeft: 20,
  },
  cardHeading1: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#8B4513",
    alignSelf: 'flex-start',
    marginBottom: 10,
    marginLeft: 20,
  },
  cardText: {
    fontSize: 18,
    color: "black",
    textAlign: "center",
    marginTop: 10,
  },
  cardText1: {
    fontSize: 20,
    color: "black",
    textAlign: "center",
    fontWeight: "bold",
  },
  confidenceText: {
    fontSize: 14,
    color: "#6D452D",
    textAlign: "center",
    marginVertical: 5,
    fontStyle: "italic",
  },
  button: {
    backgroundColor: "#6B4F4F",
    padding: 12,
    borderRadius: 15,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  back: {
    width: 20,
    height: 20,
    marginRight: 25,
    marginTop: 35,
  },
  c1: {
    marginTop: 1,
  },
});

export default DiseaseResult;

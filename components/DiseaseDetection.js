import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import CheckBox from "expo-checkbox";
import { Picker } from "@react-native-picker/picker";

const DiseaseDetection = () => {
  const navigation = useNavigation();
  const [symptomGroups, setSymptomGroups] = useState([
    {
      name: "Skin Problems",
      symptoms: [
        { id: "1_1", name: "Itchy skin", isSelected: false },
        { id: "1_2", name: "Redness of skin", isSelected: false },
        { id: "1_3", name: "Red bumps", isSelected: false },
        { id: "1_4", name: "Red patches", isSelected: false },
        { id: "1_5", name: "Scabs", isSelected: false },
        { id: "1_6", name: "Dandruff", isSelected: false },
        { id: "1_7", name: "Fur loss", isSelected: false },
        { id: "1_8", name: "Dry Skin", isSelected: false },
        { id: "1_9", name: "Swelling", isSelected: false },
        { id: "1_10", name: "Smelly", isSelected: false },
        { id: "1_11", name: "Wounds", isSelected: false },
        { id: "1_12", name: "Irritation", isSelected: false },
      ],
      isOpen: false,
    },
    {
      name: "Stomach Issues",
      symptoms: [
        { id: "2_1", name: "Vomiting", isSelected: false },
        { id: "2_2", name: "Diarrhea", isSelected: false },
        { id: "2_3", name: "Abdominal pain", isSelected: false },
        { id: "2_4", name: "Burping", isSelected: false },
        { id: "2_5", name: "Constipation", isSelected: false },
        { id: "2_6", name: "Eating grass", isSelected: false },
        { id: "2_7", name: "Blood in stools", isSelected: false },
        { id: "2_8", name: "Purging", isSelected: false },
        { id: "2_9", name: "Passing gases", isSelected: false },
        { id: "2_10", name: "Tender abdomen", isSelected: false },
        { id: "2_11", name: "Enlarged liver", isSelected: false },
        { id: "2_12", name: "Eating less than usual", isSelected: false },
      ],
      isOpen: false,
    },
    {
      name: "Appetite & Weight Changes",
      symptoms: [
        { id: "3_1", name: "Loss of appetite", isSelected: false },
        { id: "3_2", name: "Weight Loss", isSelected: false },
        { id: "3_3", name: "Hunger", isSelected: false },
        { id: "3_4", name: "Anorexia", isSelected: false },
      ],
      isOpen: false,
    },
    {
      name: "Brain & Nerves",
      symptoms: [
        { id: "4_1", name: "Seizures", isSelected: false },
        { id: "4_2", name: "Collapse", isSelected: false },
        { id: "4_3", name: "Coma", isSelected: false },
        { id: "4_4", name: "Paralysis", isSelected: false },
        { id: "4_5", name: "Loss of Consciousness", isSelected: false },
        { id: "4_6", name: "Grinning appearance", isSelected: false },
        { id: "4_7", name: "Wrinkled forehead", isSelected: false },
        { id: "4_8", name: "Excess jaw tone", isSelected: false },
        { id: "4_9", name: "Stiffness of muscles", isSelected: false },
        { id: "4_10", name: "Stiff and hard tail", isSelected: false },
      ],
      isOpen: false,
    },
    {
      name: "Mood & Behavior Changes",
      symptoms: [
        { id: "5_1", name: "Lethargy", isSelected: false },
        { id: "5_2", name: "Weakness", isSelected: false },
        { id: "5_3", name: "Depression", isSelected: false },
        { id: "5_4", name: "Lack of energy", isSelected: false },
        { id: "5_5", name: "Aggression", isSelected: false },
        { id: "5_6", name: "Discomfort", isSelected: false },
        { id: "5_7", name: "Face rubbing", isSelected: false },
        { id: "5_8", name: "Licking", isSelected: false },
      ],
      isOpen: false,
    },
    {
      name: "Mouth & Teeth Problems",
      symptoms: [
        { id: "6_1", name: "Bleeding of gum", isSelected: false },
        { id: "6_2", name: "Receding gum", isSelected: false },
        { id: "6_3", name: "Redness of gum", isSelected: false },
        { id: "6_4", name: "Swelling of gum", isSelected: false },
        { id: "6_5", name: "Tartar", isSelected: false },
        { id: "6_6", name: "Plaque", isSelected: false },
        { id: "6_7", name: "Bad breath", isSelected: false },
        { id: "6_8", name: "Excessive Salivation", isSelected: false },
      ],
      isOpen: false,
    },
    {
      name: "Breathing Problems",
      symptoms: [
        { id: "7_1", name: "Coughing", isSelected: false },
        { id: "7_2", name: "Breathing Difficulty", isSelected: false },
        { id: "7_3", name: "Nasal Discharge", isSelected: false },
      ],
      isOpen: false,
    },
    {
      name: "Peeing & Body Fluids",
      symptoms: [
        { id: "8_1", name: "Glucose in urine", isSelected: false },
        { id: "8_2", name: "Increased drinking and urination", isSelected: false },
        { id: "8_3", name: "Bloody discharge", isSelected: false },
        { id: "8_4", name: "Difficulty urinating", isSelected: false },
        { id: "8_5", name: "Blood in urine", isSelected: false },
      ],
      isOpen: false,
    },
    {
      name: "Fever & Body Pain",
      symptoms: [
        { id: "9_1", name: "Fever", isSelected: false },
        { id: "9_2", name: "Pain", isSelected: false },
        { id: "9_3", name: "Heart Complication", isSelected: false },
        { id: "9_4", name: "Yellow gums", isSelected: false },
        { id: "9_5", name: "Pale gums", isSelected: false },
        { id: "9_6", name: "Redness around eye area", isSelected: false },
        { id: "9_7", name: "Eye Discharge", isSelected: false },
        { id: "9_8", name: "Sepsis", isSelected: false },
      ],
      isOpen: false,
    },
    {
      name: "Vision & Senses",
      symptoms: [
        { id: "10_1", name: "Blindness", isSelected: false },
        { id: "10_2", name: "Losing sight", isSelected: false },
        { id: "10_3", name: "Cataracts", isSelected: false },
      ],
      isOpen: false,
    },
  ]);

  const toggleGroup = (groupIndex) => {
    setSymptomGroups((prevGroups) =>
      prevGroups.map((group, index) => ({
        ...group,
        isOpen: index === groupIndex ? !group.isOpen : false,
      }))
    );
  };

  const toggleCheckbox = (groupIndex, symptomId) => {
    const selectedCount = symptomGroups
      .flatMap((group) => group.symptoms)
      .filter((symptom) => symptom.isSelected).length;

    setSymptomGroups((prevGroups) =>
      prevGroups.map((group, index) => {
        if (index === groupIndex) {
          return {
            ...group,
            symptoms: group.symptoms.map((symptom) => {
              if (symptom.id === symptomId) {
                if (!symptom.isSelected && selectedCount >= 4) {
                  Alert.alert(
                    "Limit Reached",
                    "You can only select up to 4 symptoms. Deselect a symptom to choose another."
                  );
                  return symptom;
                }
                return { ...symptom, isSelected: !symptom.isSelected };
              }
              return symptom;
            }),
          };
        }
        return group;
      })
    );
  };

  const getSelectedSymptoms = () => {
    return symptomGroups
      .flatMap((group) => group.symptoms)
      .filter((symptom) => symptom.isSelected)
      .map((symptom) => symptom.name);
  };

  useFocusEffect(
    useCallback(() => {
      setSymptomGroups((prevGroups) =>
        prevGroups.map((group) => ({
          ...group,
          symptoms: group.symptoms.map((symptom) => ({
            ...symptom,
            isSelected: false,
          })),
          isOpen: false,
        }))
      );
    }, [])
  );

  const handleDetect = async () => {
    const selected = getSelectedSymptoms();
    console.log("Selected symptoms:", selected);

    try {
      const response = await fetch("http://192.168.1.5:5005/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ symptoms: selected }),
      });

      const result = await response.json();
      console.log("Prediction result:", result);

      navigation.navigate("DiseaseResult", {
        detectedDisease: result.predicted_disease,
        confidence: result.confidence,
      });
    } catch (error) {
      console.error("Prediction failed:", error);
      Alert.alert("Error", "Could not connect to the disease detection service.");
    }
  };

  const selectedSymptoms = getSelectedSymptoms().join(", ");
  const isButtonDisabled = getSelectedSymptoms().length != 4;

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Image source={require("../assets/back.png")} style={styles.back} />
      </TouchableOpacity>
      <Text style={styles.title}>Disease Detection</Text>
      <Text style={styles.subtitle}>
        Check the boxes for the symptoms your pet is experiencing (4).
      </Text>
      <Text style={styles.heading}>Symptom Groups</Text>
      <ScrollView style={styles.symptomsContainer}>
        {symptomGroups.map((group, groupIndex) => (
          <View key={group.name} style={styles.groupContainer}>
            <TouchableOpacity
              style={styles.groupHeader}
              onPress={() => toggleGroup(groupIndex)}
            >
              <Text style={styles.groupTitle}>{group.name}</Text>
              <Text style={styles.groupToggle}>{group.isOpen ? "−" : "+"}</Text>
            </TouchableOpacity>
            {group.isOpen && (
              <View style={styles.symptomList}>
                {group.symptoms.map((symptom) => (
                  <View key={symptom.id} style={styles.symptomItem}>
                    <CheckBox
                      value={symptom.isSelected}
                      onValueChange={() => toggleCheckbox(groupIndex, symptom.id)}
                      color={symptom.isSelected ? "#6D452D" : undefined}
                      style={styles.checkbox}
                    />
                    <Text style={styles.symptomText}>{symptom.name}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}
      </ScrollView>
      <Text style={styles.selectedHeading}>Selected Symptoms:</Text>
      <View style={styles.selectedSymptomsContainer}>
        <Text style={styles.selectedText}>{selectedSymptoms || "None"}</Text>
      </View>
      <TouchableOpacity
        style={[
          styles.detectButton,
          isButtonDisabled ? styles.disabledButton : null,
        ]}
        onPress={handleDetect}
        disabled={isButtonDisabled}
      >
        <Text style={styles.detectButtonText}>Detect Disease</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#e0cfc7",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#6D452D",
    marginTop: 30,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "black",
    marginBottom: 20,
  },
  heading: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#6D452D",
    marginBottom: 10,
  },
  symptomsContainer: {
    maxHeight: 400,
  },
  groupContainer: {
    marginBottom: 10,
  },
  groupHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
    backgroundColor: "rgba(217, 204, 197, 0.8)",
    borderRadius: 5,
    borderBottomWidth: 1,
    borderBottomColor: "black",
  },
  groupTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#6D452D",
  },
  groupToggle: {
    fontSize: 18,
    color: "#6D452D",
  },
  symptomList: {
    paddingLeft: 20,
    backgroundColor: "rgba(217, 204, 197, 0.5)",
    borderRadius: 5,
  },
  symptomItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 5,
    backgroundColor: "rgba(217, 204, 197, 0.8)",
    marginBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: "black",
  },
  checkbox: {
    marginRight: 10,
  },
  symptomText: {
    fontSize: 16,
    color: "black",
    fontWeight: "bold",
  },
  selectedSymptomsContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
  },
  selectedHeading: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#6D452D",
    marginTop: 15,
  },
  back: {
    width: 20,
    height: 20,
    marginRight: 25,
    marginTop: 35,
  },
  selectedText: {
    fontSize: 16,
    color: "black",
  },
  detectButton: {
    marginTop: 20,
    padding: 15,
    backgroundColor: "#6D452D",
    borderRadius: 10,
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: "#B5A59E",
  },
  detectButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
});

export default DiseaseDetection;
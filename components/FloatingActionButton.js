import React, { useState } from "react";
import { Text, View, StyleSheet, TouchableOpacity, Animated } from "react-native";
import { useNavigation} from '@react-navigation/native';


const FloatingActionButton = () => {
    const navigation = useNavigation();
    const [isOpen, setIsOpen] = useState(false); // State to manage FAB options visibility
    const animation = useState(new Animated.Value(0))[0]; // Animation for FAB options

    // Toggle FAB options
    const toggleFAB = () => {
        setIsOpen(!isOpen);
        Animated.timing(animation, {
            toValue: isOpen ? 0 : 1,
            duration: 300,
            useNativeDriver: true,
        }).start();
    };

    // Animation for Pair Collar option
    const collarStyle = {
        transform: [
            {
                translateY: animation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -60],
                }),
            },
        ],
        opacity: animation,
    };

    // Animation for Pair Food Dispenser option
    const foodDispenserStyle = {
        transform: [
            {
                translateY: animation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -120],
                }),
            },
        ],
        opacity: animation,
    };

    return (
        <View style={styles.container}>
            {/* Pair Collar Option */}
            <Animated.View style={[styles.option, collarStyle]}>
                <TouchableOpacity
                    style={styles.optionButton}
                    onPress={() => navigation.navigate("Connect Collar")} // Navigate to ActivateCollarScreen
                >
                    <Text style={styles.optionText}>Pair Collar</Text>
                </TouchableOpacity>
            </Animated.View>

            {/* Pair Food Dispenser Option */}
            <Animated.View style={[styles.option, foodDispenserStyle]}>
                <TouchableOpacity
                    style={styles.optionButton}
                    onPress={() => navigation.navigate("Food Dispenser")} // Navigate to ActivateFoodDispenserScreen
                >
                    <Text style={styles.optionText}>Pair Food Dispenser</Text>
                </TouchableOpacity>
            </Animated.View>

            {/* Main FAB Button */}
            <TouchableOpacity style={styles.fab} onPress={toggleFAB}>
                <Text style={styles.fabIcon}>{isOpen ? "×" : "+"}</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "flex-end",
        alignItems: "flex-end",
        padding: 20,
        backgroundColor: "#f0f0f0",
    },
    fab: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: "#5C4033",
        justifyContent: "center",
        alignItems: "center",
        elevation: 5,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        bottom: 50,
        left: 10,
    },
    fabIcon: {
        fontSize: 24,
        color: "#fff",
    },
    option: {
        position: "absolute",
        right: 20,
        bottom: 80,
    },
    optionButton: {
        backgroundColor: "#5C4033",
        padding: 15,
        borderRadius: 25,
        elevation: 5,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
    },
    optionText: {
        color: "#fff",
        fontSize: 14,
        fontWeight:'bold'
    },
});

export default FloatingActionButton;
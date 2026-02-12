import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/ApiService';

enum AgeRange {
    AGE_4_6 = "4-6",
    AGE_7_9 = "7-9",
    AGE_10_12 = "10-12",
}

const AddChildProfileScreen = () => {
    const [name, setName] = useState('');
    const [age, setAge] = useState('');
    const [readingLevel, setReadingLevel] = useState('AGE_7_9');
    const [loading, setLoading] = useState(false);
    const navigation = useNavigation();
    const { isAuthenticated } = useAuth();

    const handleAddProfile = async () => {
        if (!isAuthenticated) {
            Alert.alert(
                "Authentication Required",
                "Please log in to add child profiles.",
                [
                    { text: "Cancel", style: "cancel" },
                    { text: "Log In", onPress: () => navigation.navigate('Login' as never) }
                ]
            );
            return;
        }

        if (!name || !age) {
            Alert.alert("Error", "Please fill in all fields.");
            return;
        }

        const ageNum = parseInt(age, 10);
        if (isNaN(ageNum) || ageNum < 1 || ageNum > 18) {
            Alert.alert("Error", "Please enter a valid age (1-18).");
            return;
        }

        setLoading(true);
        try {
            await apiService.createChildProfile({
                name,
                age: ageNum,
                reading_level: readingLevel,
            });
            Alert.alert("Success", "Child profile added successfully.");
            navigation.goBack();
        } catch (error: any) {
            if (__DEV__) console.error("Error adding child profile:", error);
            Alert.alert("Error", error.message || "Failed to add child profile.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Add New Child Profile</Text>
            <TextInput
                style={styles.input}
                placeholder="Child's Name"
                value={name}
                onChangeText={setName}
            />
            <TextInput
                style={styles.input}
                placeholder="Child's Age"
                value={age}
                onChangeText={setAge}
                keyboardType="numeric"
            />
            <Text style={styles.label}>Reading Level:</Text>
            <View style={styles.pickerContainer}>
                <Picker
                    selectedValue={readingLevel}
                    style={styles.picker}
                    onValueChange={(itemValue) => setReadingLevel(itemValue)}
                >
                    {Object.keys(AgeRange).map(levelName => (
                        <Picker.Item
                            key={levelName}
                            label={AgeRange[levelName as keyof typeof AgeRange]}
                            value={levelName}
                        />
                    ))}
                </Picker>
            </View>
            <Button
                title={loading ? "Adding..." : "Add Profile"}
                onPress={handleAddProfile}
                disabled={loading}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#f8f8f8',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
        color: '#333',
    },
    input: {
        height: 40,
        borderColor: 'gray',
        borderWidth: 1,
        marginBottom: 12,
        padding: 8,
        borderRadius: 5,
        backgroundColor: '#fff',
    },
    label: {
        fontSize: 16,
        marginBottom: 5,
        color: '#555',
    },
    pickerContainer: {
        backgroundColor: '#fff',
        borderRadius: 5,
        borderColor: 'gray',
        borderWidth: 1,
        marginBottom: 20,
    },
    picker: {
        height: 50,
        width: '100%',
    },
});

export default AddChildProfileScreen;

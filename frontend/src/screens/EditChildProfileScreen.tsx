import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/ApiService';

enum AgeRange {
    AGE_4_6 = "4-6",
    AGE_7_9 = "7-9",
    AGE_10_12 = "10-12",
}

const EditChildProfileScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { profile } = route.params as { profile: any };
    const { isAuthenticated } = useAuth();

    const [name, setName] = useState(profile.name);
    const [age, setAge] = useState(String(profile.age));
    const [readingLevel, setReadingLevel] = useState(profile.reading_level);
    const [loading, setLoading] = useState(false);

    const handleEditProfile = async () => {
        if (!isAuthenticated) {
            Alert.alert(
                "Authentication Required",
                "Please log in to edit child profiles.",
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
            await apiService.updateChildProfile(profile.id, {
                name,
                age: ageNum,
                reading_level: readingLevel,
            });
            Alert.alert("Success", "Child profile updated successfully.");
            navigation.goBack();
        } catch (error: any) {
            if (__DEV__) console.error("Error updating child profile:", error);
            Alert.alert("Error", error.message || "Failed to update child profile.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Edit Child Profile</Text>
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
                title={loading ? "Saving..." : "Save Changes"}
                onPress={handleEditProfile}
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

export default EditChildProfileScreen;

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/ApiService';
import BottomNavBar from '../components/BottomNavBar';
import { colors, spacing, borderRadius, shadows } from '../theme';

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
            <View style={styles.header}>
                <Icon name="edit" size={40} color={colors.secondary} />
                <Text style={styles.title}>Edit Child Profile</Text>
            </View>
            <TextInput
                style={styles.input}
                placeholder="Child's Name"
                placeholderTextColor={colors.text.light}
                value={name}
                onChangeText={setName}
            />
            <TextInput
                style={styles.input}
                placeholder="Child's Age"
                placeholderTextColor={colors.text.light}
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
            <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleEditProfile}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color={colors.text.inverse} />
                ) : (
                    <Text style={styles.buttonText}>Save Changes</Text>
                )}
            </TouchableOpacity>
            <BottomNavBar />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: spacing.md,
        backgroundColor: colors.background.primary,
    },
    header: {
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: spacing.sm,
        textAlign: 'center',
        color: colors.text.primary,
    },
    input: {
        backgroundColor: colors.background.card,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        marginBottom: spacing.md,
        fontSize: 16,
        borderWidth: 1,
        borderColor: colors.background.secondary,
        color: colors.text.primary,
    },
    label: {
        fontSize: 16,
        marginBottom: spacing.xs,
        color: colors.text.secondary,
        fontWeight: '600',
    },
    pickerContainer: {
        backgroundColor: colors.background.card,
        borderRadius: borderRadius.md,
        borderColor: colors.background.secondary,
        borderWidth: 1,
        marginBottom: spacing.lg,
    },
    picker: {
        height: 50,
        width: '100%',
        color: colors.text.primary,
    },
    button: {
        backgroundColor: colors.primary,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        alignItems: 'center',
        ...shadows.md,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonText: {
        color: colors.text.inverse,
        fontSize: 18,
        fontWeight: '600',
    },
});

export default EditChildProfileScreen;

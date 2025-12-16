import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Button, Alert, ScrollView } from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/ApiService';

const ParentDashboardScreen = () => {
    const [childProfiles, setChildProfiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [readingStreaks, setReadingStreaks] = useState<any>({});
    const [readingProgressSummary, setReadingProgressSummary] = useState<any>({});
    const navigation = useNavigation();
    const isFocused = useIsFocused();
    const { isAuthenticated, user } = useAuth();

    const fetchData = async () => {
        if (!isAuthenticated) {
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const [childProfilesData, readingStreaksData, readingProgressData] = await Promise.all([
                apiService.getChildProfiles(),
                apiService.getReadingStreaks(),
                apiService.getReadingProgress(),
            ]);

            setChildProfiles(childProfilesData.results || childProfilesData || []);

            const streaksArray = readingStreaksData.results || readingStreaksData || [];
            const streaksMap: { [key: string]: any } = {};
            if (Array.isArray(streaksArray) && streaksArray.length > 0) {
                streaksMap[streaksArray[0].user] = streaksArray[0];
            }
            setReadingStreaks(streaksMap);

            const progressArray = readingProgressData.results || readingProgressData || [];
            const progressSummary: { [key: string]: number } = {};
            if (Array.isArray(progressArray)) {
                progressArray.forEach((rp: any) => {
                    if (rp.completed) {
                        progressSummary[rp.user] = (progressSummary[rp.user] || 0) + 1;
                    }
                });
            }
            setReadingProgressSummary(progressSummary);
        } catch (error: any) {
            console.error("Error fetching parent dashboard data:", error);
            Alert.alert("Error", error.message || "Failed to fetch dashboard data.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isFocused) {
            if (!isAuthenticated) {
                Alert.alert(
                    "Authentication Required",
                    "Please log in to view the parent dashboard.",
                    [
                        { text: "Cancel", onPress: () => navigation.goBack() },
                        { text: "Log In", onPress: () => navigation.navigate('Login' as never) }
                    ]
                );
                setLoading(false);
            } else {
                fetchData();
            }
        }
    }, [isFocused, isAuthenticated]);

    if (loading) {
        return <ActivityIndicator size="large" style={styles.loader} />;
    }

    if (!isAuthenticated) {
        return (
            <View style={styles.container}>
                <Text style={styles.infoText}>Please log in to view the parent dashboard.</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>Parent Dashboard</Text>
            <Text style={styles.welcomeText}>Welcome, {user?.username}!</Text>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Child Profiles</Text>
                <Button
                    title="Manage Child Profiles"
                    onPress={() => navigation.navigate('ChildProfileList' as never)}
                />
                {childProfiles.length === 0 ? (
                    <Text style={styles.infoText}>No child profiles set up. Please add one.</Text>
                ) : (
                    childProfiles.map((profile: any) => (
                        <View key={profile.id} style={styles.profileSummary}>
                            <Text style={styles.profileName}>{profile.name} (Age: {profile.age})</Text>
                            <Text>Reading Level: {profile.reading_level}</Text>
                            <Text>Read Articles: {readingProgressSummary[profile.user] || 0}</Text>
                            <Text>Current Streak: {readingStreaks[profile.user]?.current_streak || 0} days</Text>
                            <Text>Longest Streak: {readingStreaks[profile.user]?.longest_streak || 0} days</Text>
                        </View>
                    ))
                )}
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Engagement & Progress</Text>
                <Button
                    title="View Achievements"
                    onPress={() => navigation.navigate('Achievements' as never)}
                />
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Settings & Controls</Text>
                <Text style={styles.infoText}>
                    Settings for notifications, subscriptions, and privacy will go here.
                </Text>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#f8f8f8',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
        color: '#333',
    },
    welcomeText: {
        fontSize: 16,
        textAlign: 'center',
        color: '#666',
        marginBottom: 20,
    },
    section: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 15,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 15,
        color: '#555',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingBottom: 10,
    },
    profileSummary: {
        marginBottom: 10,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    profileName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#444',
    },
    infoText: {
        fontSize: 16,
        color: '#666',
        marginTop: 5,
    },
    loader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default ParentDashboardScreen;

import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Image, Alert } from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/ApiService';

const AchievementsScreen = () => {
    const [achievements, setAchievements] = useState<any[]>([]);
    const [userAchievements, setUserAchievements] = useState<number[]>([]);
    const [loading, setLoading] = useState(true);
    const isFocused = useIsFocused();
    const navigation = useNavigation();
    const { isAuthenticated } = useAuth();

    const fetchAchievements = async () => {
        if (!isAuthenticated) {
            setLoading(false);
            return;
        }

        try {
            const [achievementsData, userAchievementsData] = await Promise.all([
                apiService.getAchievements(),
                apiService.getUserAchievements(),
            ]);

            setAchievements(achievementsData.results || achievementsData || []);

            const userAchievementIds = (userAchievementsData.results || userAchievementsData || [])
                .map((ua: any) => ua.achievement.id);
            setUserAchievements(userAchievementIds);
        } catch (error: any) {
            console.error("Error fetching achievements:", error);
            Alert.alert("Error", error.message || "Failed to fetch achievements.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isFocused) {
            if (!isAuthenticated) {
                Alert.alert(
                    "Authentication Required",
                    "Please log in to view achievements.",
                    [
                        { text: "Cancel", onPress: () => navigation.goBack() },
                        { text: "Log In", onPress: () => navigation.navigate('Login' as never) }
                    ]
                );
                setLoading(false);
            } else {
                fetchAchievements();
            }
        }
    }, [isFocused, isAuthenticated]);

    if (loading) {
        return <ActivityIndicator size="large" style={styles.loader} />;
    }

    if (!isAuthenticated) {
        return (
            <View style={styles.container}>
                <Text style={styles.emptyMessage}>Please log in to view achievements.</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Achievements</Text>
            {achievements.length === 0 ? (
                <Text style={styles.emptyMessage}>No achievements defined yet.</Text>
            ) : (
                <FlatList
                    data={achievements}
                    keyExtractor={item => item.id.toString()}
                    numColumns={2}
                    renderItem={({ item }) => (
                        <View style={styles.achievementItem}>
                            <Image
                                source={{ uri: item.image_url || 'https://via.placeholder.com/100' }}
                                style={styles.achievementImage}
                            />
                            <Text style={styles.achievementName}>{item.name}</Text>
                            <Text style={styles.achievementDescription}>{item.description}</Text>
                            {userAchievements.includes(item.id) && (
                                <View style={styles.achievedOverlay}>
                                    <Icon name="check-circle" size={30} color="green" />
                                </View>
                            )}
                        </View>
                    )}
                />
            )}
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
    emptyMessage: {
        textAlign: 'center',
        marginTop: 50,
        fontSize: 16,
        color: '#666',
    },
    achievementItem: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 15,
        margin: 8,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.41,
        elevation: 2,
        position: 'relative',
    },
    achievementImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginBottom: 10,
    },
    achievementName: {
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 5,
    },
    achievementDescription: {
        fontSize: 12,
        textAlign: 'center',
        color: '#666',
    },
    achievedOverlay: {
        position: 'absolute',
        top: 5,
        right: 5,
        backgroundColor: 'rgba(255,255,255,0.7)',
        borderRadius: 15,
        padding: 3,
    },
    loader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default AchievementsScreen;

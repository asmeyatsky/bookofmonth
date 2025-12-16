import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Button, Alert, TouchableOpacity } from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/ApiService';

const ChildProfileListScreen = () => {
    const [childProfiles, setChildProfiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const navigation = useNavigation();
    const isFocused = useIsFocused();
    const { isAuthenticated } = useAuth();

    const fetchChildProfiles = async () => {
        if (!isAuthenticated) {
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const data = await apiService.getChildProfiles();
            if (Array.isArray(data)) {
                setChildProfiles(data);
            }
        } catch (error: any) {
            console.error("Error fetching child profiles:", error);
            Alert.alert("Error", error.message || "Failed to fetch child profiles.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isFocused) {
            if (!isAuthenticated) {
                Alert.alert(
                    "Authentication Required",
                    "Please log in to manage child profiles.",
                    [
                        { text: "Cancel", onPress: () => navigation.goBack() },
                        { text: "Log In", onPress: () => navigation.navigate('Login' as never) }
                    ]
                );
                setLoading(false);
            } else {
                fetchChildProfiles();
            }
        }
    }, [isFocused, isAuthenticated]);

    const deleteChildProfile = async (profileId: number) => {
        Alert.alert(
            "Delete Profile",
            "Are you sure you want to delete this child profile?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    onPress: async () => {
                        try {
                            await apiService.deleteChildProfile(profileId);
                            Alert.alert("Success", "Child profile deleted successfully.");
                            setChildProfiles(prev => prev.filter(p => p.id !== profileId));
                        } catch (error: any) {
                            console.error("Error deleting child profile:", error);
                            Alert.alert("Error", error.message || "Failed to delete profile.");
                        }
                    },
                    style: "destructive",
                },
            ]
        );
    };

    if (loading) {
        return <ActivityIndicator size="large" style={styles.loader} />;
    }

    if (!isAuthenticated) {
        return (
            <View style={styles.container}>
                <Text style={styles.emptyMessage}>Please log in to manage child profiles.</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Child Profiles</Text>
            {childProfiles.length === 0 ? (
                <Text style={styles.emptyMessage}>No child profiles found.</Text>
            ) : (
                <FlatList
                    data={childProfiles}
                    keyExtractor={item => item.id.toString()}
                    renderItem={({ item }) => (
                        <View style={styles.profileItem}>
                            <Text style={styles.profileName}>
                                {item.name} (Age: {item.age}, Level: {item.reading_level})
                            </Text>
                            <View style={styles.profileActions}>
                                <TouchableOpacity
                                    onPress={() => navigation.navigate('EditChildProfile' as never, { profile: item } as never)}
                                >
                                    <Icon name="edit" size={20} color="#007bff" style={styles.actionIcon} />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => deleteChildProfile(item.id)}>
                                    <Icon name="trash" size={20} color="#dc3545" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                />
            )}
            <Button
                title="Add New Child Profile"
                onPress={() => navigation.navigate('AddChildProfile' as never)}
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
    emptyMessage: {
        textAlign: 'center',
        marginTop: 50,
        fontSize: 16,
        color: '#666',
    },
    profileItem: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 15,
        marginBottom: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.41,
        elevation: 2,
    },
    profileName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#555',
        flexShrink: 1,
    },
    profileActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionIcon: {
        marginRight: 15,
    },
    loader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default ChildProfileListScreen;

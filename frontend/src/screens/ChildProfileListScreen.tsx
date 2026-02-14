import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/ApiService';
import { colors, spacing, borderRadius, shadows, getReadingLevelDisplay, getReadingLevelColor } from '../theme';

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
            if (__DEV__) console.error("Error fetching child profiles:", error);
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
                            setChildProfiles(prev => prev.filter(p => p.id !== profileId));
                        } catch (error: any) {
                            if (__DEV__) console.error("Error deleting child profile:", error);
                            Alert.alert("Error", error.message || "Failed to delete profile.");
                        }
                    },
                    style: "destructive",
                },
            ]
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (!isAuthenticated) {
        return (
            <View style={styles.container}>
                <View style={styles.emptyContainer}>
                    <Icon name="lock" size={60} color={colors.text.light} />
                    <Text style={styles.emptyTitle}>Login Required</Text>
                    <Text style={styles.emptyText}>Please log in to manage child profiles.</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {childProfiles.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Icon name="child" size={60} color={colors.text.light} />
                    <Text style={styles.emptyTitle}>No Child Profiles</Text>
                    <Text style={styles.emptyText}>Add a child profile to get started.</Text>
                </View>
            ) : (
                <FlatList
                    data={childProfiles}
                    keyExtractor={item => item.id.toString()}
                    renderItem={({ item }) => (
                        <View style={styles.profileItem}>
                            <View style={[styles.avatar, { backgroundColor: getReadingLevelColor(item.reading_level) }]}>
                                <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
                            </View>
                            <View style={styles.profileInfo}>
                                <Text style={styles.profileName}>{item.name}</Text>
                                <Text style={styles.profileDetail}>Age {item.age} · {getReadingLevelDisplay(item.reading_level)}</Text>
                            </View>
                            <View style={styles.profileActions}>
                                <TouchableOpacity
                                    style={styles.actionBtn}
                                    onPress={() => navigation.navigate('EditChildProfile' as never, { profile: item } as never)}
                                >
                                    <Icon name="edit" size={18} color={colors.secondary} />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.actionBtn}
                                    onPress={() => deleteChildProfile(item.id)}
                                >
                                    <Icon name="trash" size={18} color={colors.status.error} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                    contentContainerStyle={styles.listContent}
                />
            )}
            <TouchableOpacity
                style={styles.addButton}
                onPress={() => navigation.navigate('AddChildProfile' as never)}
            >
                <Icon name="plus" size={16} color={colors.text.inverse} />
                <Text style={styles.addButtonText}>Add New Child Profile</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background.primary,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background.primary,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.text.primary,
        marginTop: spacing.md,
    },
    emptyText: {
        fontSize: 16,
        color: colors.text.secondary,
        textAlign: 'center',
        marginTop: spacing.sm,
    },
    listContent: {
        padding: spacing.md,
    },
    profileItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background.card,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.sm,
        ...shadows.sm,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    avatarText: {
        color: colors.text.inverse,
        fontWeight: 'bold',
        fontSize: 18,
    },
    profileInfo: {
        flex: 1,
    },
    profileName: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.text.primary,
    },
    profileDetail: {
        fontSize: 14,
        color: colors.text.secondary,
        marginTop: 2,
    },
    profileActions: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    actionBtn: {
        padding: spacing.sm,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primary,
        margin: spacing.md,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        gap: spacing.sm,
        ...shadows.md,
    },
    addButtonText: {
        color: colors.text.inverse,
        fontWeight: '600',
        fontSize: 16,
    },
});

export default ChildProfileListScreen;

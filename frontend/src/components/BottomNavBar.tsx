import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Alert, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useAuth } from '../context/AuthContext';
import { colors, spacing, shadows } from '../theme';

const BottomNavBar = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const currentRoute = route.name;
    const { isAuthenticated } = useAuth();

    const allTabs = [
        { name: 'Home', icon: 'home', label: 'Home', color: colors.primary, requiresAuth: false },
        { name: 'Bookmarks', icon: 'bookmark', label: 'Bookmarks', color: colors.accent, requiresAuth: true },
        { name: 'MonthlyBookList', icon: 'book', label: 'Books', color: colors.primary, requiresAuth: false },
        { name: 'Search', icon: 'search', label: 'Search', color: colors.secondary, requiresAuth: false },
        { name: 'Achievements', icon: 'trophy', label: 'Awards', color: colors.achievements.gold, requiresAuth: true },
        { name: 'ParentDashboard', icon: 'users', label: 'Parents', color: colors.categories.arts, requiresAuth: true },
    ];

    const tabs = allTabs.filter(tab => !tab.requiresAuth || isAuthenticated);

    const handleTabPress = (tabName: string, requiresAuth: boolean) => {
        if (requiresAuth && !isAuthenticated) {
            Alert.alert(
                "Login Required",
                "Please log in to access this feature.",
                [
                    { text: "Cancel", style: "cancel" },
                    { text: "Log In", onPress: () => navigation.navigate('Login' as never) }
                ]
            );
            return;
        }
        navigation.navigate(tabName as never);
    };

    // Use fixed positioning on web to prevent flashing
    const containerStyle = Platform.OS === 'web' 
        ? [styles.container, styles.webFixed]
        : styles.container;

    return (
        <View style={containerStyle}>
            {tabs.map((tab) => {
                const isActive = currentRoute === tab.name;
                return (
                    <TouchableOpacity
                        key={tab.name}
                        style={styles.tab}
                        onPress={() => handleTabPress(tab.name, tab.requiresAuth)}
                    >
                        <Icon
                            name={tab.icon}
                            size={20}
                            color={isActive ? tab.color : colors.text.light}
                        />
                        <Text style={[
                            styles.label,
                            isActive && { color: tab.color, fontWeight: '600' },
                        ]}>
                            {tab.label}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: colors.background.card,
        paddingVertical: spacing.sm,
        borderTopWidth: 1,
        borderTopColor: colors.background.secondary,
        ...shadows.sm,
    },
    webFixed: {
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 999,
    },
    tab: {
        alignItems: 'center',
        padding: spacing.xs,
    },
    label: {
        fontSize: 10,
        color: colors.text.secondary,
        marginTop: 2,
    },
});

export default BottomNavBar;

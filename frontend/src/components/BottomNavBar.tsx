import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { colors, spacing, shadows } from '../theme';

const tabs = [
    { name: 'Home', icon: 'home', label: 'Home', color: colors.primary },
    { name: 'Bookmarks', icon: 'bookmark', label: 'Bookmarks', color: colors.accent },
    { name: 'MonthlyBookList', icon: 'book', label: 'Books', color: colors.primary },
    { name: 'Search', icon: 'search', label: 'Search', color: colors.secondary },
    { name: 'Achievements', icon: 'trophy', label: 'Awards', color: colors.achievements.gold },
    { name: 'ParentDashboard', icon: 'users', label: 'Parents', color: colors.categories.arts },
];

const BottomNavBar = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const currentRoute = route.name;

    return (
        <View style={styles.container}>
            {tabs.map((tab) => {
                const isActive = currentRoute === tab.name;
                return (
                    <TouchableOpacity
                        key={tab.name}
                        style={styles.tab}
                        onPress={() => navigation.navigate(tab.name as never)}
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

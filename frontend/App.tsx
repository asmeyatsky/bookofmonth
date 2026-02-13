import React, { useEffect } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import HomeScreen from './src/screens/HomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegistrationScreen from './src/screens/RegistrationScreen';
import BookmarksScreen from './src/screens/BookmarksScreen';
import ChildProfileListScreen from './src/screens/ChildProfileListScreen';
import AddChildProfileScreen from './src/screens/AddChildProfileScreen';
import EditChildProfileScreen from './src/screens/EditChildProfileScreen';
import MonthlyBookListScreen from './src/screens/MonthlyBookListScreen';
import MonthlyBookScreen from './src/screens/MonthlyBookScreen';
import SearchScreen from './src/screens/SearchScreen';
import QuizScreen from './src/screens/QuizScreen';
import AchievementsScreen from './src/screens/AchievementsScreen';
import ParentDashboardScreen from './src/screens/ParentDashboardScreen';
import { notificationService } from './src/services/NotificationService';
import { colors } from './src/theme';

const Stack = createStackNavigator();

const AppNavigator = () => {
    const { isLoading, isAuthenticated } = useAuth();

    useEffect(() => {
        notificationService.scheduleDailyNotification(
            "New Daily Entry!",
            "A new exciting story awaits you. Tap to read!",
            8,
            0
        );

        return () => {
            notificationService.cancelAllNotifications();
        };
    }, []);

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <Stack.Navigator
            initialRouteName={isAuthenticated ? "Home" : "Login"}
            screenOptions={{
                headerStyle: {
                    backgroundColor: colors.background.card,
                },
                headerTintColor: colors.text.primary,
                headerTitleStyle: {
                    fontWeight: '600',
                },
                cardStyle: {
                    backgroundColor: colors.background.primary,
                },
            }}
        >
            <Stack.Screen
                name="Login"
                component={LoginScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="Home"
                component={HomeScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen name="Register" component={RegistrationScreen} />
            <Stack.Screen name="Bookmarks" component={BookmarksScreen} />
            <Stack.Screen
                name="ChildProfileList"
                component={ChildProfileListScreen}
                options={{ title: 'Child Profiles' }}
            />
            <Stack.Screen
                name="AddChildProfile"
                component={AddChildProfileScreen}
                options={{ title: 'Add Child Profile' }}
            />
            <Stack.Screen
                name="EditChildProfile"
                component={EditChildProfileScreen}
                options={{ title: 'Edit Child Profile' }}
            />
            <Stack.Screen
                name="MonthlyBookList"
                component={MonthlyBookListScreen}
                options={{ title: 'Monthly Books' }}
            />
            <Stack.Screen
                name="MonthlyBook"
                component={MonthlyBookScreen}
                options={{
                    title: 'Reading',
                    headerShown: false,
                }}
            />
            <Stack.Screen
                name="Search"
                component={SearchScreen}
                options={{ title: 'Search' }}
            />
            <Stack.Screen
                name="Quiz"
                component={QuizScreen}
                options={{ title: 'Quiz' }}
            />
            <Stack.Screen
                name="Achievements"
                component={AchievementsScreen}
                options={{ title: 'Achievements' }}
            />
            <Stack.Screen
                name="ParentDashboard"
                component={ParentDashboardScreen}
                options={{ title: 'Parent Dashboard' }}
            />
        </Stack.Navigator>
    );
};

const getPrefix = () => {
    if (typeof window !== 'undefined' && window.location?.origin) {
        return window.location.origin;
    }
    return 'http://localhost:3003';
};

const linking = {
    prefixes: [getPrefix()],
    config: {
        screens: {
            Login: 'login',
            Home: '',
            Register: 'register',
            Bookmarks: 'bookmarks',
            ChildProfileList: 'child-profiles',
            AddChildProfile: 'child-profiles/add',
            EditChildProfile: 'child-profiles/edit',
            MonthlyBookList: 'monthly-books',
            MonthlyBook: 'monthly-books/:bookId',
            Search: 'search',
            Quiz: 'quiz',
            Achievements: 'achievements',
            ParentDashboard: 'parent-dashboard',
        },
    },
};

const App = () => {
    return (
        <AuthProvider>
            <NavigationContainer linking={linking}>
                <AppNavigator />
            </NavigationContainer>
        </AuthProvider>
    );
};

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background.primary,
    },
});

export default App;

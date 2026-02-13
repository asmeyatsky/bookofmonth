import React, { useEffect } from 'react';
import { ActivityIndicator, Platform, View, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
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
import { colors } from './src/theme';

const Stack = createStackNavigator();

const AppNavigator = () => {
    const { isLoading, isAuthenticated } = useAuth();

    useEffect(() => {
        // Push notifications are only available on native platforms
        if (Platform.OS !== 'web') {
            try {
                const { notificationService } = require('./src/services/NotificationService');
                notificationService.scheduleDailyNotification(
                    "New Daily Entry!",
                    "A new exciting story awaits you. Tap to read!",
                    8,
                    0
                );
                return () => {
                    notificationService.cancelAllNotifications();
                };
            } catch (e) {
                // Notification service not available
            }
        }
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
                ...(Platform.OS === 'web' ? { animationEnabled: false } : {}),
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

const App = () => {
    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <AuthProvider>
                <NavigationContainer>
                    <AppNavigator />
                </NavigationContainer>
            </AuthProvider>
        </GestureHandlerRootView>
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

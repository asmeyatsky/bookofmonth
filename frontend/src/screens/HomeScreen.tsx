import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Modal, Alert, TouchableOpacity, RefreshControl } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { ttsService } from '../services/TtsService';
import ImageViewer from 'react-native-image-zoom-viewer';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/ApiService';
import DailyEntryCard from '../components/DailyEntryCard';
import ProfileSwitcher from '../components/ProfileSwitcher';
import StreakDisplay from '../components/StreakDisplay';
import { colors, spacing, borderRadius, shadows } from '../theme';

interface NewsEvent {
    id: string;
    title: string;
    raw_content: string;
    image_url?: string;
    category?: string;
    age_appropriateness?: string;
    extracted_facts?: string[];
    discussion_questions?: string[];
    published_date?: string;
}

const HomeScreen = () => {
    const [newsEvents, setNewsEvents] = useState<NewsEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [isImageViewerVisible, setIsImageViewerVisible] = useState(false);
    const [currentImage, setCurrentImage] = useState<{url: string}[]>([]);
    const [bookmarkedEvents, setBookmarkedEvents] = useState<Set<string>>(new Set());
    const [readEvents, setReadEvents] = useState<Set<string>>(new Set());
    const [currentStreak, setCurrentStreak] = useState(0);
    const [longestStreak, setLongestStreak] = useState(0);

    const navigation = useNavigation();
    const { isAuthenticated, user, logout, activeChildProfile, refreshChildProfiles } = useAuth();

    useFocusEffect(
        useCallback(() => {
            loadData();
            return () => {
                ttsService.stop();
            };
        }, [isAuthenticated, activeChildProfile?.id])
    );

    const loadData = async () => {
        try {
            // Fetch news events with reading level filter
            const filters = activeChildProfile?.reading_level
                ? { readingLevel: activeChildProfile.reading_level }
                : undefined;
            const newsData = await apiService.getNewsEvents(filters);
            setNewsEvents(newsData.results || []);

            // Fetch user-specific data if authenticated
            if (isAuthenticated) {
                try {
                    const [bookmarksData, progressData, streakData] = await Promise.all([
                        apiService.getBookmarks(),
                        apiService.getReadingProgress(undefined, activeChildProfile?.id),
                        apiService.getReadingStreaks(activeChildProfile?.id),
                    ]);

                    if (Array.isArray(bookmarksData)) {
                        const bookmarkedIds = new Set(bookmarksData.map((bookmark: any) => bookmark.news_event.id));
                        setBookmarkedEvents(bookmarkedIds);
                    }

                    if (Array.isArray(progressData)) {
                        const readIds = new Set(
                            progressData
                                .filter((progress: any) => progress.completed)
                                .map((progress: any) => progress.news_event.id)
                        );
                        setReadEvents(readIds);
                    }

                    const streakArray = streakData.results || streakData || [];
                    if (streakArray.length > 0) {
                        setCurrentStreak(streakArray[0].current_streak || 0);
                        setLongestStreak(streakArray[0].longest_streak || 0);
                    }
                } catch (error) {
                    if (__DEV__) console.error('Error fetching user data:', error);
                }
            }
        } catch (error) {
            if (__DEV__) console.error('Error fetching news events:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    const handleProfileChange = () => {
        setLoading(true);
        loadData();
    };

    const openImageViewer = (imageUrl: string) => {
        setCurrentImage([{ url: imageUrl }]);
        setIsImageViewerVisible(true);
    };

    const toggleBookmark = async (newsEventId: string) => {
        if (!isAuthenticated) {
            Alert.alert(
                "Authentication Required",
                "Please log in to bookmark events.",
                [
                    { text: "Cancel", style: "cancel" },
                    { text: "Log In", onPress: () => navigation.navigate('Login' as never) }
                ]
            );
            return;
        }

        const isBookmarked = bookmarkedEvents.has(newsEventId);

        try {
            if (isBookmarked) {
                const bookmarks = await apiService.getBookmarks();
                const bookmarkToDelete = bookmarks.find((b: any) => b.news_event.id === newsEventId);

                if (bookmarkToDelete) {
                    await apiService.deleteBookmark(bookmarkToDelete.id);
                    setBookmarkedEvents(prev => {
                        const newSet = new Set(prev);
                        newSet.delete(newsEventId);
                        return newSet;
                    });
                }
            } else {
                await apiService.createBookmark(newsEventId);
                setBookmarkedEvents(prev => new Set(prev).add(newsEventId));
            }
        } catch (error: any) {
            if (__DEV__) console.error("Error toggling bookmark:", error);
            Alert.alert("Error", error.message || "Failed to toggle bookmark.");
        }
    };

    const markAsRead = async (newsEventId: string, completed: boolean) => {
        if (!isAuthenticated) {
            Alert.alert(
                "Authentication Required",
                "Please log in to track reading progress.",
                [
                    { text: "Cancel", style: "cancel" },
                    { text: "Log In", onPress: () => navigation.navigate('Login' as never) }
                ]
            );
            return;
        }

        try {
            const existingProgress = await apiService.getReadingProgress(newsEventId, activeChildProfile?.id);

            if (existingProgress && existingProgress.length > 0) {
                await apiService.patchReadingProgress(existingProgress[0].id, completed);
            } else {
                await apiService.updateReadingProgress(newsEventId, completed, activeChildProfile?.id);
            }

            setReadEvents(prev => {
                const newSet = new Set(prev);
                if (completed) {
                    newSet.add(newsEventId);
                } else {
                    newSet.delete(newsEventId);
                }
                return newSet;
            });

            // Refresh streak data after marking as read
            if (completed) {
                const streakData = await apiService.getReadingStreaks(activeChildProfile?.id);
                const streakArray = streakData.results || streakData || [];
                if (streakArray.length > 0) {
                    setCurrentStreak(streakArray[0].current_streak || 0);
                    setLongestStreak(streakArray[0].longest_streak || 0);
                }
            }
        } catch (error: any) {
            if (__DEV__) console.error("Error marking as read:", error);
            Alert.alert("Error", error.message || "Failed to update reading progress.");
        }
    };

    const handleLogout = async () => {
        Alert.alert(
            "Logout",
            "Are you sure you want to logout?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Logout",
                    style: "destructive",
                    onPress: async () => {
                        await logout();
                        navigation.reset({
                            index: 0,
                            routes: [{ name: 'Login' as never }],
                        });
                    }
                }
            ]
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Loading today's stories...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Text style={styles.title}>Daily Stories</Text>
                    {activeChildProfile && (
                        <Text style={styles.subtitle}>
                            Reading as {activeChildProfile.name}
                        </Text>
                    )}
                </View>
                <View style={styles.headerRight}>
                    {isAuthenticated ? (
                        <>
                            <ProfileSwitcher compact onProfileChange={handleProfileChange} />
                            <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                                <Icon name="sign-out" size={18} color={colors.text.secondary} />
                            </TouchableOpacity>
                        </>
                    ) : (
                        <TouchableOpacity
                            onPress={() => navigation.navigate('Login' as never)}
                            style={styles.loginButton}
                        >
                            <Text style={styles.loginText}>Log In</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Streak Display (if authenticated) */}
            {isAuthenticated && currentStreak > 0 && (
                <View style={styles.streakContainer}>
                    <StreakDisplay
                        currentStreak={currentStreak}
                        longestStreak={longestStreak}
                        size="small"
                    />
                </View>
            )}

            {/* Profile Switcher (full version if authenticated) */}
            {isAuthenticated && (
                <ProfileSwitcher onProfileChange={handleProfileChange} />
            )}

            {/* News Events List */}
            {newsEvents.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Icon name="book" size={60} color={colors.text.light} />
                    <Text style={styles.emptyTitle}>No Stories Yet</Text>
                    <Text style={styles.emptyText}>
                        {activeChildProfile
                            ? `No stories available for ${activeChildProfile.name}'s reading level yet.`
                            : 'Check back soon for new stories!'}
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={newsEvents}
                    keyExtractor={item => item.id.toString()}
                    renderItem={({ item }) => (
                        <DailyEntryCard
                            event={item}
                            isBookmarked={bookmarkedEvents.has(item.id)}
                            isRead={readEvents.has(item.id)}
                            onToggleBookmark={toggleBookmark}
                            onMarkAsRead={markAsRead}
                            onReadAloud={(content) => ttsService.speak(content)}
                            onImagePress={openImageViewer}
                            readingLevel={activeChildProfile?.reading_level}
                        />
                    )}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={[colors.primary]}
                            tintColor={colors.primary}
                        />
                    }
                />
            )}

            {/* Navigation Buttons */}
            <View style={styles.navContainer}>
                <TouchableOpacity
                    style={styles.navButton}
                    onPress={() => navigation.navigate('Bookmarks' as never)}
                >
                    <Icon name="bookmark" size={20} color={colors.accent} />
                    <Text style={styles.navButtonText}>Bookmarks</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.navButton}
                    onPress={() => navigation.navigate('MonthlyBookList' as never)}
                >
                    <Icon name="book" size={20} color={colors.primary} />
                    <Text style={styles.navButtonText}>Books</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.navButton}
                    onPress={() => navigation.navigate('Search' as never)}
                >
                    <Icon name="search" size={20} color={colors.secondary} />
                    <Text style={styles.navButtonText}>Search</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.navButton}
                    onPress={() => navigation.navigate('Achievements' as never)}
                >
                    <Icon name="trophy" size={20} color={colors.achievements.gold} />
                    <Text style={styles.navButtonText}>Awards</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.navButton}
                    onPress={() => navigation.navigate('ParentDashboard' as never)}
                >
                    <Icon name="users" size={20} color={colors.categories.arts} />
                    <Text style={styles.navButtonText}>Parents</Text>
                </TouchableOpacity>
            </View>

            {/* Image Viewer Modal */}
            <Modal visible={isImageViewerVisible} transparent={true}>
                <ImageViewer
                    imageUrls={currentImage}
                    enableSwipeDown={true}
                    onCancel={() => setIsImageViewerVisible(false)}
                />
            </Modal>
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
    loadingText: {
        marginTop: spacing.md,
        color: colors.text.secondary,
        fontSize: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingTop: spacing.md,
        paddingBottom: spacing.sm,
        backgroundColor: colors.background.card,
        ...shadows.sm,
    },
    headerLeft: {
        flex: 1,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.text.primary,
    },
    subtitle: {
        fontSize: 14,
        color: colors.text.secondary,
        marginTop: 2,
    },
    loginButton: {
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.md,
    },
    loginText: {
        color: colors.text.inverse,
        fontWeight: '600',
    },
    logoutButton: {
        padding: spacing.sm,
    },
    streakContainer: {
        alignItems: 'center',
        paddingVertical: spacing.sm,
        backgroundColor: colors.background.card,
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
    navContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: colors.background.card,
        paddingVertical: spacing.sm,
        borderTopWidth: 1,
        borderTopColor: colors.background.secondary,
        ...shadows.sm,
    },
    navButton: {
        alignItems: 'center',
        padding: spacing.xs,
    },
    navButtonText: {
        fontSize: 10,
        color: colors.text.secondary,
        marginTop: 2,
    },
});

export default HomeScreen;

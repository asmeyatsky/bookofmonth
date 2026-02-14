import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, FlatList, ScrollView, StyleSheet, ActivityIndicator, Modal, Alert, TouchableOpacity, RefreshControl, Platform, Image, Dimensions } from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { ttsService } from '../services/TtsService';
import Icon from 'react-native-vector-icons/FontAwesome';

// ImageViewer is native-only; on web we use a simple image modal
const ImageViewer = Platform.OS !== 'web'
    ? require('react-native-image-zoom-viewer').default
    : null;
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/ApiService';
import DailyEntryCard from '../components/DailyEntryCard';
import ProfileSwitcher from '../components/ProfileSwitcher';
import StreakDisplay from '../components/StreakDisplay';
import BottomNavBar from '../components/BottomNavBar';
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
    const route = useRoute();
    const { isAuthenticated, user, logout, activeChildProfile, refreshChildProfiles } = useAuth();
    const flatListRef = useRef<FlatList<NewsEvent>>(null);

    const [browsingAsGuest, setBrowsingAsGuest] = useState(
        !!(route.params as any)?.browseAsGuest
    );
    const [scrollToStoryId, setScrollToStoryId] = useState<string | null>(
        (route.params as any)?.scrollToStory ? (route.params as any)?.selectedStoryId : null
    );

    useFocusEffect(
        useCallback(() => {
            if (isAuthenticated || browsingAsGuest) {
                loadData();
            } else {
                setLoading(false);
            }
            return () => {
                ttsService.stop();
            };
        }, [isAuthenticated, activeChildProfile?.id, browsingAsGuest])
    );

    const loadData = async () => {
        try {
            // Fetch news events with reading level filter
            const filters = activeChildProfile?.reading_level
                ? { readingLevel: activeChildProfile.reading_level }
                : undefined;
            const newsData = await apiService.getNewsEvents(filters);
            setNewsEvents(newsData.results || []);

            // Scroll to selected story if coming from search
            if (scrollToStoryId) {
                setTimeout(() => {
                    const index = newsData.results?.findIndex((e: NewsEvent) => e.id === scrollToStoryId) ?? -1;
                    if (index >= 0) {
                        flatListRef.current?.scrollToIndex({ index, animated: true });
                    }
                }, 300);
            }

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
                        setBrowsingAsGuest(false);
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

    if (!isAuthenticated && !browsingAsGuest) {
        return (
            <ScrollView style={styles.container} contentContainerStyle={styles.welcomeContent}>
                {/* Hero Section */}
                <View style={styles.heroSection}>
                    <Icon name="book" size={64} color={colors.primary} />
                    <Text style={styles.heroTitle}>Book of the Month</Text>
                    <Text style={styles.heroTagline}>
                        Daily stories and news for young readers, made fun and age-appropriate
                    </Text>
                </View>

                {/* Feature Highlights */}
                <View style={styles.featuresGrid}>
                    {[
                        { icon: 'newspaper-o', title: 'Daily Stories', desc: 'Fresh, kid-friendly news every day' },
                        { icon: 'line-chart', title: 'Reading Streaks', desc: 'Build daily reading habits' },
                        { icon: 'bookmark', title: 'Bookmarks', desc: 'Save your favorite stories' },
                        { icon: 'book', title: 'Monthly Books', desc: 'Curated book recommendations' },
                    ].map((feature) => (
                        <View key={feature.icon} style={styles.featureCard}>
                            <View style={styles.featureIconWrapper}>
                                <Icon name={feature.icon} size={24} color={colors.text.inverse} />
                            </View>
                            <Text style={styles.featureTitle}>{feature.title}</Text>
                            <Text style={styles.featureDesc}>{feature.desc}</Text>
                        </View>
                    ))}
                </View>

                {/* CTA Buttons */}
                <View style={styles.ctaContainer}>
                    <TouchableOpacity
                        style={styles.ctaPrimary}
                        onPress={() => navigation.navigate('Login' as never)}
                    >
                        <Text style={styles.ctaPrimaryText}>Sign Up</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.ctaSecondary}
                        onPress={() => navigation.navigate('Login' as never)}
                    >
                        <Text style={styles.ctaSecondaryText}>Log In</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.ctaTertiary}
                        onPress={() => {
                            setBrowsingAsGuest(true);
                            setLoading(true);
                        }}
                    >
                        <Text style={styles.ctaTertiaryText}>Browse as Guest</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        );
    }

    const renderStoryCard = (item: NewsEvent) => (
        <DailyEntryCard
            key={item.id.toString()}
            event={item}
            isBookmarked={bookmarkedEvents.has(item.id)}
            isRead={readEvents.has(item.id)}
            onToggleBookmark={toggleBookmark}
            onMarkAsRead={markAsRead}
            onReadAloud={(content) => ttsService.speak(content)}
            onImagePress={openImageViewer}
            readingLevel={activeChildProfile?.reading_level}
        />
    );

    if (Platform.OS === 'web') {
        // Web: Use View with explicit height
        const screenHeight = Dimensions.get('window').height;
        return (
            <View style={{ height: screenHeight, flexDirection: 'column' }}>
                <ScrollView 
                    style={styles.container} 
                    contentContainerStyle={styles.webContentContainer}
                    showsVerticalScrollIndicator={true}
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerLeft}>
                            <TouchableOpacity
                                style={styles.homeButton}
                                onPress={() => navigation.navigate('Home' as never)}
                            >
                                <Icon name="home" size={18} color={colors.primary} />
                            </TouchableOpacity>
                            <View>
                                <Text style={styles.title}>Daily Stories</Text>
                                {activeChildProfile && (
                                    <Text style={styles.subtitle}>
                                        Reading as {activeChildProfile.name}
                                    </Text>
                                )}
                            </View>
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

                    {isAuthenticated && currentStreak > 0 && (
                        <View style={styles.streakContainer}>
                            <StreakDisplay currentStreak={currentStreak} longestStreak={longestStreak} size="small" />
                        </View>
                    )}

                    {isAuthenticated && (
                        <ProfileSwitcher onProfileChange={handleProfileChange} />
                    )}

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
                        <View style={styles.listContent}>
                            {newsEvents.map(renderStoryCard)}
                        </View>
                    )}
                </ScrollView>

                <BottomNavBar />

                <Modal visible={isImageViewerVisible} transparent={true}>
                    <TouchableOpacity
                        style={styles.webImageViewerOverlay}
                        activeOpacity={1}
                        onPress={() => setIsImageViewerVisible(false)}
                    >
                        {currentImage.length > 0 && (
                            <Image
                                source={{ uri: currentImage[0].url }}
                                style={styles.webImageViewerImage}
                                resizeMode="contain"
                            />
                        )}
                    </TouchableOpacity>
                </Modal>
            </View>
        );
    }

    // Native: FlatList with fixed header and bottom nav
    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity
                        style={styles.homeButton}
                        onPress={() => navigation.navigate('Home' as never)}
                    >
                        <Icon name="home" size={18} color={colors.primary} />
                    </TouchableOpacity>
                    <View>
                        <Text style={styles.title}>Daily Stories</Text>
                        {activeChildProfile && (
                            <Text style={styles.subtitle}>
                                Reading as {activeChildProfile.name}
                            </Text>
                        )}
                    </View>
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

            {isAuthenticated && currentStreak > 0 && (
                <View style={styles.streakContainer}>
                    <StreakDisplay currentStreak={currentStreak} longestStreak={longestStreak} size="small" />
                </View>
            )}

            {isAuthenticated && (
                <ProfileSwitcher onProfileChange={handleProfileChange} />
            )}

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
                    ref={flatListRef}
                    style={{ flex: 1 }}
                    data={newsEvents}
                    keyExtractor={item => item.id.toString()}
                    renderItem={({ item }) => renderStoryCard(item)}
                    onScrollToIndexFailed={(info) => {
                        setTimeout(() => {
                            flatListRef.current?.scrollToIndex({ index: info.index, animated: true });
                        }, 100);
                    }}
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

            <BottomNavBar />

            <Modal visible={isImageViewerVisible} transparent={true}>
                {ImageViewer && (
                    <ImageViewer
                        imageUrls={currentImage}
                        enableSwipeDown={true}
                        onCancel={() => setIsImageViewerVisible(false)}
                    />
                )}
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background.primary,
    },
    webContentContainer: {
        flexGrow: 1,
        paddingBottom: spacing.xl,
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
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    homeButton: {
        padding: spacing.xs,
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
    webImageViewerOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    webImageViewerImage: {
        width: Dimensions.get('window').width * 0.9,
        height: Dimensions.get('window').height * 0.8,
    },
    // Welcome screen styles
    welcomeContent: {
        flexGrow: 1,
        paddingBottom: spacing.xl,
    },
    heroSection: {
        alignItems: 'center',
        paddingTop: spacing.xxl,
        paddingBottom: spacing.lg,
        paddingHorizontal: spacing.md,
    },
    heroTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: colors.text.primary,
        marginTop: spacing.md,
        textAlign: 'center',
    },
    heroTagline: {
        fontSize: 16,
        color: colors.text.secondary,
        textAlign: 'center',
        marginTop: spacing.sm,
        lineHeight: 24,
        paddingHorizontal: spacing.md,
    },
    featuresGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        paddingHorizontal: spacing.md,
        marginTop: spacing.lg,
        gap: spacing.md,
    },
    featureCard: {
        width: '44%',
        backgroundColor: colors.background.card,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        alignItems: 'center',
        ...shadows.md,
    },
    featureIconWrapper: {
        width: 48,
        height: 48,
        borderRadius: borderRadius.round,
        backgroundColor: colors.secondary,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.sm,
    },
    featureTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.text.primary,
        textAlign: 'center',
    },
    featureDesc: {
        fontSize: 12,
        color: colors.text.secondary,
        textAlign: 'center',
        marginTop: 4,
    },
    ctaContainer: {
        paddingHorizontal: spacing.lg,
        marginTop: spacing.xl,
        gap: spacing.sm,
    },
    ctaPrimary: {
        backgroundColor: colors.primary,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.lg,
        alignItems: 'center',
        ...shadows.md,
    },
    ctaPrimaryText: {
        color: colors.text.inverse,
        fontSize: 18,
        fontWeight: 'bold',
    },
    ctaSecondary: {
        backgroundColor: colors.background.card,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.lg,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: colors.primary,
    },
    ctaSecondaryText: {
        color: colors.primary,
        fontSize: 18,
        fontWeight: 'bold',
    },
    ctaTertiary: {
        paddingVertical: spacing.md,
        alignItems: 'center',
    },
    ctaTertiaryText: {
        color: colors.text.secondary,
        fontSize: 16,
        textDecorationLine: 'underline',
    },
});

export default HomeScreen;

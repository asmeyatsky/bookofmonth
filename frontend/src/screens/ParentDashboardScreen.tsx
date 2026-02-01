import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    Alert,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
} from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/ApiService';
import StreakDisplay from '../components/StreakDisplay';
import ReadingProgressBar from '../components/ReadingProgressBar';
import CategoryBadge from '../components/CategoryBadge';
import { colors, spacing, borderRadius, shadows, getReadingLevelDisplay, getReadingLevelColor } from '../theme';

interface ChildStats {
    profileId: number;
    name: string;
    age: number;
    readingLevel: string;
    totalRead: number;
    currentStreak: number;
    longestStreak: number;
    achievementsEarned: number;
    totalAchievements: number;
    categoriesRead: { [key: string]: number };
}

const ParentDashboardScreen = () => {
    const [childStats, setChildStats] = useState<ChildStats[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedChildIndex, setSelectedChildIndex] = useState(0);
    const [totalAchievements, setTotalAchievements] = useState(0);

    const navigation = useNavigation();
    const isFocused = useIsFocused();
    const { isAuthenticated, user, childProfiles } = useAuth();

    const fetchData = async () => {
        if (!isAuthenticated) {
            setLoading(false);
            return;
        }

        try {
            // Fetch all achievements count
            const achievementsData = await apiService.getAchievements();
            const allAchievements = achievementsData.results || achievementsData || [];
            setTotalAchievements(allAchievements.length);

            // Fetch stats for each child profile
            const statsPromises = childProfiles.map(async (profile) => {
                const [progressData, streakData, userAchievementsData] = await Promise.all([
                    apiService.getReadingProgress(undefined, profile.id),
                    apiService.getReadingStreaks(profile.id),
                    apiService.getUserAchievements(profile.id),
                ]);

                const progressArray = progressData.results || progressData || [];
                const streakArray = streakData.results || streakData || [];
                const userAchievements = userAchievementsData.results || userAchievementsData || [];

                // Calculate categories read
                const categoriesRead: { [key: string]: number } = {};
                progressArray.forEach((p: any) => {
                    if (p.completed && p.news_event?.category) {
                        const cat = p.news_event.category;
                        categoriesRead[cat] = (categoriesRead[cat] || 0) + 1;
                    }
                });

                return {
                    profileId: profile.id,
                    name: profile.name,
                    age: profile.age,
                    readingLevel: profile.reading_level,
                    totalRead: progressArray.filter((p: any) => p.completed).length,
                    currentStreak: streakArray[0]?.current_streak || 0,
                    longestStreak: streakArray[0]?.longest_streak || 0,
                    achievementsEarned: userAchievements.length,
                    totalAchievements: allAchievements.length,
                    categoriesRead,
                };
            });

            const stats = await Promise.all(statsPromises);
            setChildStats(stats);
        } catch (error: any) {
            console.error("Error fetching parent dashboard data:", error);
            Alert.alert("Error", error.message || "Failed to fetch dashboard data.");
        } finally {
            setLoading(false);
            setRefreshing(false);
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
    }, [isFocused, isAuthenticated, childProfiles]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const getTopCategories = (categories: { [key: string]: number }) => {
        return Object.entries(categories)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5);
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Loading dashboard...</Text>
            </View>
        );
    }

    if (!isAuthenticated) {
        return (
            <View style={styles.container}>
                <View style={styles.emptyContainer}>
                    <Icon name="lock" size={60} color={colors.text.light} />
                    <Text style={styles.emptyTitle}>Login Required</Text>
                    <Text style={styles.emptyText}>Please log in to view the parent dashboard.</Text>
                </View>
            </View>
        );
    }

    const selectedChild = childStats[selectedChildIndex];

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.contentContainer}
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    colors={[colors.primary]}
                    tintColor={colors.primary}
                />
            }
        >
            {/* Welcome Header */}
            <View style={styles.welcomeHeader}>
                <Text style={styles.welcomeTitle}>Welcome, {user?.first_name || user?.username}!</Text>
                <Text style={styles.welcomeSubtitle}>Here's how your children are doing</Text>
            </View>

            {childStats.length === 0 ? (
                <View style={styles.noChildrenCard}>
                    <Icon name="child" size={40} color={colors.text.light} />
                    <Text style={styles.noChildrenTitle}>No Child Profiles</Text>
                    <Text style={styles.noChildrenText}>
                        Add a child profile to start tracking their reading progress.
                    </Text>
                    <TouchableOpacity
                        style={styles.addChildButton}
                        onPress={() => navigation.navigate('AddChildProfile' as never)}
                    >
                        <Icon name="plus" size={16} color={colors.text.inverse} />
                        <Text style={styles.addChildButtonText}>Add Child Profile</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <>
                    {/* Child Profile Tabs */}
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.tabsContainer}
                        contentContainerStyle={styles.tabsContent}
                    >
                        {childStats.map((child, index) => (
                            <TouchableOpacity
                                key={child.profileId}
                                style={[
                                    styles.childTab,
                                    selectedChildIndex === index && styles.childTabActive,
                                ]}
                                onPress={() => setSelectedChildIndex(index)}
                            >
                                <View style={[
                                    styles.childAvatar,
                                    { backgroundColor: getReadingLevelColor(child.readingLevel) }
                                ]}>
                                    <Text style={styles.childAvatarText}>
                                        {child.name.charAt(0).toUpperCase()}
                                    </Text>
                                </View>
                                <Text style={[
                                    styles.childTabName,
                                    selectedChildIndex === index && styles.childTabNameActive,
                                ]}>
                                    {child.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {selectedChild && (
                        <>
                            {/* Child Info Card */}
                            <View style={styles.childInfoCard}>
                                <View style={styles.childInfoHeader}>
                                    <View>
                                        <Text style={styles.childName}>{selectedChild.name}</Text>
                                        <Text style={styles.childAge}>Age {selectedChild.age}</Text>
                                    </View>
                                    <View style={[
                                        styles.levelBadgeLarge,
                                        { backgroundColor: getReadingLevelColor(selectedChild.readingLevel) }
                                    ]}>
                                        <Icon name="book" size={12} color={colors.text.inverse} />
                                        <Text style={styles.levelBadgeText}>
                                            {getReadingLevelDisplay(selectedChild.readingLevel)}
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            {/* Stats Grid */}
                            <View style={styles.statsGrid}>
                                {/* Streak Card */}
                                <View style={styles.statCard}>
                                    <StreakDisplay
                                        currentStreak={selectedChild.currentStreak}
                                        longestStreak={selectedChild.longestStreak}
                                        size="medium"
                                        showLongest
                                    />
                                </View>

                                {/* Stories Read */}
                                <View style={styles.statCard}>
                                    <Icon name="book" size={32} color={colors.primary} />
                                    <Text style={styles.statNumber}>{selectedChild.totalRead}</Text>
                                    <Text style={styles.statLabel}>Stories Read</Text>
                                </View>

                                {/* Achievements */}
                                <View style={styles.statCard}>
                                    <Icon name="trophy" size={32} color={colors.achievements.gold} />
                                    <Text style={styles.statNumber}>
                                        {selectedChild.achievementsEarned}/{totalAchievements}
                                    </Text>
                                    <Text style={styles.statLabel}>Achievements</Text>
                                    <ReadingProgressBar
                                        progress={(selectedChild.achievementsEarned / totalAchievements) * 100}
                                        showPercentage={false}
                                        height={8}
                                        color={colors.achievements.gold}
                                        style={styles.achievementProgress}
                                    />
                                </View>
                            </View>

                            {/* Topic Distribution */}
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Favorite Topics</Text>
                                {Object.keys(selectedChild.categoriesRead).length === 0 ? (
                                    <Text style={styles.emptyText}>
                                        No topics read yet. Start reading to see favorites!
                                    </Text>
                                ) : (
                                    <View style={styles.topicsContainer}>
                                        {getTopCategories(selectedChild.categoriesRead).map(([category, count]) => (
                                            <View key={category} style={styles.topicItem}>
                                                <CategoryBadge category={category} size="medium" />
                                                <View style={styles.topicBar}>
                                                    <View style={[
                                                        styles.topicBarFill,
                                                        {
                                                            width: `${(count / selectedChild.totalRead) * 100}%`,
                                                        }
                                                    ]} />
                                                </View>
                                                <Text style={styles.topicCount}>{count}</Text>
                                            </View>
                                        ))}
                                    </View>
                                )}
                            </View>

                            {/* Quick Actions */}
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Quick Actions</Text>
                                <View style={styles.actionsGrid}>
                                    <TouchableOpacity
                                        style={styles.actionButton}
                                        onPress={() => navigation.navigate('ChildProfileList' as never)}
                                    >
                                        <Icon name="users" size={24} color={colors.secondary} />
                                        <Text style={styles.actionButtonText}>Manage Profiles</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.actionButton}
                                        onPress={() => navigation.navigate('Achievements' as never)}
                                    >
                                        <Icon name="trophy" size={24} color={colors.achievements.gold} />
                                        <Text style={styles.actionButtonText}>View Achievements</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.actionButton}
                                        onPress={() => navigation.navigate('MonthlyBookList' as never)}
                                    >
                                        <Icon name="book" size={24} color={colors.primary} />
                                        <Text style={styles.actionButtonText}>Browse Books</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </>
                    )}
                </>
            )}

            {/* Settings Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Settings & Controls</Text>
                <View style={styles.settingsCard}>
                    <TouchableOpacity style={styles.settingItem}>
                        <Icon name="bell" size={20} color={colors.text.secondary} />
                        <Text style={styles.settingText}>Notification Settings</Text>
                        <Icon name="chevron-right" size={14} color={colors.text.light} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.settingItem}>
                        <Icon name="shield" size={20} color={colors.text.secondary} />
                        <Text style={styles.settingText}>Content Controls</Text>
                        <Icon name="chevron-right" size={14} color={colors.text.light} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.settingItem}>
                        <Icon name="clock-o" size={20} color={colors.text.secondary} />
                        <Text style={styles.settingText}>Reading Time Limits</Text>
                        <Icon name="chevron-right" size={14} color={colors.text.light} />
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background.primary,
    },
    contentContainer: {
        padding: spacing.md,
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
    welcomeHeader: {
        marginBottom: spacing.lg,
    },
    welcomeTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: colors.text.primary,
    },
    welcomeSubtitle: {
        fontSize: 16,
        color: colors.text.secondary,
        marginTop: spacing.xs,
    },
    noChildrenCard: {
        backgroundColor: colors.background.card,
        borderRadius: borderRadius.lg,
        padding: spacing.xl,
        alignItems: 'center',
        ...shadows.md,
    },
    noChildrenTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.text.primary,
        marginTop: spacing.md,
    },
    noChildrenText: {
        fontSize: 14,
        color: colors.text.secondary,
        textAlign: 'center',
        marginTop: spacing.sm,
        marginBottom: spacing.lg,
    },
    addChildButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.md,
        gap: spacing.sm,
    },
    addChildButtonText: {
        color: colors.text.inverse,
        fontWeight: '600',
    },
    tabsContainer: {
        marginBottom: spacing.md,
    },
    tabsContent: {
        paddingHorizontal: spacing.xs,
    },
    childTab: {
        alignItems: 'center',
        padding: spacing.sm,
        marginRight: spacing.sm,
        borderRadius: borderRadius.md,
        backgroundColor: colors.background.card,
        minWidth: 80,
    },
    childTabActive: {
        backgroundColor: colors.primary,
    },
    childAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.xs,
    },
    childAvatarText: {
        color: colors.text.inverse,
        fontWeight: 'bold',
        fontSize: 18,
    },
    childTabName: {
        fontSize: 12,
        color: colors.text.secondary,
        fontWeight: '500',
    },
    childTabNameActive: {
        color: colors.text.inverse,
    },
    childInfoCard: {
        backgroundColor: colors.background.card,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.md,
        ...shadows.sm,
    },
    childInfoHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    childName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.text.primary,
    },
    childAge: {
        fontSize: 14,
        color: colors.text.secondary,
    },
    levelBadgeLarge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.round,
        gap: spacing.xs,
    },
    levelBadgeText: {
        color: colors.text.inverse,
        fontSize: 12,
        fontWeight: '600',
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.md,
        marginBottom: spacing.lg,
    },
    statCard: {
        flex: 1,
        minWidth: 100,
        backgroundColor: colors.background.card,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        alignItems: 'center',
        ...shadows.sm,
    },
    statNumber: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.text.primary,
        marginTop: spacing.sm,
    },
    statLabel: {
        fontSize: 12,
        color: colors.text.secondary,
        marginTop: spacing.xs,
    },
    achievementProgress: {
        marginTop: spacing.sm,
        width: '100%',
    },
    section: {
        marginBottom: spacing.lg,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.text.primary,
        marginBottom: spacing.md,
    },
    topicsContainer: {
        backgroundColor: colors.background.card,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        ...shadows.sm,
    },
    topicItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
        gap: spacing.sm,
    },
    topicBar: {
        flex: 1,
        height: 8,
        backgroundColor: colors.background.secondary,
        borderRadius: borderRadius.round,
        overflow: 'hidden',
    },
    topicBarFill: {
        height: '100%',
        backgroundColor: colors.secondary,
        borderRadius: borderRadius.round,
    },
    topicCount: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.text.primary,
        width: 30,
        textAlign: 'right',
    },
    actionsGrid: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    actionButton: {
        flex: 1,
        backgroundColor: colors.background.card,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        alignItems: 'center',
        ...shadows.sm,
    },
    actionButtonText: {
        fontSize: 12,
        color: colors.text.secondary,
        marginTop: spacing.xs,
        textAlign: 'center',
    },
    settingsCard: {
        backgroundColor: colors.background.card,
        borderRadius: borderRadius.lg,
        ...shadows.sm,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.background.secondary,
        gap: spacing.md,
    },
    settingText: {
        flex: 1,
        fontSize: 14,
        color: colors.text.primary,
    },
});

export default ParentDashboardScreen;

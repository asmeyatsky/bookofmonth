import React, { useEffect, useState, useRef } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    ActivityIndicator,
    Image,
    Alert,
    TouchableOpacity,
    Modal,
    Animated,
    RefreshControl,
} from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/ApiService';
import ReadingProgressBar from '../components/ReadingProgressBar';
import BottomNavBar from '../components/BottomNavBar';
import { colors, spacing, borderRadius, shadows } from '../theme';

interface Achievement {
    id: number;
    name: string;
    description: string;
    image_url?: string;
    criteria_type?: string;
    criteria_value?: number;
    points?: number;
}

interface UserAchievement {
    id: number;
    achievement: Achievement;
    earned_at: string;
}

const AchievementsScreen = () => {
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
    const [showModal, setShowModal] = useState(false);

    const isFocused = useIsFocused();
    const navigation = useNavigation();
    const { isAuthenticated, activeChildProfile } = useAuth();

    // Animation refs for newly earned badges
    const scaleAnims = useRef<{ [key: number]: Animated.Value }>({});

    const fetchAchievements = async () => {
        if (!isAuthenticated) {
            setLoading(false);
            return;
        }

        try {
            const [achievementsData, userAchievementsData] = await Promise.all([
                apiService.getAchievements(),
                apiService.getUserAchievements(activeChildProfile?.id),
            ]);

            setAchievements(achievementsData.results || achievementsData || []);
            setUserAchievements(userAchievementsData.results || userAchievementsData || []);

            // Initialize scale animations for each achievement
            (achievementsData.results || achievementsData || []).forEach((a: Achievement) => {
                if (!scaleAnims.current[a.id]) {
                    scaleAnims.current[a.id] = new Animated.Value(1);
                }
            });
        } catch (error: any) {
            if (__DEV__) console.error("Error fetching achievements:", error);
            Alert.alert("Error", error.message || "Failed to fetch achievements.");
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
    }, [isFocused, isAuthenticated, activeChildProfile?.id]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchAchievements();
    };

    const isEarned = (achievementId: number): boolean => {
        return userAchievements.some(ua => ua.achievement.id === achievementId);
    };

    const getEarnedDate = (achievementId: number): string | null => {
        const ua = userAchievements.find(u => u.achievement.id === achievementId);
        if (ua) {
            return new Date(ua.earned_at).toLocaleDateString();
        }
        return null;
    };

    const handleAchievementPress = (achievement: Achievement) => {
        // Animate the pressed achievement
        const anim = scaleAnims.current[achievement.id];
        if (anim) {
            Animated.sequence([
                Animated.timing(anim, {
                    toValue: 0.95,
                    duration: 100,
                    useNativeDriver: true,
                }),
                Animated.timing(anim, {
                    toValue: 1,
                    duration: 100,
                    useNativeDriver: true,
                }),
            ]).start();
        }

        setSelectedAchievement(achievement);
        setShowModal(true);
    };

    const getAchievementIcon = (criteriaType?: string): string => {
        switch (criteriaType) {
            case 'stories_read':
                return 'book';
            case 'streak_days':
                return 'fire';
            case 'categories_explored':
                return 'compass';
            case 'quizzes_completed':
                return 'question-circle';
            case 'perfect_quizzes':
                return 'star';
            default:
                return 'trophy';
        }
    };

    const earnedCount = userAchievements.length;
    const totalCount = achievements.length;
    const progressPercent = totalCount > 0 ? (earnedCount / totalCount) * 100 : 0;

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Loading achievements...</Text>
            </View>
        );
    }

    if (!isAuthenticated) {
        return (
            <View style={styles.container}>
                <View style={styles.emptyContainer}>
                    <Icon name="lock" size={60} color={colors.text.light} />
                    <Text style={styles.emptyTitle}>Login Required</Text>
                    <Text style={styles.emptyText}>Please log in to view achievements.</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Progress Header */}
            <View style={styles.progressHeader}>
                <View style={styles.progressInfo}>
                    <Text style={styles.progressTitle}>Your Progress</Text>
                    <Text style={styles.progressCount}>{earnedCount} of {totalCount} earned</Text>
                </View>
                <View style={styles.trophyContainer}>
                    <Icon name="trophy" size={40} color={colors.achievements.gold} />
                    <Text style={styles.earnedCount}>{earnedCount}</Text>
                </View>
            </View>
            <ReadingProgressBar
                progress={progressPercent}
                showPercentage
                height={16}
                color={colors.achievements.gold}
                style={styles.progressBar}
            />

            {achievements.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Icon name="trophy" size={60} color={colors.text.light} />
                    <Text style={styles.emptyTitle}>No Achievements Yet</Text>
                    <Text style={styles.emptyText}>Start reading to earn your first achievement!</Text>
                </View>
            ) : (
                <FlatList
                    data={achievements}
                    keyExtractor={item => item.id.toString()}
                    numColumns={2}
                    renderItem={({ item }) => {
                        const earned = isEarned(item.id);
                        const earnedDate = getEarnedDate(item.id);
                        const scaleAnim = scaleAnims.current[item.id] || new Animated.Value(1);

                        return (
                            <TouchableOpacity
                                style={styles.achievementWrapper}
                                onPress={() => handleAchievementPress(item)}
                                activeOpacity={0.8}
                            >
                                <Animated.View
                                    style={[
                                        styles.achievementCard,
                                        earned ? styles.achievementCardEarned : styles.achievementCardLocked,
                                        { transform: [{ scale: scaleAnim }] },
                                    ]}
                                >
                                    {/* Badge Image or Icon */}
                                    <View style={[
                                        styles.badgeContainer,
                                        earned ? styles.badgeContainerEarned : styles.badgeContainerLocked,
                                    ]}>
                                        {item.image_url ? (
                                            <Image
                                                source={{ uri: item.image_url }}
                                                style={[
                                                    styles.badgeImage,
                                                    !earned && styles.badgeImageLocked,
                                                ]}
                                            />
                                        ) : (
                                            <Icon
                                                name={getAchievementIcon(item.criteria_type)}
                                                size={40}
                                                color={earned ? colors.achievements.gold : colors.text.light}
                                            />
                                        )}
                                        {!earned && (
                                            <View style={styles.lockOverlay}>
                                                <Icon name="lock" size={20} color={colors.text.inverse} />
                                            </View>
                                        )}
                                    </View>

                                    {/* Achievement Name */}
                                    <Text
                                        style={[
                                            styles.achievementName,
                                            !earned && styles.achievementNameLocked,
                                        ]}
                                        numberOfLines={2}
                                    >
                                        {item.name}
                                    </Text>

                                    {/* Points */}
                                    {item.points && (
                                        <View style={styles.pointsBadge}>
                                            <Icon name="star" size={10} color={colors.achievements.gold} />
                                            <Text style={styles.pointsText}>{item.points} pts</Text>
                                        </View>
                                    )}

                                    {/* Earned Date */}
                                    {earned && earnedDate && (
                                        <Text style={styles.earnedDate}>Earned {earnedDate}</Text>
                                    )}

                                    {/* Earned Checkmark */}
                                    {earned && (
                                        <View style={styles.checkBadge}>
                                            <Icon name="check" size={12} color={colors.text.inverse} />
                                        </View>
                                    )}
                                </Animated.View>
                            </TouchableOpacity>
                        );
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

            {/* Achievement Detail Modal */}
            <Modal visible={showModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        {selectedAchievement && (
                            <>
                                <TouchableOpacity
                                    style={styles.modalClose}
                                    onPress={() => setShowModal(false)}
                                >
                                    <Icon name="times" size={24} color={colors.text.secondary} />
                                </TouchableOpacity>

                                <View style={[
                                    styles.modalBadge,
                                    isEarned(selectedAchievement.id)
                                        ? styles.modalBadgeEarned
                                        : styles.modalBadgeLocked,
                                ]}>
                                    {selectedAchievement.image_url ? (
                                        <Image
                                            source={{ uri: selectedAchievement.image_url }}
                                            style={styles.modalBadgeImage}
                                        />
                                    ) : (
                                        <Icon
                                            name={getAchievementIcon(selectedAchievement.criteria_type)}
                                            size={60}
                                            color={isEarned(selectedAchievement.id)
                                                ? colors.achievements.gold
                                                : colors.text.light}
                                        />
                                    )}
                                </View>

                                <Text style={styles.modalTitle}>{selectedAchievement.name}</Text>
                                <Text style={styles.modalDescription}>{selectedAchievement.description}</Text>

                                {selectedAchievement.points && (
                                    <View style={styles.modalPoints}>
                                        <Icon name="star" size={16} color={colors.achievements.gold} />
                                        <Text style={styles.modalPointsText}>
                                            {selectedAchievement.points} points
                                        </Text>
                                    </View>
                                )}

                                {isEarned(selectedAchievement.id) ? (
                                    <View style={styles.modalEarned}>
                                        <Icon name="check-circle" size={20} color={colors.status.success} />
                                        <Text style={styles.modalEarnedText}>
                                            Earned on {getEarnedDate(selectedAchievement.id)}
                                        </Text>
                                    </View>
                                ) : (
                                    <View style={styles.modalLocked}>
                                        <Icon name="lock" size={20} color={colors.text.light} />
                                        <Text style={styles.modalLockedText}>
                                            Keep reading to unlock!
                                        </Text>
                                    </View>
                                )}

                                <TouchableOpacity
                                    style={styles.modalButton}
                                    onPress={() => setShowModal(false)}
                                >
                                    <Text style={styles.modalButtonText}>Close</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </View>
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
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.md,
        backgroundColor: colors.background.card,
    },
    progressInfo: {
        flex: 1,
    },
    progressTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.text.primary,
    },
    progressCount: {
        fontSize: 14,
        color: colors.text.secondary,
        marginTop: spacing.xs,
    },
    trophyContainer: {
        alignItems: 'center',
    },
    earnedCount: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.achievements.gold,
        marginTop: spacing.xs,
    },
    progressBar: {
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.md,
        backgroundColor: colors.background.card,
    },
    listContent: {
        padding: spacing.sm,
    },
    achievementWrapper: {
        flex: 1,
        padding: spacing.xs,
    },
    achievementCard: {
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        alignItems: 'center',
        position: 'relative',
        minHeight: 180,
        ...shadows.sm,
    },
    achievementCardEarned: {
        backgroundColor: colors.background.card,
        borderWidth: 2,
        borderColor: colors.achievements.gold,
    },
    achievementCardLocked: {
        backgroundColor: colors.background.secondary,
        opacity: 0.8,
    },
    badgeContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.sm,
        position: 'relative',
    },
    badgeContainerEarned: {
        backgroundColor: `${colors.achievements.gold}20`,
    },
    badgeContainerLocked: {
        backgroundColor: colors.background.card,
    },
    badgeImage: {
        width: 70,
        height: 70,
        borderRadius: 35,
    },
    badgeImageLocked: {
        opacity: 0.5,
    },
    lockOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: colors.background.overlay,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    achievementName: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.text.primary,
        textAlign: 'center',
        marginBottom: spacing.xs,
    },
    achievementNameLocked: {
        color: colors.text.light,
    },
    pointsBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: spacing.xs,
    },
    pointsText: {
        fontSize: 12,
        color: colors.achievements.gold,
        fontWeight: '600',
    },
    earnedDate: {
        fontSize: 10,
        color: colors.text.secondary,
        marginTop: spacing.xs,
    },
    checkBadge: {
        position: 'absolute',
        top: spacing.sm,
        right: spacing.sm,
        backgroundColor: colors.status.success,
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: colors.background.overlay,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.lg,
    },
    modalContent: {
        backgroundColor: colors.background.card,
        borderRadius: borderRadius.xl,
        padding: spacing.xl,
        width: '100%',
        maxWidth: 340,
        alignItems: 'center',
    },
    modalClose: {
        position: 'absolute',
        top: spacing.md,
        right: spacing.md,
    },
    modalBadge: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    modalBadgeEarned: {
        backgroundColor: `${colors.achievements.gold}20`,
        borderWidth: 3,
        borderColor: colors.achievements.gold,
    },
    modalBadgeLocked: {
        backgroundColor: colors.background.secondary,
    },
    modalBadgeImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: colors.text.primary,
        textAlign: 'center',
        marginBottom: spacing.sm,
    },
    modalDescription: {
        fontSize: 14,
        color: colors.text.secondary,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: spacing.md,
    },
    modalPoints: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        marginBottom: spacing.md,
    },
    modalPointsText: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.achievements.gold,
    },
    modalEarned: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        backgroundColor: `${colors.status.success}20`,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.md,
        marginBottom: spacing.lg,
    },
    modalEarnedText: {
        fontSize: 14,
        color: colors.status.success,
        fontWeight: '500',
    },
    modalLocked: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        backgroundColor: colors.background.secondary,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.md,
        marginBottom: spacing.lg,
    },
    modalLockedText: {
        fontSize: 14,
        color: colors.text.secondary,
    },
    modalButton: {
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.md,
    },
    modalButtonText: {
        color: colors.text.inverse,
        fontWeight: '600',
        fontSize: 16,
    },
});

export default AchievementsScreen;

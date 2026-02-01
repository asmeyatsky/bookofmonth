import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { colors, spacing, borderRadius, shadows } from '../theme';

interface StreakDisplayProps {
    currentStreak: number;
    longestStreak?: number;
    size?: 'small' | 'medium' | 'large';
    showLongest?: boolean;
    animated?: boolean;
    style?: object;
}

const StreakDisplay: React.FC<StreakDisplayProps> = ({
    currentStreak,
    longestStreak,
    size = 'medium',
    showLongest = true,
    animated = true,
    style,
}) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const glowAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (animated && currentStreak > 0) {
            // Pulse animation for active streaks
            Animated.loop(
                Animated.sequence([
                    Animated.timing(glowAnim, {
                        toValue: 1,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(glowAnim, {
                        toValue: 0,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                ])
            ).start();

            // Scale animation on mount
            Animated.sequence([
                Animated.timing(scaleAnim, {
                    toValue: 1.1,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [currentStreak, animated]);

    const getSizeStyles = () => {
        switch (size) {
            case 'small':
                return {
                    container: styles.containerSmall,
                    iconSize: 20,
                    numberStyle: styles.numberSmall,
                    labelStyle: styles.labelSmall,
                };
            case 'large':
                return {
                    container: styles.containerLarge,
                    iconSize: 40,
                    numberStyle: styles.numberLarge,
                    labelStyle: styles.labelLarge,
                };
            default:
                return {
                    container: styles.containerMedium,
                    iconSize: 28,
                    numberStyle: styles.numberMedium,
                    labelStyle: styles.labelMedium,
                };
        }
    };

    const sizeStyles = getSizeStyles();
    const isOnFire = currentStreak >= 7;
    const fireColor = isOnFire ? colors.streak.fire : colors.categories.funFacts;

    const glowOpacity = glowAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.3, 0.6],
    });

    return (
        <View style={[styles.wrapper, style]}>
            <Animated.View
                style={[
                    styles.container,
                    sizeStyles.container,
                    { transform: [{ scale: scaleAnim }] },
                ]}
            >
                {/* Glow effect for active streaks */}
                {currentStreak > 0 && animated && (
                    <Animated.View
                        style={[
                            styles.glow,
                            {
                                backgroundColor: fireColor,
                                opacity: glowOpacity,
                            },
                        ]}
                    />
                )}

                <View style={styles.streakContent}>
                    <Icon
                        name="fire"
                        size={sizeStyles.iconSize}
                        color={currentStreak > 0 ? fireColor : colors.text.light}
                    />
                    <Text style={[sizeStyles.numberStyle, { color: currentStreak > 0 ? fireColor : colors.text.light }]}>
                        {currentStreak}
                    </Text>
                </View>
                <Text style={sizeStyles.labelStyle}>
                    {currentStreak === 1 ? 'day streak' : 'day streak'}
                </Text>

                {isOnFire && (
                    <View style={styles.fireBadge}>
                        <Text style={styles.fireBadgeText}>On Fire!</Text>
                    </View>
                )}
            </Animated.View>

            {showLongest && longestStreak !== undefined && longestStreak > 0 && (
                <View style={styles.longestContainer}>
                    <Icon name="trophy" size={14} color={colors.achievements.gold} />
                    <Text style={styles.longestText}>
                        Best: {longestStreak} days
                    </Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        alignItems: 'center',
    },
    container: {
        backgroundColor: colors.background.card,
        borderRadius: borderRadius.lg,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        ...shadows.md,
    },
    containerSmall: {
        padding: spacing.sm,
        minWidth: 70,
    },
    containerMedium: {
        padding: spacing.md,
        minWidth: 100,
    },
    containerLarge: {
        padding: spacing.lg,
        minWidth: 140,
    },
    glow: {
        position: 'absolute',
        top: -20,
        left: -20,
        right: -20,
        bottom: -20,
        borderRadius: borderRadius.xl,
    },
    streakContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
    },
    numberSmall: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    numberMedium: {
        fontSize: 32,
        fontWeight: 'bold',
    },
    numberLarge: {
        fontSize: 48,
        fontWeight: 'bold',
    },
    labelSmall: {
        fontSize: 10,
        color: colors.text.secondary,
        marginTop: 2,
    },
    labelMedium: {
        fontSize: 12,
        color: colors.text.secondary,
        marginTop: spacing.xs,
    },
    labelLarge: {
        fontSize: 14,
        color: colors.text.secondary,
        marginTop: spacing.sm,
    },
    fireBadge: {
        position: 'absolute',
        top: -8,
        right: -8,
        backgroundColor: colors.streak.fire,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs - 2,
        borderRadius: borderRadius.round,
        transform: [{ rotate: '12deg' }],
    },
    fireBadgeText: {
        color: colors.text.inverse,
        fontSize: 9,
        fontWeight: 'bold',
    },
    longestContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: spacing.sm,
        gap: spacing.xs,
    },
    longestText: {
        fontSize: 12,
        color: colors.text.secondary,
    },
});

export default StreakDisplay;

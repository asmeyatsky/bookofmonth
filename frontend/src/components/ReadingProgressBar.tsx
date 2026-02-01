import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { colors, spacing, borderRadius } from '../theme';

interface ReadingProgressBarProps {
    progress: number; // 0-100
    total?: number;
    completed?: number;
    label?: string;
    showPercentage?: boolean;
    showCount?: boolean;
    height?: number;
    animated?: boolean;
    color?: string;
    style?: object;
}

const ReadingProgressBar: React.FC<ReadingProgressBarProps> = ({
    progress,
    total,
    completed,
    label,
    showPercentage = true,
    showCount = false,
    height = 12,
    animated = true,
    color,
    style,
}) => {
    const animatedWidth = useRef(new Animated.Value(0)).current;
    const clampedProgress = Math.min(100, Math.max(0, progress));

    useEffect(() => {
        if (animated) {
            Animated.timing(animatedWidth, {
                toValue: clampedProgress,
                duration: 800,
                useNativeDriver: false,
            }).start();
        } else {
            animatedWidth.setValue(clampedProgress);
        }
    }, [clampedProgress, animated]);

    const getProgressColor = () => {
        if (color) return color;
        if (clampedProgress >= 100) return colors.status.success;
        if (clampedProgress >= 75) return colors.secondary;
        if (clampedProgress >= 50) return colors.categories.funFacts;
        if (clampedProgress >= 25) return colors.primary;
        return colors.categories.technology;
    };

    const progressColor = getProgressColor();

    const widthInterpolation = animatedWidth.interpolate({
        inputRange: [0, 100],
        outputRange: ['0%', '100%'],
    });

    return (
        <View style={[styles.container, style]}>
            {(label || showCount) && (
                <View style={styles.header}>
                    {label && <Text style={styles.label}>{label}</Text>}
                    {showCount && total !== undefined && completed !== undefined && (
                        <Text style={styles.count}>
                            {completed}/{total}
                        </Text>
                    )}
                </View>
            )}
            <View style={[styles.progressTrack, { height }]}>
                <Animated.View
                    style={[
                        styles.progressFill,
                        {
                            width: widthInterpolation,
                            backgroundColor: progressColor,
                            height,
                        },
                    ]}
                />
                {clampedProgress >= 100 && (
                    <View style={styles.completeIcon}>
                        <Icon name="check" size={height - 4} color={colors.text.inverse} />
                    </View>
                )}
            </View>
            {showPercentage && (
                <View style={styles.percentageContainer}>
                    <Text style={[styles.percentage, { color: progressColor }]}>
                        {Math.round(clampedProgress)}%
                    </Text>
                    {clampedProgress >= 100 && (
                        <Text style={styles.completeText}>Complete!</Text>
                    )}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.xs,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.text.primary,
    },
    count: {
        fontSize: 12,
        color: colors.text.secondary,
    },
    progressTrack: {
        backgroundColor: colors.background.secondary,
        borderRadius: borderRadius.round,
        overflow: 'hidden',
        position: 'relative',
    },
    progressFill: {
        borderRadius: borderRadius.round,
        position: 'absolute',
        left: 0,
        top: 0,
    },
    completeIcon: {
        position: 'absolute',
        right: 4,
        top: 0,
        bottom: 0,
        justifyContent: 'center',
    },
    percentageContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: spacing.xs,
        gap: spacing.sm,
    },
    percentage: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    completeText: {
        fontSize: 12,
        color: colors.status.success,
        fontWeight: '600',
    },
});

export default ReadingProgressBar;

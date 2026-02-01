import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { colors, spacing, borderRadius, getCategoryColor, getCategoryIcon } from '../theme';

interface CategoryBadgeProps {
    category: string;
    size?: 'small' | 'medium' | 'large';
    showLabel?: boolean;
    style?: object;
}

const CategoryBadge: React.FC<CategoryBadgeProps> = ({
    category,
    size = 'medium',
    showLabel = true,
    style,
}) => {
    const categoryColor = getCategoryColor(category);
    const iconName = getCategoryIcon(category);

    // Format category name for display
    const formatCategoryName = (cat: string): string => {
        // Convert camelCase to spaces and capitalize
        return cat
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .trim();
    };

    const getSizeStyles = () => {
        switch (size) {
            case 'small':
                return {
                    container: styles.containerSmall,
                    icon: 12,
                    text: styles.textSmall,
                };
            case 'large':
                return {
                    container: styles.containerLarge,
                    icon: 20,
                    text: styles.textLarge,
                };
            default:
                return {
                    container: styles.containerMedium,
                    icon: 14,
                    text: styles.textMedium,
                };
        }
    };

    const sizeStyles = getSizeStyles();

    return (
        <View
            style={[
                styles.container,
                sizeStyles.container,
                { backgroundColor: categoryColor },
                style,
            ]}
        >
            <Icon name={iconName} size={sizeStyles.icon} color={colors.text.inverse} />
            {showLabel && (
                <Text style={[styles.text, sizeStyles.text]}>
                    {formatCategoryName(category)}
                </Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: borderRadius.round,
    },
    containerSmall: {
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs - 2,
        gap: 4,
    },
    containerMedium: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        gap: 6,
    },
    containerLarge: {
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        gap: 8,
    },
    text: {
        color: colors.text.inverse,
        fontWeight: '600',
    },
    textSmall: {
        fontSize: 10,
    },
    textMedium: {
        fontSize: 12,
    },
    textLarge: {
        fontSize: 14,
    },
});

export default CategoryBadge;

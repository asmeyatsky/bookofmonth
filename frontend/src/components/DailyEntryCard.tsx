import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TouchableWithoutFeedback,
    Image,
    Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import TappableText from './TappableText';
import CategoryBadge from './CategoryBadge';
import { colors, spacing, borderRadius, shadows, getTypographyForLevel, getReadingLevelDisplay, getReadingLevelColor } from '../theme';

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

interface DailyEntryCardProps {
    event: NewsEvent;
    isBookmarked: boolean;
    isRead: boolean;
    onToggleBookmark: (id: string) => void;
    onMarkAsRead: (id: string, completed: boolean) => void;
    onReadAloud: (content: string) => void;
    onImagePress: (imageUrl: string) => void;
    readingLevel?: string;
    style?: object;
}

const DailyEntryCard: React.FC<DailyEntryCardProps> = ({
    event,
    isBookmarked,
    isRead,
    onToggleBookmark,
    onMarkAsRead,
    onReadAloud,
    onImagePress,
    readingLevel,
    style,
}) => {
    const [showFacts, setShowFacts] = useState(false);
    const [showQuestions, setShowQuestions] = useState(false);
    const typography = getTypographyForLevel(readingLevel);

    const extractedFacts = event.extracted_facts || [];
    const discussionQuestions = event.discussion_questions || [];

    return (
        <View style={[styles.container, style]}>
            {/* Header with title and actions */}
            <View style={styles.header}>
                <View style={styles.titleContainer}>
                    {event.category && (
                        <CategoryBadge category={event.category} size="small" style={styles.categoryBadge} />
                    )}
                    <Text style={[styles.title, { fontSize: typography.subtitle }]}>{event.title}</Text>
                </View>
                <View style={styles.actions}>
                    <TouchableWithoutFeedback onPress={() => onToggleBookmark(event.id)}>
                        <View style={styles.actionButton}>
                            <Icon
                                name={isBookmarked ? 'bookmark' : 'bookmark-o'}
                                size={22}
                                color={isBookmarked ? colors.accent : colors.text.light}
                            />
                        </View>
                    </TouchableWithoutFeedback>
                    <TouchableWithoutFeedback onPress={() => onMarkAsRead(event.id, !isRead)}>
                        <View style={styles.actionButton}>
                            <Icon
                                name={isRead ? 'check-circle' : 'circle-o'}
                                size={22}
                                color={isRead ? colors.status.success : colors.text.light}
                            />
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </View>

            {/* Reading level indicator */}
            {event.age_appropriateness && (
                <View style={styles.readingLevelContainer}>
                    <View style={[styles.readingLevelBadge, { backgroundColor: getReadingLevelColor(event.age_appropriateness) }]}>
                        <Icon name="book" size={10} color={colors.text.inverse} />
                        <Text style={styles.readingLevelText}>
                            {getReadingLevelDisplay(event.age_appropriateness)}
                        </Text>
                    </View>
                </View>
            )}

            {/* Image */}
            {event.image_url && (
                <TouchableWithoutFeedback onPress={() => onImagePress(event.image_url!)}>
                    <View style={styles.imageContainer}>
                        <Image source={{ uri: event.image_url }} style={styles.image} />
                        <View style={styles.imageOverlay}>
                            <Icon name="search-plus" size={20} color={colors.text.inverse} />
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            )}

            {/* Main content */}
            <View style={styles.contentContainer}>
                <TappableText content={event.raw_content} />
            </View>

            {/* Did You Know? Section */}
            {extractedFacts.length > 0 && (
                <View style={styles.expandableSection}>
                    <TouchableOpacity
                        style={styles.expandableHeader}
                        onPress={() => setShowFacts(!showFacts)}
                    >
                        <View style={styles.expandableHeaderContent}>
                            <Icon name="lightbulb-o" size={18} color={colors.categories.funFacts} />
                            <Text style={styles.expandableTitle}>Did You Know?</Text>
                        </View>
                        <Icon
                            name={showFacts ? 'chevron-up' : 'chevron-down'}
                            size={14}
                            color={colors.text.secondary}
                        />
                    </TouchableOpacity>
                    {showFacts && (
                        <View style={styles.expandableContent}>
                            {extractedFacts.map((fact, index) => (
                                <View key={index} style={styles.factItem}>
                                    <Icon name="star" size={12} color={colors.accent} style={styles.factIcon} />
                                    <Text style={[styles.factText, { fontSize: typography.body }]}>{fact}</Text>
                                </View>
                            ))}
                        </View>
                    )}
                </View>
            )}

            {/* Discussion Questions Section */}
            {discussionQuestions.length > 0 && (
                <View style={styles.expandableSection}>
                    <TouchableOpacity
                        style={styles.expandableHeader}
                        onPress={() => setShowQuestions(!showQuestions)}
                    >
                        <View style={styles.expandableHeaderContent}>
                            <Icon name="comments-o" size={18} color={colors.categories.arts} />
                            <Text style={styles.expandableTitle}>Talk About It</Text>
                        </View>
                        <Icon
                            name={showQuestions ? 'chevron-up' : 'chevron-down'}
                            size={14}
                            color={colors.text.secondary}
                        />
                    </TouchableOpacity>
                    {showQuestions && (
                        <View style={styles.expandableContent}>
                            {discussionQuestions.map((question, index) => (
                                <View key={index} style={styles.questionItem}>
                                    <View style={styles.questionNumber}>
                                        <Text style={styles.questionNumberText}>{index + 1}</Text>
                                    </View>
                                    <Text style={[styles.questionText, { fontSize: typography.body }]}>{question}</Text>
                                </View>
                            ))}
                        </View>
                    )}
                </View>
            )}

            {/* Read Aloud Button */}
            <TouchableOpacity
                style={styles.readAloudButton}
                onPress={() => onReadAloud(event.raw_content)}
            >
                <Icon name="volume-up" size={18} color={colors.text.inverse} />
                <Text style={styles.readAloudText}>Read Aloud</Text>
            </TouchableOpacity>

            {/* Read status indicator */}
            {isRead && (
                <View style={styles.readBadge}>
                    <Icon name="check" size={10} color={colors.text.inverse} />
                    <Text style={styles.readBadgeText}>Read</Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: colors.background.card,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.md,
        ...shadows.md,
        position: 'relative',
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: spacing.sm,
    },
    titleContainer: {
        flex: 1,
        marginRight: spacing.md,
    },
    categoryBadge: {
        alignSelf: 'flex-start',
        marginBottom: spacing.xs,
    },
    title: {
        fontWeight: 'bold',
        color: colors.text.primary,
        lineHeight: 26,
    },
    actions: {
        flexDirection: 'row',
        gap: spacing.xs,
    },
    actionButton: {
        padding: spacing.xs,
    },
    readingLevelContainer: {
        marginBottom: spacing.sm,
    },
    readingLevelBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs - 2,
        borderRadius: borderRadius.round,
        gap: 4,
    },
    readingLevelText: {
        color: colors.text.inverse,
        fontSize: 10,
        fontWeight: '600',
    },
    imageContainer: {
        position: 'relative',
        borderRadius: borderRadius.md,
        overflow: 'hidden',
        marginBottom: spacing.md,
    },
    image: {
        width: '100%',
        height: 200,
        resizeMode: 'cover',
    },
    imageOverlay: {
        position: 'absolute',
        bottom: spacing.sm,
        right: spacing.sm,
        backgroundColor: colors.background.overlay,
        borderRadius: borderRadius.round,
        padding: spacing.sm,
    },
    contentContainer: {
        marginBottom: spacing.md,
    },
    expandableSection: {
        borderTopWidth: 1,
        borderTopColor: colors.background.secondary,
        paddingTop: spacing.sm,
        marginTop: spacing.sm,
    },
    expandableHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.xs,
    },
    expandableHeaderContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    expandableTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.text.primary,
    },
    expandableContent: {
        paddingTop: spacing.sm,
        paddingLeft: spacing.sm,
    },
    factItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: spacing.sm,
    },
    factIcon: {
        marginTop: 4,
        marginRight: spacing.sm,
    },
    factText: {
        flex: 1,
        color: colors.text.secondary,
        lineHeight: 22,
    },
    questionItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: spacing.md,
    },
    questionNumber: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: colors.categories.arts,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.sm,
    },
    questionNumberText: {
        color: colors.text.inverse,
        fontSize: 12,
        fontWeight: 'bold',
    },
    questionText: {
        flex: 1,
        color: colors.text.primary,
        lineHeight: 22,
    },
    readAloudButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.secondary,
        borderRadius: borderRadius.md,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.lg,
        marginTop: spacing.md,
        gap: spacing.sm,
    },
    readAloudText: {
        color: colors.text.inverse,
        fontWeight: '600',
        fontSize: 14,
    },
    readBadge: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: colors.status.success,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderBottomLeftRadius: borderRadius.md,
        gap: 4,
    },
    readBadgeText: {
        color: colors.text.inverse,
        fontSize: 10,
        fontWeight: '600',
    },
});

export default DailyEntryCard;

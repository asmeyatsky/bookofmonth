import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Image, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { apiService } from '../services/ApiService';
import { useAuth } from '../context/AuthContext';
import ReadingProgressBar from '../components/ReadingProgressBar';
import { colors, spacing, borderRadius, shadows, getReadingLevelDisplay, getReadingLevelColor } from '../theme';

interface MonthlyBook {
    id: string;
    title: string;
    month: number;
    year: number;
    cover_image_url?: string;
    reading_level?: string;
    entry_count?: number;
    quiz?: any;
}

const MonthlyBookListScreen = () => {
    const [monthlyBooks, setMonthlyBooks] = useState<MonthlyBook[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const navigation = useNavigation();
    const { activeChildProfile } = useAuth();

    useEffect(() => {
        loadBooks();
    }, [activeChildProfile?.id]);

    const loadBooks = async () => {
        try {
            const filters = activeChildProfile?.reading_level
                ? { readingLevel: activeChildProfile.reading_level }
                : undefined;
            const data = await apiService.getMonthlyBooks(filters);
            setMonthlyBooks(data.results || data || []);
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Failed to fetch monthly books.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadBooks();
    };

    const handleOpenBook = (bookId: string) => {
        navigation.navigate('MonthlyBook' as never, { bookId } as never);
    };

    const handleTakeQuiz = (bookId: string, quizId?: string) => {
        if (quizId) {
            navigation.navigate('Quiz' as never, { quizId, bookId } as never);
        } else {
            navigation.navigate('Quiz' as never, { bookId } as never);
        }
    };

    const getMonthName = (month: number): string => {
        const months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        return months[month - 1] || '';
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Loading your books...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header info */}
            {activeChildProfile && (
                <View style={styles.filterInfo}>
                    <Icon name="filter" size={14} color={colors.text.secondary} />
                    <Text style={styles.filterText}>
                        Showing books for {getReadingLevelDisplay(activeChildProfile.reading_level)}
                    </Text>
                </View>
            )}

            {monthlyBooks.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Icon name="book" size={60} color={colors.text.light} />
                    <Text style={styles.emptyTitle}>No Books Yet</Text>
                    <Text style={styles.emptyText}>
                        {activeChildProfile
                            ? `No books available for ${activeChildProfile.name}'s reading level yet.`
                            : 'Check back soon for monthly books!'}
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={monthlyBooks}
                    keyExtractor={item => item.id.toString()}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.bookCard}
                            onPress={() => handleOpenBook(item.id)}
                            activeOpacity={0.8}
                        >
                            {/* Cover Image */}
                            <View style={styles.coverContainer}>
                                {item.cover_image_url ? (
                                    <Image source={{ uri: item.cover_image_url }} style={styles.coverImage} />
                                ) : (
                                    <View style={[styles.coverImage, styles.coverPlaceholder]}>
                                        <Icon name="book" size={40} color={colors.primary} />
                                    </View>
                                )}
                            </View>

                            {/* Book Details */}
                            <View style={styles.bookDetails}>
                                <Text style={styles.bookTitle}>{item.title}</Text>
                                <Text style={styles.bookDate}>
                                    {getMonthName(item.month)} {item.year}
                                </Text>

                                {/* Reading Level Badge */}
                                {item.reading_level && (
                                    <View style={[
                                        styles.levelBadge,
                                        { backgroundColor: getReadingLevelColor(item.reading_level) }
                                    ]}>
                                        <Text style={styles.levelBadgeText}>
                                            {getReadingLevelDisplay(item.reading_level)}
                                        </Text>
                                    </View>
                                )}

                                {/* Entry Count */}
                                {item.entry_count && (
                                    <Text style={styles.entryCount}>
                                        <Icon name="file-text-o" size={12} color={colors.text.light} /> {item.entry_count} stories
                                    </Text>
                                )}

                                {/* Action Buttons */}
                                <View style={styles.actionButtons}>
                                    <TouchableOpacity
                                        style={styles.readButton}
                                        onPress={() => handleOpenBook(item.id)}
                                    >
                                        <Icon name="book" size={14} color={colors.text.inverse} />
                                        <Text style={styles.readButtonText}>Read</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={styles.quizButton}
                                        onPress={() => handleTakeQuiz(item.id, item.quiz?.id)}
                                    >
                                        <Icon name="question-circle" size={14} color={colors.secondary} />
                                        <Text style={styles.quizButtonText}>Quiz</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Chevron indicator */}
                            <View style={styles.chevronContainer}>
                                <Icon name="chevron-right" size={16} color={colors.text.light} />
                            </View>
                        </TouchableOpacity>
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
    filterInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.sm,
        backgroundColor: colors.background.card,
        gap: spacing.xs,
    },
    filterText: {
        fontSize: 12,
        color: colors.text.secondary,
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
    bookCard: {
        flexDirection: 'row',
        backgroundColor: colors.background.card,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.md,
        ...shadows.md,
    },
    coverContainer: {
        marginRight: spacing.md,
    },
    coverImage: {
        width: 90,
        height: 120,
        borderRadius: borderRadius.md,
        resizeMode: 'cover',
    },
    coverPlaceholder: {
        backgroundColor: colors.background.secondary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    bookDetails: {
        flex: 1,
        justifyContent: 'center',
    },
    bookTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.text.primary,
        marginBottom: spacing.xs,
    },
    bookDate: {
        fontSize: 14,
        color: colors.text.secondary,
        marginBottom: spacing.sm,
    },
    levelBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs - 2,
        borderRadius: borderRadius.round,
        marginBottom: spacing.sm,
    },
    levelBadgeText: {
        color: colors.text.inverse,
        fontSize: 10,
        fontWeight: '600',
    },
    entryCount: {
        fontSize: 12,
        color: colors.text.light,
        marginBottom: spacing.sm,
    },
    actionButtons: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    readButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.md,
        gap: spacing.xs,
    },
    readButtonText: {
        color: colors.text.inverse,
        fontSize: 12,
        fontWeight: '600',
    },
    quizButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background.secondary,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: colors.secondary,
        gap: spacing.xs,
    },
    quizButtonText: {
        color: colors.secondary,
        fontSize: 12,
        fontWeight: '600',
    },
    chevronContainer: {
        justifyContent: 'center',
        paddingLeft: spacing.sm,
    },
});

export default MonthlyBookListScreen;

import React, { useEffect, useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    ScrollView,
    TouchableOpacity,
    Modal,
    FlatList,
    Dimensions,
    Image,
    Animated,
    Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { apiService } from '../services/ApiService';
import { ttsService } from '../services/TtsService';
import { useAuth } from '../context/AuthContext';
import ImageGallery from '../components/ImageGallery';
import TappableText from '../components/TappableText';
import CategoryBadge from '../components/CategoryBadge';
import ReadingProgressBar from '../components/ReadingProgressBar';
import { colors, spacing, borderRadius, shadows, getTypographyForLevel, getReadingLevelDisplay } from '../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface DailyEntry {
    id: string;
    date: string;
    title: string;
    content_elements?: { type: string, payload: any }[];
    image_url?: string;
    category?: string;
    extracted_facts?: string[];
    discussion_questions?: string[];
}

interface MonthlyBook {
    id: string;
    title: string;
    month: number;
    year: number;
    cover_image_url?: string;
    reading_level?: string;
    daily_entries?: DailyEntry[];
    quiz?: any;
    parents_guide?: string;
}

const MonthlyBookScreen = () => {
    const [book, setBook] = useState<MonthlyBook | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(0); // 0 = cover, 1 = TOC, 2+ = entries
    const [showTOC, setShowTOC] = useState(false);
    const [showParentsGuide, setShowParentsGuide] = useState(false);
    const [readEntries, setReadEntries] = useState<Set<string>>(new Set());

    const navigation = useNavigation();
    const route = useRoute();
    const { activeChildProfile } = useAuth();
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;

    const bookId = (route.params as any)?.bookId;
    const typography = getTypographyForLevel(activeChildProfile?.reading_level);

    useEffect(() => {
        if (bookId) {
            loadBook();
        }
    }, [bookId]);

    useEffect(() => {
        // Animate page transitions
        fadeAnim.setValue(0);
        slideAnim.setValue(30);
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start();
    }, [currentPage]);

    const loadBook = async () => {
        try {
            const data = await apiService.getMonthlyBook(bookId);
            setBook(data);
        } catch (error: any) {
            if (__DEV__) console.error('Error loading book:', error);
            Alert.alert('Error', error.message || 'Failed to load book');
        } finally {
            setLoading(false);
        }
    };

    const handleNextPage = () => {
        if (!book) return;
        const totalPages = (book.daily_entries?.length || 0) + 2; // cover + TOC + entries
        if (currentPage < totalPages - 1) {
            setCurrentPage(currentPage + 1);
        }
    };

    const handlePrevPage = () => {
        if (currentPage > 0) {
            setCurrentPage(currentPage - 1);
        }
    };

    const handleGoToPage = (pageIndex: number) => {
        setCurrentPage(pageIndex);
        setShowTOC(false);
    };

    const markEntryAsRead = (entryId: string) => {
        setReadEntries(prev => new Set(prev).add(entryId));
    };

    const handleTakeQuiz = () => {
        if (book?.quiz) {
            navigation.navigate('Quiz' as never, { quizId: book.quiz.id, bookId: book.id } as never);
        } else {
            Alert.alert('Quiz Not Available', 'The quiz for this book is not available yet.');
        }
    };

    const getMonthName = (month: number): string => {
        const months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        return months[month - 1] || '';
    };

    const calculateProgress = (): number => {
        if (!book?.daily_entries) return 0;
        return (readEntries.size / book.daily_entries.length) * 100;
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Opening your book...</Text>
            </View>
        );
    }

    if (!book) {
        return (
            <View style={styles.errorContainer}>
                <Icon name="book" size={60} color={colors.text.light} />
                <Text style={styles.errorText}>Book not found</Text>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Text style={styles.backButtonText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const entries = book.daily_entries || [];
    const totalPages = entries.length + 2; // cover + TOC + entries

    // Render Cover Page
    const renderCoverPage = () => (
        <Animated.View
            style={[
                styles.pageContainer,
                styles.coverPage,
                {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }],
                },
            ]}
        >
            {book.cover_image_url ? (
                <Image source={{ uri: book.cover_image_url }} style={styles.coverImage} />
            ) : (
                <View style={[styles.coverImage, styles.coverPlaceholder]}>
                    <Icon name="book" size={80} color={colors.primary} />
                </View>
            )}
            <Text style={[styles.coverTitle, { fontSize: typography.title + 4 }]}>{book.title}</Text>
            <Text style={styles.coverSubtitle}>
                {getMonthName(book.month)} {book.year}
            </Text>
            {book.reading_level && (
                <View style={[styles.levelBadge, { backgroundColor: colors.readingLevels[book.reading_level as keyof typeof colors.readingLevels] || colors.secondary }]}>
                    <Text style={styles.levelBadgeText}>{getReadingLevelDisplay(book.reading_level)}</Text>
                </View>
            )}
            <TouchableOpacity style={styles.startButton} onPress={handleNextPage}>
                <Text style={styles.startButtonText}>Start Reading</Text>
                <Icon name="arrow-right" size={16} color={colors.text.inverse} />
            </TouchableOpacity>
        </Animated.View>
    );

    // Render Table of Contents
    const renderTOCPage = () => (
        <Animated.ScrollView
            style={[styles.pageContainer, { opacity: fadeAnim }]}
            contentContainerStyle={styles.tocContainer}
        >
            <Text style={[styles.tocTitle, { fontSize: typography.title }]}>Table of Contents</Text>
            <ReadingProgressBar
                progress={calculateProgress()}
                total={entries.length}
                completed={readEntries.size}
                label="Your Progress"
                showCount
                style={styles.progressBar}
            />
            {entries.map((entry, index) => (
                <TouchableOpacity
                    key={entry.id}
                    style={styles.tocItem}
                    onPress={() => handleGoToPage(index + 2)}
                >
                    <View style={styles.tocItemLeft}>
                        <Text style={styles.tocDate}>{entry.date}</Text>
                        <Text style={[styles.tocEntryTitle, { fontSize: typography.body }]}>{entry.title}</Text>
                        {entry.category && (
                            <CategoryBadge category={entry.category} size="small" showLabel={false} />
                        )}
                    </View>
                    <View style={styles.tocItemRight}>
                        {readEntries.has(entry.id) && (
                            <Icon name="check-circle" size={18} color={colors.status.success} />
                        )}
                        <Icon name="chevron-right" size={14} color={colors.text.light} />
                    </View>
                </TouchableOpacity>
            ))}

            {/* Quiz and Parent's Guide buttons */}
            <View style={styles.tocActions}>
                {book.quiz && (
                    <TouchableOpacity style={styles.quizButton} onPress={handleTakeQuiz}>
                        <Icon name="question-circle" size={20} color={colors.text.inverse} />
                        <Text style={styles.quizButtonText}>Take the Quiz</Text>
                    </TouchableOpacity>
                )}
                {book.parents_guide && (
                    <TouchableOpacity
                        style={styles.parentsGuideButton}
                        onPress={() => setShowParentsGuide(true)}
                    >
                        <Icon name="users" size={18} color={colors.secondary} />
                        <Text style={styles.parentsGuideButtonText}>Parent's Guide</Text>
                    </TouchableOpacity>
                )}
            </View>
        </Animated.ScrollView>
    );

    // Render Entry Page
    const renderContentElement = (element: { type: string, payload: any }, index: number) => {
        switch (element.type) {
            case 'paragraph':
                return <TappableText key={index} content={element.payload.text} />;
            case 'image_gallery':
                return <ImageGallery key={index} images={element.payload.images} />;
            default:
                return null;
        }
    };

    const renderEntryPage = (entry: DailyEntry, index: number) => (
        <Animated.ScrollView
            style={[styles.pageContainer, { opacity: fadeAnim }]}
            contentContainerStyle={styles.entryContainer}
        >
            <View style={styles.entryHeader}>
                <Text style={styles.entryDate}>{entry.date}</Text>
                {entry.category && <CategoryBadge category={entry.category} size="medium" />}
            </View>

            <Text style={[styles.entryTitle, { fontSize: typography.title }]}>{entry.title}</Text>

            {entry.content_elements?.map(renderContentElement)}

            {/* Did You Know? */}
            {entry.extracted_facts && entry.extracted_facts.length > 0 && (
                <View style={styles.factsSection}>
                    <View style={styles.sectionHeader}>
                        <Icon name="lightbulb-o" size={20} color={colors.categories.funFacts} />
                        <Text style={styles.sectionTitle}>Did You Know?</Text>
                    </View>
                    {entry.extracted_facts.map((fact, i) => (
                        <View key={i} style={styles.factItem}>
                            <Icon name="star" size={12} color={colors.accent} />
                            <Text style={[styles.factText, { fontSize: typography.body }]}>{fact}</Text>
                        </View>
                    ))}
                </View>
            )}

            {/* Discussion Questions */}
            {entry.discussion_questions && entry.discussion_questions.length > 0 && (
                <View style={styles.questionsSection}>
                    <View style={styles.sectionHeader}>
                        <Icon name="comments-o" size={20} color={colors.categories.arts} />
                        <Text style={styles.sectionTitle}>Talk About It</Text>
                    </View>
                    {entry.discussion_questions.map((q, i) => (
                        <View key={i} style={styles.questionItem}>
                            <View style={styles.questionNumber}>
                                <Text style={styles.questionNumberText}>{i + 1}</Text>
                            </View>
                            <Text style={[styles.questionText, { fontSize: typography.body }]}>{q}</Text>
                        </View>
                    ))}
                </View>
            )}

            {/* Read Aloud Button */}
            <TouchableOpacity
                style={styles.readAloudButton}
                onPress={() => {
                    const textToSpeak = entry.content_elements
                        ?.filter(e => e.type === 'paragraph')
                        .map(e => e.payload.text)
                        .join(' ');
                    if (textToSpeak) {
                        ttsService.speak(textToSpeak);
                    }
                }}
            >
                <Icon name="volume-up" size={18} color={colors.text.inverse} />
                <Text style={styles.readAloudText}>Read Aloud</Text>
            </TouchableOpacity>

            {/* Mark as Read */}
            <TouchableOpacity
                style={[
                    styles.markReadButton,
                    readEntries.has(entry.id) && styles.markReadButtonDone,
                ]}
                onPress={() => markEntryAsRead(entry.id)}
            >
                <Icon
                    name={readEntries.has(entry.id) ? 'check-circle' : 'circle-o'}
                    size={20}
                    color={readEntries.has(entry.id) ? colors.status.success : colors.text.secondary}
                />
                <Text style={[
                    styles.markReadText,
                    readEntries.has(entry.id) && styles.markReadTextDone,
                ]}>
                    {readEntries.has(entry.id) ? 'Completed!' : 'Mark as Read'}
                </Text>
            </TouchableOpacity>
        </Animated.ScrollView>
    );

    // Determine current page content
    const renderCurrentPage = () => {
        if (currentPage === 0) {
            return renderCoverPage();
        } else if (currentPage === 1) {
            return renderTOCPage();
        } else {
            const entryIndex = currentPage - 2;
            if (entryIndex < entries.length) {
                return renderEntryPage(entries[entryIndex], entryIndex);
            }
        }
        return null;
    };

    return (
        <View style={styles.container}>
            {/* Main content */}
            {renderCurrentPage()}

            {/* Navigation controls */}
            {currentPage > 0 && (
                <View style={styles.navigationBar}>
                    <TouchableOpacity
                        style={[styles.navButton, currentPage === 0 && styles.navButtonDisabled]}
                        onPress={handlePrevPage}
                        disabled={currentPage === 0}
                    >
                        <Icon name="chevron-left" size={20} color={currentPage === 0 ? colors.text.light : colors.primary} />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.tocButton} onPress={() => setShowTOC(true)}>
                        <Icon name="list" size={16} color={colors.text.secondary} />
                        <Text style={styles.pageIndicator}>
                            {currentPage === 1 ? 'Contents' : `${currentPage - 1} of ${entries.length}`}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.navButton, currentPage >= totalPages - 1 && styles.navButtonDisabled]}
                        onPress={handleNextPage}
                        disabled={currentPage >= totalPages - 1}
                    >
                        <Icon name="chevron-right" size={20} color={currentPage >= totalPages - 1 ? colors.text.light : colors.primary} />
                    </TouchableOpacity>
                </View>
            )}

            {/* TOC Modal */}
            <Modal visible={showTOC} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.tocModal}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Jump to...</Text>
                            <TouchableOpacity onPress={() => setShowTOC(false)}>
                                <Icon name="times" size={24} color={colors.text.secondary} />
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity style={styles.tocModalItem} onPress={() => handleGoToPage(0)}>
                            <Icon name="book" size={18} color={colors.primary} />
                            <Text style={styles.tocModalItemText}>Cover</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.tocModalItem} onPress={() => handleGoToPage(1)}>
                            <Icon name="list" size={18} color={colors.secondary} />
                            <Text style={styles.tocModalItemText}>Table of Contents</Text>
                        </TouchableOpacity>
                        <FlatList
                            data={entries}
                            keyExtractor={item => item.id}
                            renderItem={({ item, index }) => (
                                <TouchableOpacity
                                    style={styles.tocModalItem}
                                    onPress={() => handleGoToPage(index + 2)}
                                >
                                    <Text style={styles.tocModalDate}>{item.date}</Text>
                                    <Text style={styles.tocModalItemText} numberOfLines={1}>{item.title}</Text>
                                    {readEntries.has(item.id) && (
                                        <Icon name="check" size={14} color={colors.status.success} />
                                    )}
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </View>
            </Modal>

            {/* Parent's Guide Modal */}
            <Modal visible={showParentsGuide} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.parentsGuideModal}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Parent's Guide</Text>
                            <TouchableOpacity onPress={() => setShowParentsGuide(false)}>
                                <Icon name="times" size={24} color={colors.text.secondary} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.parentsGuideContent}>
                            <Text style={styles.parentsGuideText}>{book.parents_guide}</Text>
                        </ScrollView>
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
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background.primary,
        padding: spacing.xl,
    },
    errorText: {
        fontSize: 18,
        color: colors.text.secondary,
        marginTop: spacing.md,
    },
    backButton: {
        marginTop: spacing.lg,
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.md,
    },
    backButtonText: {
        color: colors.text.inverse,
        fontWeight: '600',
    },
    pageContainer: {
        flex: 1,
    },

    // Cover Page
    coverPage: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
    coverImage: {
        width: SCREEN_WIDTH * 0.6,
        height: SCREEN_WIDTH * 0.8,
        borderRadius: borderRadius.lg,
        marginBottom: spacing.lg,
        ...shadows.lg,
    },
    coverPlaceholder: {
        backgroundColor: colors.background.card,
        justifyContent: 'center',
        alignItems: 'center',
    },
    coverTitle: {
        fontWeight: 'bold',
        color: colors.text.primary,
        textAlign: 'center',
        marginBottom: spacing.sm,
    },
    coverSubtitle: {
        fontSize: 18,
        color: colors.text.secondary,
        marginBottom: spacing.md,
    },
    levelBadge: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.round,
        marginBottom: spacing.lg,
    },
    levelBadgeText: {
        color: colors.text.inverse,
        fontWeight: '600',
        fontSize: 12,
    },
    startButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.lg,
        gap: spacing.sm,
        ...shadows.md,
    },
    startButtonText: {
        color: colors.text.inverse,
        fontSize: 18,
        fontWeight: 'bold',
    },

    // TOC Page
    tocContainer: {
        padding: spacing.lg,
    },
    tocTitle: {
        fontWeight: 'bold',
        color: colors.text.primary,
        marginBottom: spacing.lg,
        textAlign: 'center',
    },
    progressBar: {
        marginBottom: spacing.lg,
    },
    tocItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: colors.background.card,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        marginBottom: spacing.sm,
        ...shadows.sm,
    },
    tocItemLeft: {
        flex: 1,
        gap: spacing.xs,
    },
    tocDate: {
        fontSize: 12,
        color: colors.text.light,
    },
    tocEntryTitle: {
        fontWeight: '600',
        color: colors.text.primary,
    },
    tocItemRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    tocActions: {
        marginTop: spacing.lg,
        gap: spacing.md,
    },
    quizButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primary,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        gap: spacing.sm,
    },
    quizButtonText: {
        color: colors.text.inverse,
        fontWeight: '600',
        fontSize: 16,
    },
    parentsGuideButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.background.card,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: colors.secondary,
        gap: spacing.sm,
    },
    parentsGuideButtonText: {
        color: colors.secondary,
        fontWeight: '600',
        fontSize: 16,
    },

    // Entry Page
    entryContainer: {
        padding: spacing.lg,
        paddingBottom: spacing.xxl,
    },
    entryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    entryDate: {
        fontSize: 14,
        color: colors.text.light,
    },
    entryTitle: {
        fontWeight: 'bold',
        color: colors.text.primary,
        marginBottom: spacing.md,
    },
    entryImage: {
        width: '100%',
        height: 200,
        borderRadius: borderRadius.md,
        marginBottom: spacing.md,
    },
    entryContent: {
        marginBottom: spacing.lg,
    },
    factsSection: {
        backgroundColor: colors.background.card,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        marginBottom: spacing.md,
        ...shadows.sm,
    },
    questionsSection: {
        backgroundColor: colors.background.card,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        marginBottom: spacing.md,
        ...shadows.sm,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        marginBottom: spacing.md,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text.primary,
    },
    factItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing.sm,
        marginBottom: spacing.sm,
    },
    factText: {
        flex: 1,
        color: colors.text.secondary,
        lineHeight: 22,
    },
    questionItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing.sm,
        marginBottom: spacing.md,
    },
    questionNumber: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: colors.categories.arts,
        justifyContent: 'center',
        alignItems: 'center',
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
        padding: spacing.md,
        borderRadius: borderRadius.md,
        gap: spacing.sm,
        marginBottom: spacing.md,
    },
    readAloudText: {
        color: colors.text.inverse,
        fontWeight: '600',
    },
    markReadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.background.card,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: colors.text.light,
        gap: spacing.sm,
    },
    markReadButtonDone: {
        borderColor: colors.status.success,
        backgroundColor: colors.background.secondary,
    },
    markReadText: {
        color: colors.text.secondary,
        fontWeight: '600',
    },
    markReadTextDone: {
        color: colors.status.success,
    },

    // Navigation Bar
    navigationBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: colors.background.card,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.background.secondary,
        ...shadows.sm,
    },
    navButton: {
        padding: spacing.sm,
    },
    navButtonDisabled: {
        opacity: 0.5,
    },
    tocButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
    },
    pageIndicator: {
        fontSize: 14,
        color: colors.text.secondary,
    },

    // Modals
    modalOverlay: {
        flex: 1,
        backgroundColor: colors.background.overlay,
        justifyContent: 'flex-end',
    },
    tocModal: {
        backgroundColor: colors.background.card,
        borderTopLeftRadius: borderRadius.xl,
        borderTopRightRadius: borderRadius.xl,
        maxHeight: '70%',
        padding: spacing.lg,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.text.primary,
    },
    tocModalItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.background.secondary,
        gap: spacing.md,
    },
    tocModalDate: {
        fontSize: 12,
        color: colors.text.light,
        width: 60,
    },
    tocModalItemText: {
        flex: 1,
        fontSize: 14,
        color: colors.text.primary,
    },
    parentsGuideModal: {
        backgroundColor: colors.background.card,
        borderTopLeftRadius: borderRadius.xl,
        borderTopRightRadius: borderRadius.xl,
        maxHeight: '80%',
        padding: spacing.lg,
    },
    parentsGuideContent: {
        flex: 1,
    },
    parentsGuideText: {
        fontSize: 16,
        color: colors.text.primary,
        lineHeight: 24,
    },
});

export default MonthlyBookScreen;

import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    FlatList,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacity,
    Image,
    Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { apiService } from '../services/ApiService';
import { useAuth } from '../context/AuthContext';
import CategoryBadge from '../components/CategoryBadge';
import BottomNavBar from '../components/BottomNavBar';
import { colors, spacing, borderRadius, shadows, getReadingLevelDisplay, getReadingLevelColor } from '../theme';

const SearchScreen = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchType, setSearchType] = useState<'news_events' | 'monthly_books'>('news_events');
    const [hasSearched, setHasSearched] = useState(false);

    const navigation = useNavigation();
    const { activeChildProfile } = useAuth();

    const handleSearch = async () => {
        if (!searchTerm.trim()) {
            Alert.alert('Search', 'Please enter a search term.');
            return;
        }

        setLoading(true);
        setSearchResults([]);
        setHasSearched(true);

        try {
            if (searchType === 'news_events') {
                const data = await apiService.searchNewsEvents(
                    searchTerm,
                    activeChildProfile?.reading_level
                );
                setSearchResults(data.results || data || []);
            } else {
                const data = await apiService.searchMonthlyBooks(
                    searchTerm,
                    activeChildProfile?.reading_level
                );
                setSearchResults(data.results || data || []);
            }
        } catch (error) {
            if (__DEV__) console.error("Search error:", error);
            Alert.alert("Error", "Failed to perform search.");
        } finally {
            setLoading(false);
        }
    };

    const handleNewsEventPress = (item: any) => {
        navigation.navigate('Home' as never, { 
            selectedStoryId: item.id,
            scrollToStory: true 
        } as never);
    };

    const handleMonthlyBookPress = (item: any) => {
        navigation.navigate('MonthlyBook' as never, { bookId: item.id } as never);
    };

    const renderNewsEventItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => handleNewsEventPress(item)}
            activeOpacity={0.8}
        >
            {item.image_url && (
                <Image source={{ uri: item.image_url }} style={styles.cardImage} />
            )}
            <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                    {item.category && (
                        <CategoryBadge category={item.category} size="small" />
                    )}
                    {item.age_appropriateness && (
                        <View style={[
                            styles.levelBadge,
                            { backgroundColor: getReadingLevelColor(item.age_appropriateness) }
                        ]}>
                            <Text style={styles.levelBadgeText}>
                                {getReadingLevelDisplay(item.age_appropriateness)}
                            </Text>
                        </View>
                    )}
                </View>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardPreview} numberOfLines={2}>
                    {item.raw_content}
                </Text>
            </View>
        </TouchableOpacity>
    );

    const renderMonthlyBookItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.bookCard}
            onPress={() => handleMonthlyBookPress(item)}
            activeOpacity={0.8}
        >
            {item.cover_image_url ? (
                <Image source={{ uri: item.cover_image_url }} style={styles.bookCover} />
            ) : (
                <View style={[styles.bookCover, styles.bookCoverPlaceholder]}>
                    <Icon name="book" size={30} color={colors.primary} />
                </View>
            )}
            <View style={styles.bookDetails}>
                <Text style={styles.bookTitle}>{item.title}</Text>
                <Text style={styles.bookDate}>
                    {new Date(0, item.month - 1).toLocaleString('default', { month: 'long' })} {item.year}
                </Text>
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
            </View>
            <Icon name="chevron-right" size={16} color={colors.text.light} />
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <View style={styles.searchBar}>
                    <Icon name="search" size={18} color={colors.text.light} style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search stories and books..."
                        placeholderTextColor={colors.text.light}
                        value={searchTerm}
                        onChangeText={setSearchTerm}
                        onSubmitEditing={handleSearch}
                        returnKeyType="search"
                    />
                    {searchTerm.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchTerm('')}>
                            <Icon name="times-circle" size={18} color={colors.text.light} />
                        </TouchableOpacity>
                    )}
                </View>
                <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
                    <Text style={styles.searchButtonText}>Search</Text>
                </TouchableOpacity>
            </View>

            {/* Search Type Toggle */}
            <View style={styles.toggleContainer}>
                <TouchableOpacity
                    style={[
                        styles.toggleButton,
                        searchType === 'news_events' && styles.toggleButtonActive,
                    ]}
                    onPress={() => setSearchType('news_events')}
                >
                    <Icon
                        name="newspaper-o"
                        size={16}
                        color={searchType === 'news_events' ? colors.text.inverse : colors.text.secondary}
                    />
                    <Text style={[
                        styles.toggleButtonText,
                        searchType === 'news_events' && styles.toggleButtonTextActive,
                    ]}>
                        Stories
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        styles.toggleButton,
                        searchType === 'monthly_books' && styles.toggleButtonActive,
                    ]}
                    onPress={() => setSearchType('monthly_books')}
                >
                    <Icon
                        name="book"
                        size={16}
                        color={searchType === 'monthly_books' ? colors.text.inverse : colors.text.secondary}
                    />
                    <Text style={[
                        styles.toggleButtonText,
                        searchType === 'monthly_books' && styles.toggleButtonTextActive,
                    ]}>
                        Books
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Reading Level Filter Info */}
            {activeChildProfile && (
                <View style={styles.filterInfo}>
                    <Icon name="filter" size={12} color={colors.text.secondary} />
                    <Text style={styles.filterText}>
                        Filtered for {getReadingLevelDisplay(activeChildProfile.reading_level)}
                    </Text>
                </View>
            )}

            {/* Results */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={styles.loadingText}>Searching...</Text>
                </View>
            ) : hasSearched && searchResults.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Icon name="search" size={50} color={colors.text.light} />
                    <Text style={styles.emptyTitle}>No Results Found</Text>
                    <Text style={styles.emptyText}>
                        Try a different search term or change the content type.
                    </Text>
                </View>
            ) : !hasSearched ? (
                <View style={styles.emptyContainer}>
                    <Icon name="search" size={50} color={colors.text.light} />
                    <Text style={styles.emptyTitle}>Search for Content</Text>
                    <Text style={styles.emptyText}>
                        Find stories and books by title or keyword.
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={searchResults}
                    keyExtractor={item => item.id.toString()}
                    renderItem={searchType === 'news_events' ? renderNewsEventItem : renderMonthlyBookItem}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            )}
            <BottomNavBar />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background.primary,
    },
    searchContainer: {
        flexDirection: 'row',
        padding: spacing.md,
        backgroundColor: colors.background.card,
        gap: spacing.sm,
    },
    searchBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background.secondary,
        borderRadius: borderRadius.md,
        paddingHorizontal: spacing.md,
    },
    searchIcon: {
        marginRight: spacing.sm,
    },
    searchInput: {
        flex: 1,
        height: 44,
        fontSize: 16,
        color: colors.text.primary,
    },
    searchButton: {
        backgroundColor: colors.primary,
        borderRadius: borderRadius.md,
        paddingHorizontal: spacing.lg,
        justifyContent: 'center',
    },
    searchButtonText: {
        color: colors.text.inverse,
        fontWeight: '600',
    },
    toggleContainer: {
        flexDirection: 'row',
        padding: spacing.md,
        backgroundColor: colors.background.card,
        gap: spacing.sm,
    },
    toggleButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.md,
        backgroundColor: colors.background.secondary,
        gap: spacing.xs,
    },
    toggleButtonActive: {
        backgroundColor: colors.secondary,
    },
    toggleButtonText: {
        color: colors.text.secondary,
        fontWeight: '600',
    },
    toggleButtonTextActive: {
        color: colors.text.inverse,
    },
    filterInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.sm,
        backgroundColor: colors.background.secondary,
        gap: spacing.xs,
    },
    filterText: {
        fontSize: 12,
        color: colors.text.secondary,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: spacing.md,
        color: colors.text.secondary,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.text.primary,
        marginTop: spacing.md,
    },
    emptyText: {
        fontSize: 14,
        color: colors.text.secondary,
        textAlign: 'center',
        marginTop: spacing.sm,
    },
    listContent: {
        padding: spacing.md,
    },
    card: {
        backgroundColor: colors.background.card,
        borderRadius: borderRadius.lg,
        marginBottom: spacing.md,
        overflow: 'hidden',
        ...shadows.sm,
    },
    cardImage: {
        width: '100%',
        height: 150,
        resizeMode: 'cover',
    },
    cardContent: {
        padding: spacing.md,
    },
    cardHeader: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginBottom: spacing.sm,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.text.primary,
        marginBottom: spacing.xs,
    },
    cardPreview: {
        fontSize: 14,
        color: colors.text.secondary,
        lineHeight: 20,
    },
    bookCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background.card,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.md,
        ...shadows.sm,
    },
    bookCover: {
        width: 60,
        height: 80,
        borderRadius: borderRadius.sm,
        marginRight: spacing.md,
    },
    bookCoverPlaceholder: {
        backgroundColor: colors.background.secondary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    bookDetails: {
        flex: 1,
    },
    bookTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.text.primary,
        marginBottom: spacing.xs,
    },
    bookDate: {
        fontSize: 12,
        color: colors.text.secondary,
        marginBottom: spacing.sm,
    },
    levelBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs - 2,
        borderRadius: borderRadius.round,
    },
    levelBadgeText: {
        color: colors.text.inverse,
        fontSize: 10,
        fontWeight: '600',
    },
});

export default SearchScreen;

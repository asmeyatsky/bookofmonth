import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Image, TouchableOpacity, Alert } from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/ApiService';
import BottomNavBar from '../components/BottomNavBar';
import { colors, spacing, borderRadius, shadows } from '../theme';

const BookmarksScreen = () => {
    const [bookmarkedNews, setBookmarkedNews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const navigation = useNavigation();
    const isFocused = useIsFocused();
    const { isAuthenticated } = useAuth();

    const fetchBookmarks = async () => {
        if (!isAuthenticated) {
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const data = await apiService.getBookmarks();
            if (Array.isArray(data)) {
                const newsEvents = data.map((bookmark: any) => ({
                    ...bookmark.news_event,
                    bookmark_id: bookmark.id
                }));
                setBookmarkedNews(newsEvents);
            }
        } catch (error: any) {
            if (__DEV__) console.error("Error fetching bookmarks:", error);
            Alert.alert("Error", error.message || "Failed to fetch bookmarks.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isFocused) {
            if (!isAuthenticated) {
                Alert.alert(
                    "Authentication Required",
                    "Please log in to view bookmarks.",
                    [
                        { text: "Cancel", onPress: () => navigation.goBack() },
                        { text: "Log In", onPress: () => navigation.navigate('Login' as never) }
                    ]
                );
                setLoading(false);
            } else {
                fetchBookmarks();
            }
        }
    }, [isFocused, isAuthenticated]);

    const removeBookmark = async (bookmarkId: number) => {
        try {
            await apiService.deleteBookmark(bookmarkId);
            setBookmarkedNews(prev => prev.filter(item => item.bookmark_id !== bookmarkId));
        } catch (error: any) {
            if (__DEV__) console.error("Error removing bookmark:", error);
            Alert.alert("Error", error.message || "Failed to remove bookmark.");
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (!isAuthenticated) {
        return (
            <View style={styles.container}>
                <View style={styles.emptyContainer}>
                    <Icon name="lock" size={60} color={colors.text.light} />
                    <Text style={styles.emptyTitle}>Login Required</Text>
                    <Text style={styles.emptyText}>Please log in to view your bookmarks.</Text>
                </View>
                <BottomNavBar />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {bookmarkedNews.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Icon name="bookmark-o" size={60} color={colors.text.light} />
                    <Text style={styles.emptyTitle}>No Bookmarks Yet</Text>
                    <Text style={styles.emptyText}>Bookmark stories to save them here.</Text>
                </View>
            ) : (
                <FlatList
                    data={bookmarkedNews}
                    keyExtractor={item => item.id.toString()}
                    renderItem={({ item }) => (
                        <View style={styles.item}>
                            <View style={styles.itemHeader}>
                                <Text style={styles.itemTitle}>{item.title}</Text>
                                <TouchableOpacity onPress={() => removeBookmark(item.bookmark_id)}>
                                    <Icon name="bookmark" size={24} color={colors.accent} />
                                </TouchableOpacity>
                            </View>
                            {item.image_url && (
                                <Image source={{ uri: item.image_url }} style={styles.newsImage} />
                            )}
                            <Text style={styles.itemContent} numberOfLines={3}>{item.raw_content}</Text>
                        </View>
                    )}
                    contentContainerStyle={styles.listContent}
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background.primary,
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
    item: {
        backgroundColor: colors.background.card,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.md,
        ...shadows.md,
    },
    itemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    itemTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.text.primary,
        flexShrink: 1,
        marginRight: spacing.sm,
    },
    newsImage: {
        width: '100%',
        height: 180,
        borderRadius: borderRadius.md,
        resizeMode: 'cover',
        marginVertical: spacing.sm,
    },
    itemContent: {
        fontSize: 14,
        color: colors.text.secondary,
        lineHeight: 20,
    },
});

export default BookmarksScreen;

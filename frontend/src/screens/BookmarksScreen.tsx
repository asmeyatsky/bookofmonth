import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Image, TouchableOpacity, Alert } from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/ApiService';

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
            Alert.alert("Success", "Bookmark removed successfully.");
            setBookmarkedNews(prev => prev.filter(item => item.bookmark_id !== bookmarkId));
        } catch (error: any) {
            if (__DEV__) console.error("Error removing bookmark:", error);
            Alert.alert("Error", error.message || "Failed to remove bookmark.");
        }
    };

    if (loading) {
        return <ActivityIndicator size="large" style={styles.loader} />;
    }

    if (!isAuthenticated) {
        return (
            <View style={styles.container}>
                <Text style={styles.emptyMessage}>Please log in to view your bookmarks.</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Your Bookmarks</Text>
            {bookmarkedNews.length === 0 ? (
                <Text style={styles.emptyMessage}>You have no bookmarked events yet.</Text>
            ) : (
                <FlatList
                    data={bookmarkedNews}
                    keyExtractor={item => item.id.toString()}
                    renderItem={({ item }) => (
                        <View style={styles.item}>
                            <View style={styles.itemHeader}>
                                <Text style={styles.itemTitle}>{item.title}</Text>
                                <TouchableOpacity onPress={() => removeBookmark(item.bookmark_id)}>
                                    <Icon name="bookmark" size={24} color="gold" />
                                </TouchableOpacity>
                            </View>
                            {item.image_url && (
                                <Image source={{ uri: item.image_url }} style={styles.newsImage} />
                            )}
                            <Text>{item.raw_content}</Text>
                        </View>
                    )}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#f8f8f8',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 16,
        textAlign: 'center',
        color: '#333',
    },
    emptyMessage: {
        textAlign: 'center',
        marginTop: 50,
        fontSize: 16,
        color: '#666',
    },
    item: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.22,
        shadowRadius: 2.22,
        elevation: 3,
    },
    itemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    itemTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        flexShrink: 1,
        marginRight: 10,
    },
    newsImage: {
        width: '100%',
        height: 180,
        borderRadius: 6,
        resizeMode: 'cover',
        marginVertical: 10,
    },
    loader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default BookmarksScreen;

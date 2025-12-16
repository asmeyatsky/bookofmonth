import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Button, Image, Modal, TouchableWithoutFeedback, Alert, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ttsService } from '../services/TtsService';
import TappableText from '../components/TappableText';
import ImageViewer from 'react-native-image-zoom-viewer';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/ApiService';

const HomeScreen = () => {
    const [newsEvents, setNewsEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isImageViewerVisible, setIsImageViewerVisible] = useState(false);
    const [currentImage, setCurrentImage] = useState<{url: string}[]>([]);
    const [bookmarkedEvents, setBookmarkedEvents] = useState<Set<string>>(new Set());
    const [readEvents, setReadEvents] = useState<Set<string>>(new Set());
    const navigation = useNavigation();
    const { isAuthenticated, user, logout } = useAuth();

    useEffect(() => {
        loadData();
        return () => {
            ttsService.stop();
        };
    }, [isAuthenticated]);

    const loadData = async () => {
        try {
            // Fetch news events (public)
            const newsData = await apiService.getNewsEvents();
            setNewsEvents(newsData.results || []);

            // Fetch user-specific data if authenticated
            if (isAuthenticated) {
                try {
                    const [bookmarksData, progressData] = await Promise.all([
                        apiService.getBookmarks(),
                        apiService.getReadingProgress(),
                    ]);

                    if (Array.isArray(bookmarksData)) {
                        const bookmarkedIds = new Set(bookmarksData.map((bookmark: any) => bookmark.news_event.id));
                        setBookmarkedEvents(bookmarkedIds);
                    }

                    if (Array.isArray(progressData)) {
                        const readIds = new Set(
                            progressData
                                .filter((progress: any) => progress.completed)
                                .map((progress: any) => progress.news_event.id)
                        );
                        setReadEvents(readIds);
                    }
                } catch (error) {
                    console.error('Error fetching user data:', error);
                }
            }
        } catch (error) {
            console.error('Error fetching news events:', error);
        } finally {
            setLoading(false);
        }
    };

    const openImageViewer = (imageUrl: string) => {
        setCurrentImage([{ url: imageUrl }]);
        setIsImageViewerVisible(true);
    };

    const toggleBookmark = async (newsEventId: string) => {
        if (!isAuthenticated) {
            Alert.alert(
                "Authentication Required",
                "Please log in to bookmark events.",
                [
                    { text: "Cancel", style: "cancel" },
                    { text: "Log In", onPress: () => navigation.navigate('Login' as never) }
                ]
            );
            return;
        }

        const isBookmarked = bookmarkedEvents.has(newsEventId);

        try {
            if (isBookmarked) {
                const bookmarks = await apiService.getBookmarks();
                const bookmarkToDelete = bookmarks.find((b: any) => b.news_event.id === newsEventId);

                if (bookmarkToDelete) {
                    await apiService.deleteBookmark(bookmarkToDelete.id);
                    setBookmarkedEvents(prev => {
                        const newSet = new Set(prev);
                        newSet.delete(newsEventId);
                        return newSet;
                    });
                }
            } else {
                await apiService.createBookmark(newsEventId);
                setBookmarkedEvents(prev => new Set(prev).add(newsEventId));
            }
        } catch (error: any) {
            console.error("Error toggling bookmark:", error);
            Alert.alert("Error", error.message || "Failed to toggle bookmark.");
        }
    };

    const markAsRead = async (newsEventId: string, completed: boolean) => {
        if (!isAuthenticated) {
            Alert.alert(
                "Authentication Required",
                "Please log in to track reading progress.",
                [
                    { text: "Cancel", style: "cancel" },
                    { text: "Log In", onPress: () => navigation.navigate('Login' as never) }
                ]
            );
            return;
        }

        try {
            const existingProgress = await apiService.getReadingProgress(newsEventId);

            if (existingProgress && existingProgress.length > 0) {
                await apiService.patchReadingProgress(existingProgress[0].id, completed);
            } else {
                await apiService.updateReadingProgress(newsEventId, completed);
            }

            setReadEvents(prev => {
                const newSet = new Set(prev);
                if (completed) {
                    newSet.add(newsEventId);
                } else {
                    newSet.delete(newsEventId);
                }
                return newSet;
            });
        } catch (error: any) {
            console.error("Error marking as read:", error);
            Alert.alert("Error", error.message || "Failed to update reading progress.");
        }
    };

    const handleLogout = async () => {
        Alert.alert(
            "Logout",
            "Are you sure you want to logout?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Logout",
                    style: "destructive",
                    onPress: async () => {
                        await logout();
                        navigation.reset({
                            index: 0,
                            routes: [{ name: 'Login' as never }],
                        });
                    }
                }
            ]
        );
    };

    if (loading) {
        return <ActivityIndicator size="large" style={styles.loader} />;
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Daily Entries</Text>
                {isAuthenticated ? (
                    <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                        <Text style={styles.logoutText}>Logout ({user?.username})</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        onPress={() => navigation.navigate('Login' as never)}
                        style={styles.loginButton}
                    >
                        <Text style={styles.loginText}>Log In</Text>
                    </TouchableOpacity>
                )}
            </View>

            <FlatList
                data={newsEvents}
                keyExtractor={item => item.id.toString()}
                renderItem={({ item }) => (
                    <View style={styles.item}>
                        <View style={styles.itemHeader}>
                            <Text style={styles.itemTitle}>{item.title}</Text>
                            <View style={styles.actionButtons}>
                                <TouchableWithoutFeedback onPress={() => toggleBookmark(item.id)}>
                                    <Icon
                                        name={bookmarkedEvents.has(item.id) ? 'bookmark' : 'bookmark-o'}
                                        size={24}
                                        color={bookmarkedEvents.has(item.id) ? 'gold' : 'gray'}
                                        style={styles.iconButton}
                                    />
                                </TouchableWithoutFeedback>
                                <TouchableWithoutFeedback onPress={() => markAsRead(item.id, !readEvents.has(item.id))}>
                                    <Icon
                                        name={readEvents.has(item.id) ? 'check-square' : 'square-o'}
                                        size={24}
                                        color={readEvents.has(item.id) ? 'green' : 'gray'}
                                        style={styles.iconButton}
                                    />
                                </TouchableWithoutFeedback>
                            </View>
                        </View>
                        {item.image_url && (
                            <TouchableWithoutFeedback onPress={() => openImageViewer(item.image_url)}>
                                <Image source={{ uri: item.image_url }} style={styles.newsImage} />
                            </TouchableWithoutFeedback>
                        )}
                        <TappableText content={item.raw_content} />
                        <Button title="Read Aloud" onPress={() => ttsService.speak(item.raw_content)} />
                    </View>
                )}
            />

            <View style={styles.buttonContainer}>
                <Button title="View Bookmarks" onPress={() => navigation.navigate('Bookmarks' as never)} />
                <Button title="Child Profiles" onPress={() => navigation.navigate('ChildProfileList' as never)} />
                <Button title="Monthly Books" onPress={() => navigation.navigate('MonthlyBookList' as never)} />
                <Button title="Search" onPress={() => navigation.navigate('Search' as never)} />
                <Button title="Achievements" onPress={() => navigation.navigate('Achievements' as never)} />
                <Button title="Parent Dashboard" onPress={() => navigation.navigate('ParentDashboard' as never)} />
            </View>

            <Modal visible={isImageViewerVisible} transparent={true}>
                <ImageViewer
                    imageUrls={currentImage}
                    enableSwipeDown={true}
                    onCancel={() => setIsImageViewerVisible(false)}
                />
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    loginButton: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    loginText: {
        color: '#fff',
        fontWeight: '600',
    },
    logoutButton: {
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    logoutText: {
        color: '#007AFF',
        fontSize: 14,
    },
    item: {
        marginBottom: 16,
        padding: 10,
        backgroundColor: '#fff',
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 1.5,
        elevation: 3,
    },
    itemTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        flexShrink: 1,
        marginRight: 10,
    },
    itemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    actionButtons: {
        flexDirection: 'row',
    },
    iconButton: {
        marginLeft: 15,
    },
    newsImage: {
        width: '100%',
        height: 200,
        resizeMode: 'cover',
        marginVertical: 10,
        borderRadius: 5,
    },
    loader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonContainer: {
        gap: 8,
        paddingVertical: 8,
    },
});

export default HomeScreen;

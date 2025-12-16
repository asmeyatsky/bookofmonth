import React, { useState } from 'react';
import { View, Text, TextInput, Button, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Image, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome';

const SearchScreen = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchType, setSearchType] = useState('news_events'); // 'news_events' or 'monthly_books'
    const navigation = useNavigation();

    const handleSearch = async () => {
        setLoading(true);
        setSearchResults([]);

        const endpoint = searchType === 'news_events'
            ? `http://localhost:8000/api/content/news-events/?title__icontains=${searchTerm}`
            : `http://localhost:8000/api/assembly/monthly-books/?title__icontains=${searchTerm}`;

        try {
            const response = await fetch(endpoint);
            const data = await response.json();
            setSearchResults(data.results);
        } catch (error) {
            console.error("Search error:", error);
            Alert.alert("Error", "Failed to perform search.");
        } finally {
            setLoading(false);
        }
    };

    const renderNewsEventItem = ({ item }: { item: any }) => (
        <View style={styles.item}>
            {item.image_url && (
                <Image source={{ uri: item.image_url }} style={styles.itemImage} />
            )}
            <Text style={styles.itemTitle}>{item.title}</Text>
            <Text numberOfLines={3}>{item.raw_content}</Text>
        </View>
    );

    const renderMonthlyBookItem = ({ item }: { item: any }) => (
        <View style={styles.item}>
            <Image source={{ uri: item.cover_image_url }} style={styles.itemImage} />
            <Text style={styles.itemTitle}>{item.title}</Text>
            <Text>{item.month}/{item.year}</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Search</Text>
            <View style={styles.searchBar}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search by title..."
                    value={searchTerm}
                    onChangeText={setSearchTerm}
                    onSubmitEditing={handleSearch}
                />
                <Button title="Search" onPress={handleSearch} />
            </View>

            <View style={styles.toggleButtons}>
                <TouchableOpacity
                    style={[styles.toggleButton, searchType === 'news_events' && styles.toggleButtonActive]}
                    onPress={() => setSearchType('news_events')}
                >
                    <Text style={styles.toggleButtonText}>News Events</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.toggleButton, searchType === 'monthly_books' && styles.toggleButtonActive]}
                    onPress={() => setSearchType('monthly_books')}
                >
                    <Text style={styles.toggleButtonText}>Monthly Books</Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <ActivityIndicator size="large" style={styles.loader} />
            ) : (
                <FlatList
                    data={searchResults}
                    keyExtractor={item => item.id.toString()}
                    renderItem={searchType === 'news_events' ? renderNewsEventItem : renderMonthlyBookItem}
                    ListEmptyComponent={<Text style={styles.emptyMessage}>No results found.</Text>}
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
    searchBar: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    searchInput: {
        flex: 1,
        height: 40,
        borderColor: 'gray',
        borderWidth: 1,
        paddingLeft: 8,
        borderRadius: 5,
        marginRight: 8,
        backgroundColor: '#fff',
    },
    toggleButtons: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 16,
    },
    toggleButton: {
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 5,
        marginHorizontal: 5,
        backgroundColor: '#e0e0e0',
    },
    toggleButtonActive: {
        backgroundColor: '#007bff',
    },
    toggleButtonText: {
        color: '#fff',
        fontWeight: 'bold',
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
    itemImage: {
        width: '100%',
        height: 180,
        borderRadius: 6,
        resizeMode: 'cover',
        marginBottom: 10,
    },
    itemTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    emptyMessage: {
        textAlign: 'center',
        marginTop: 50,
        fontSize: 16,
        color: '#666',
    },
    loader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default SearchScreen;

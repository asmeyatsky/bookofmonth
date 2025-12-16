import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Image, TouchableOpacity, Alert, Button } from 'react-native'; // Import Button
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome';

const MonthlyBookListScreen = () => {
    const [monthlyBooks, setMonthlyBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigation = useNavigation();

    useEffect(() => {
        // Fetch monthly books from the API
        fetch('http://localhost:8000/api/assembly/monthly-books/')
            .then(response => response.json())
            .then(data => {
                setMonthlyBooks(data.results);
                setLoading(false);
            })
            .catch(error => {
                console.error(error);
                setLoading(false);
                Alert.alert("Error", "Failed to fetch monthly books.");
            });
    }, []);

    const handleTakeQuiz = (bookId: string) => {
        navigation.navigate('Quiz', { bookId });
    };

    if (loading) {
        return <ActivityIndicator size="large" style={styles.loader} />;
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Your Monthly Books</Text>
            {monthlyBooks.length === 0 ? (
                <Text style={styles.emptyMessage}>No monthly books available yet.</Text>
            ) : (
                <FlatList
                    data={monthlyBooks}
                    keyExtractor={item => item.id.toString()}
                    renderItem={({ item }) => (
                        <TouchableOpacity style={styles.bookItem} onPress={() => Alert.alert("Book Tapped", `You tapped on ${item.title}`)}>
                            <Image source={{ uri: item.cover_image_url }} style={styles.coverImage} />
                            <View style={styles.bookDetails}>
                                <Text style={styles.bookTitle}>{item.title}</Text>
                                <Text style={styles.bookDate}>{item.month}/{item.year}</Text>
                                <Button title="Take Quiz" onPress={() => handleTakeQuiz(item.id)} />
                            </View>
                        </TouchableOpacity>
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
        marginBottom: 20,
        textAlign: 'center',
        color: '#333',
    },
    emptyMessage: {
        textAlign: 'center',
        marginTop: 50,
        fontSize: 16,
        color: '#666',
    },
    bookItem: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 15,
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.41,
        elevation: 2,
    },
    coverImage: {
        width: 80,
        height: 100,
        borderRadius: 4,
        marginRight: 15,
        resizeMode: 'cover',
    },
    bookDetails: {
        flex: 1,
    },
    bookTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#555',
    },
    bookDate: {
        fontSize: 14,
        color: '#888',
        marginTop: 5,
    },
    loader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default MonthlyBookListScreen;

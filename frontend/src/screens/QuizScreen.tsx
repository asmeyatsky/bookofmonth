import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Button, Alert, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

const QuizScreen = () => {
    const [quiz, setQuiz] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedAnswers, setSelectedAnswers] = useState<{ [key: string]: string }>({});
    const [showResults, setShowResults] = useState(false);
    const navigation = useNavigation();
    const route = useRoute();
    const { bookId } = route.params as { bookId: string }; // Get bookId from route params

    useEffect(() => {
        // Fetch quiz for the given bookId
        fetch(`http://localhost:8000/api/quizzes/quizzes/?monthly_book=${bookId}`)
            .then(response => response.json())
            .then(data => {
                if (data.results && data.results.length > 0) {
                    setQuiz(data.results[0]); // Assuming one quiz per book
                }
                setLoading(false);
            })
            .catch(error => {
                console.error("Error fetching quiz:", error);
                setLoading(false);
                Alert.alert("Error", "Failed to fetch quiz.");
            });
    }, [bookId]);

    const handleAnswerSelection = (questionId: string, answer: string) => {
        setSelectedAnswers(prev => ({
            ...prev,
            [questionId]: answer,
        }));
    };

    const handleSubmitQuiz = () => {
        setShowResults(true);
    };

    const calculateScore = () => {
        if (!quiz || !quiz.questions) return 0;
        let score = 0;
        quiz.questions.forEach((question: any) => {
            if (selectedAnswers[question.id] === question.correct_answer) {
                score++;
            }
        });
        return score;
    };

    if (loading) {
        return <ActivityIndicator size="large" style={styles.loader} />;
    }

    if (!quiz) {
        return (
            <View style={styles.container}>
                <Text style={styles.emptyMessage}>No quiz available for this book yet.</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{quiz.title}</Text>
            <FlatList
                data={quiz.questions}
                keyExtractor={(item: any) => item.id.toString()}
                renderItem={({ item: question }) => (
                    <View style={styles.questionContainer}>
                        <Text style={styles.questionText}>{question.text}</Text>
                        {question.options.map((option: string, index: number) => (
                            <TouchableOpacity
                                key={index}
                                style={[
                                    styles.optionButton,
                                    selectedAnswers[question.id] === option && styles.selectedOption,
                                    showResults && option === question.correct_answer && styles.correctOption,
                                    showResults && selectedAnswers[question.id] === option && option !== question.correct_answer && styles.incorrectOption,
                                ]}
                                onPress={() => !showResults && handleAnswerSelection(question.id, option)}
                            >
                                <Text style={styles.optionText}>{option}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            />
            {!showResults ? (
                <Button title="Submit Quiz" onPress={handleSubmitQuiz} />
            ) : (
                <View>
                    <Text style={styles.resultsText}>Your Score: {calculateScore()} / {quiz.questions.length}</Text>
                    <Button title="Go Back" onPress={() => navigation.goBack()} />
                </View>
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
    loader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyMessage: {
        textAlign: 'center',
        marginTop: 50,
        fontSize: 16,
        color: '#666',
    },
    questionContainer: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 15,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.41,
        elevation: 2,
    },
    questionText: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 10,
        color: '#333',
    },
    optionButton: {
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 5,
        backgroundColor: '#e0e0e0',
        marginBottom: 8,
    },
    selectedOption: {
        backgroundColor: '#a0d4ff',
    },
    correctOption: {
        backgroundColor: '#d4edda', // Green for correct
    },
    incorrectOption: {
        backgroundColor: '#f8d7da', // Red for incorrect
    },
    optionText: {
        fontSize: 16,
        color: '#333',
    },
    resultsText: {
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
        marginTop: 20,
        marginBottom: 10,
        color: '#007bff',
    },
});

export default QuizScreen;

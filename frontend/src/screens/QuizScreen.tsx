import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, TouchableOpacity, FlatList } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { apiService } from '../services/ApiService';
import { authService } from '../services/AuthService';
import BottomNavBar from '../components/BottomNavBar';
import { colors, spacing, borderRadius, shadows } from '../theme';

interface Question {
    id: string;
    text: string;
    options: string[];
}

interface Quiz {
    id: string;
    title: string;
    questions: Question[];
}

interface AnswerResult {
    question: string;
    question_text: string;
    selected_answer: string;
    is_correct: boolean;
    correct_answer: string;
}

interface SubmissionResult {
    score: number;
    total_questions: number;
    answers: AnswerResult[];
}

const QuizScreen = () => {
    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [selectedAnswers, setSelectedAnswers] = useState<{ [key: string]: string }>({});
    const [showResults, setShowResults] = useState(false);
    const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null);
    const navigation = useNavigation();
    const route = useRoute();
    const { bookId, quizId, returnTo } = route.params as { bookId?: string; quizId?: string; returnTo?: string };

    useEffect(() => {
        apiService.getQuizzes()
            .then(data => {
                const quizzes = data.results || data || [];
                const matchingQuiz = quizzes.find((q: any) => q.monthly_book === bookId || q.monthly_book?.id === bookId);
                if (matchingQuiz) {
                    setQuiz(matchingQuiz);
                }
                setLoading(false);
            })
            .catch(error => {
                if (__DEV__) console.error("Error fetching quiz:", error);
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

    const getCorrectAnswer = (questionId: string): string | undefined => {
        if (!submissionResult) return undefined;
        const answer = submissionResult.answers.find(a => String(a.question) === String(questionId));
        return answer?.correct_answer;
    };

    const handleSubmitQuiz = async () => {
        if (!quiz) return;

        const isAuthenticated = authService.isAuthenticated();

        if (isAuthenticated) {
            setSubmitting(true);
            try {
                const answers = Object.entries(selectedAnswers).map(([questionId, answer]) => ({
                    question: questionId,
                    selected_answer: answer,
                }));

                const result = await apiService.submitQuiz(quiz.id, answers);
                setSubmissionResult(result);
            } catch (error: any) {
                if (error.message.includes('already submitted')) {
                    Alert.alert("Already Submitted", "You have already completed this quiz.");
                } else {
                    if (__DEV__) console.error("Error submitting quiz:", error);
                    Alert.alert("Error", "Failed to submit quiz. Please try again.");
                }
            } finally {
                setSubmitting(false);
            }
        } else {
            Alert.alert(
                "Login Required",
                "Please log in to submit your quiz and see results."
            );
            return;
        }

        setShowResults(true);
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (!quiz) {
        return (
            <View style={styles.container}>
                <View style={styles.emptyContainer}>
                    <Icon name="question-circle" size={60} color={colors.text.light} />
                    <Text style={styles.emptyTitle}>No Quiz Available</Text>
                    <Text style={styles.emptyText}>No quiz available for this book yet.</Text>
                </View>
            </View>
        );
    }

    const displayScore = submissionResult?.score ?? 0;
    const displayTotal = submissionResult?.total_questions ?? quiz.questions.length;

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{quiz.title}</Text>
            <FlatList
                data={quiz.questions}
                keyExtractor={(item: Question) => item.id.toString()}
                renderItem={({ item: question }) => {
                    const correctAnswer = getCorrectAnswer(question.id);
                    return (
                        <View style={styles.questionContainer}>
                            <Text style={styles.questionText}>{question.text}</Text>
                            {question.options.map((option: string, index: number) => (
                                <TouchableOpacity
                                    key={index}
                                    style={[
                                        styles.optionButton,
                                        selectedAnswers[question.id] === option && styles.selectedOption,
                                        showResults && correctAnswer && option === correctAnswer && styles.correctOption,
                                        showResults && correctAnswer && selectedAnswers[question.id] === option && option !== correctAnswer && styles.incorrectOption,
                                    ]}
                                    onPress={() => !showResults && handleAnswerSelection(question.id, option)}
                                >
                                    <Text style={[
                                        styles.optionText,
                                        selectedAnswers[question.id] === option && styles.selectedOptionText,
                                    ]}>{option}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    );
                }}
                contentContainerStyle={styles.listContent}
            />
            {!showResults ? (
                <TouchableOpacity
                    style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                    onPress={handleSubmitQuiz}
                    disabled={submitting}
                >
                    <Text style={styles.submitButtonText}>
                        {submitting ? "Submitting..." : "Submit Quiz"}
                    </Text>
                </TouchableOpacity>
            ) : (
                <View style={styles.resultsContainer}>
                    <Text style={styles.resultsText}>Your Score: {displayScore} / {displayTotal}</Text>
                    <TouchableOpacity 
                        style={styles.backBtn} 
                        onPress={() => {
                            if (returnTo === 'book' && bookId) {
                                navigation.navigate('MonthlyBook' as never, { bookId } as never);
                            } else {
                                navigation.goBack();
                            }
                        }}
                    >
                        <Text style={styles.backBtnText}>
                            {returnTo === 'book' ? 'Back to Book' : 'Go Back'}
                        </Text>
                    </TouchableOpacity>
                </View>
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
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginVertical: spacing.md,
        textAlign: 'center',
        color: colors.text.primary,
    },
    listContent: {
        padding: spacing.md,
    },
    questionContainer: {
        backgroundColor: colors.background.card,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.md,
        ...shadows.sm,
    },
    questionText: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: spacing.sm,
        color: colors.text.primary,
    },
    optionButton: {
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderRadius: borderRadius.md,
        backgroundColor: colors.background.secondary,
        marginBottom: spacing.sm,
    },
    selectedOption: {
        backgroundColor: colors.secondary,
    },
    selectedOptionText: {
        color: colors.text.inverse,
    },
    correctOption: {
        backgroundColor: '#d4edda',
        borderWidth: 1,
        borderColor: colors.status.success,
    },
    incorrectOption: {
        backgroundColor: '#f8d7da',
        borderWidth: 1,
        borderColor: colors.status.error,
    },
    optionText: {
        fontSize: 16,
        color: colors.text.primary,
    },
    submitButton: {
        backgroundColor: colors.primary,
        margin: spacing.md,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        alignItems: 'center',
        ...shadows.md,
    },
    submitButtonDisabled: {
        opacity: 0.7,
    },
    submitButtonText: {
        color: colors.text.inverse,
        fontSize: 18,
        fontWeight: '600',
    },
    resultsContainer: {
        padding: spacing.md,
        alignItems: 'center',
    },
    resultsText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.primary,
        marginBottom: spacing.md,
    },
    backBtn: {
        backgroundColor: colors.secondary,
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.md,
    },
    backBtnText: {
        color: colors.text.inverse,
        fontWeight: '600',
        fontSize: 16,
    },
});

export default QuizScreen;

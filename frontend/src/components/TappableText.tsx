import React, { useState } from 'react';
import { Text, View, StyleSheet, TouchableWithoutFeedback, Alert } from 'react-native';
import { dictionaryService } from '../services/DictionaryService';
import { colors, spacing, getTypographyForLevel } from '../theme';

interface TappableTextProps {
    content: string;
    readingLevel?: string;
}

const TappableText: React.FC<TappableTextProps> = ({ content, readingLevel }) => {
    const [highlightedWord, setHighlightedWord] = useState<string | null>(null);
    const typography = getTypographyForLevel(readingLevel);

    const handleWordPress = async (word: string) => {
        // Clean the word from punctuation
        const cleanWord = word.replace(/[.,!?;:'"()]/g, '').toLowerCase();
        if (cleanWord.length === 0) return;

        setHighlightedWord(cleanWord);
        const definition = await dictionaryService.getDefinition(cleanWord);

        Alert.alert(
            cleanWord.charAt(0).toUpperCase() + cleanWord.slice(1),
            definition || "No definition found for this word.",
            [{ text: "OK", onPress: () => {} }]
        );

        setTimeout(() => setHighlightedWord(null), 2000);
    };

    const renderContent = () => {
        const words = content.split(/(\s+)/);
        return words.map((word, index) => {
            const trimmedWord = word.trim();
            if (trimmedWord.length === 0) {
                return <Text key={index}>{word}</Text>;
            }

            const cleanWord = trimmedWord.replace(/[.,!?;:'"()]/g, '').toLowerCase();
            const isHighlighted = highlightedWord === cleanWord;

            return (
                <TouchableWithoutFeedback key={index} onPress={() => handleWordPress(trimmedWord)}>
                    <Text style={[
                        styles.word,
                        { fontSize: typography.body, lineHeight: typography.body * 1.6 },
                        isHighlighted && styles.highlightedWord
                    ]}>
                        {word}
                    </Text>
                </TouchableWithoutFeedback>
            );
        });
    };

    return (
        <View style={styles.container}>
            {renderContent()}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    word: {
        color: colors.text.primary,
    },
    highlightedWord: {
        backgroundColor: colors.accent,
        color: colors.text.primary,
        borderRadius: 2,
    },
});

export default TappableText;

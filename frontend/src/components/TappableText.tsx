import React, { useState } from 'react';
import { Text, View, StyleSheet, TouchableWithoutFeedback, Alert } from 'react-native';
import { dictionaryService } from '../services/DictionaryService';

interface TappableTextProps {
    content: string;
}

const TappableText: React.FC<TappableTextProps> = ({ content }) => {
    const [highlightedWord, setHighlightedWord] = useState<string | null>(null);

    const handleWordPress = async (word: string) => {
        setHighlightedWord(word);
        const definition = await dictionaryService.getDefinition(word);
        Alert.alert(word, definition || "Definition not found.");
        setTimeout(() => setHighlightedWord(null), 3000); // Clear highlight after 3 seconds
    };

    const renderContent = () => {
        const words = content.split(/(\s+)/); // Split by spaces, keeping spaces
        return words.map((word, index) => {
            const trimmedWord = word.trim();
            if (trimmedWord.length === 0) {
                return <Text key={index}>{word}</Text>; // Render spaces as is
            }
            const isHighlighted = highlightedWord === trimmedWord;
            return (
                <TouchableWithoutFeedback key={index} onPress={() => handleWordPress(trimmedWord)}>
                    <Text style={isHighlighted ? styles.highlightedWord : styles.word}>
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
        fontSize: 16,
    },
    highlightedWord: {
        fontSize: 16,
        backgroundColor: 'yellow',
    },
});

export default TappableText;

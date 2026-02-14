import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, borderRadius, shadows } from '../theme';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    state: State = { hasError: false, error: null };

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        console.error('ErrorBoundary caught:', error, info);
    }

    render() {
        if (this.state.hasError) {
            return (
                <View style={styles.container}>
                    <Text style={styles.title}>Something went wrong</Text>
                    <Text style={styles.message}>{this.state.error?.message}</Text>
                    <TouchableOpacity
                        style={styles.button}
                        onPress={() => this.setState({ hasError: false, error: null })}
                    >
                        <Text style={styles.buttonText}>Try Again</Text>
                    </TouchableOpacity>
                </View>
            );
        }
        return this.props.children;
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.lg,
        backgroundColor: colors.background.primary,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.text.primary,
        marginBottom: spacing.sm,
    },
    message: {
        fontSize: 14,
        color: colors.text.secondary,
        textAlign: 'center',
        marginBottom: spacing.lg,
    },
    button: {
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.md,
        ...shadows.md,
    },
    buttonText: {
        color: colors.text.inverse,
        fontWeight: '600',
    },
});

export default ErrorBoundary;

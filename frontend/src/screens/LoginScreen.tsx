import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useAuth } from '../context/AuthContext';
import { colors, spacing, borderRadius, shadows } from '../theme';

interface LoginScreenProps {
    navigation: any;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, register } = useAuth();

    const handleSubmit = async () => {
        if (!username || !password) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        if (!isLogin) {
            if (!email) {
                Alert.alert('Error', 'Email is required for registration');
                return;
            }
            if (password !== passwordConfirm) {
                Alert.alert('Error', 'Passwords do not match');
                return;
            }
        }

        setLoading(true);
        try {
            if (isLogin) {
                await login({ username, password });
            } else {
                await register({ username, email, password, password_confirm: passwordConfirm });
            }
            navigation.replace('Home');
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    const toggleMode = () => {
        setIsLogin(!isLogin);
        setPassword('');
        setPasswordConfirm('');
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <View style={styles.formContainer}>
                <Icon name="book" size={48} color={colors.primary} style={styles.logo} />
                <Text style={styles.title}>Book of the Month</Text>
                <Text style={styles.subtitle}>
                    {isLogin ? 'Welcome back!' : 'Create an account'}
                </Text>

                <TextInput
                    style={styles.input}
                    placeholder="Username"
                    placeholderTextColor={colors.text.light}
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                    autoCorrect={false}
                />

                {!isLogin && (
                    <TextInput
                        style={styles.input}
                        placeholder="Email"
                        placeholderTextColor={colors.text.light}
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                    />
                )}

                <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor={colors.text.light}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />

                {!isLogin && (
                    <TextInput
                        style={styles.input}
                        placeholder="Confirm Password"
                        placeholderTextColor={colors.text.light}
                        value={passwordConfirm}
                        onChangeText={setPasswordConfirm}
                        secureTextEntry
                    />
                )}

                <TouchableOpacity
                    style={[styles.button, loading && styles.buttonDisabled]}
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color={colors.text.inverse} />
                    ) : (
                        <Text style={styles.buttonText}>
                            {isLogin ? 'Log In' : 'Sign Up'}
                        </Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity onPress={toggleMode} style={styles.toggleButton}>
                    <Text style={styles.toggleText}>
                        {isLogin
                            ? "Don't have an account? Sign up"
                            : 'Already have an account? Log in'}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => navigation.replace('Home', { browseAsGuest: true })}
                    style={styles.skipButton}
                >
                    <Text style={styles.skipText}>Continue as Guest</Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background.primary,
    },
    formContainer: {
        flex: 1,
        justifyContent: 'center',
        padding: spacing.lg,
    },
    logo: {
        alignSelf: 'center',
        marginBottom: spacing.md,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: spacing.sm,
        color: colors.text.primary,
    },
    subtitle: {
        fontSize: 18,
        textAlign: 'center',
        marginBottom: spacing.xl,
        color: colors.text.secondary,
    },
    input: {
        backgroundColor: colors.background.card,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        marginBottom: spacing.md,
        fontSize: 16,
        borderWidth: 1,
        borderColor: colors.background.secondary,
        color: colors.text.primary,
    },
    button: {
        backgroundColor: colors.primary,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        alignItems: 'center',
        marginTop: spacing.sm,
        ...shadows.md,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonText: {
        color: colors.text.inverse,
        fontSize: 18,
        fontWeight: '600',
    },
    toggleButton: {
        marginTop: spacing.lg,
        alignItems: 'center',
    },
    toggleText: {
        color: colors.secondary,
        fontSize: 16,
    },
    skipButton: {
        marginTop: spacing.md,
        alignItems: 'center',
    },
    skipText: {
        color: colors.text.light,
        fontSize: 14,
    },
});

export default LoginScreen;

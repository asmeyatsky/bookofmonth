import React from 'react';
import { View, StyleSheet, Platform, TouchableOpacity, Text, Linking } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { colors, spacing, borderRadius } from '../theme';

interface VideoPlayerProps {
    videoUrl: string;
}

function getYouTubeId(url: string): string | null {
    const match = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoUrl }) => {
    const videoId = getYouTubeId(videoUrl);
    if (!videoId) return null;

    if (Platform.OS === 'web') {
        return (
            <View style={styles.container}>
                <iframe
                    src={`https://www.youtube.com/embed/${videoId}?rel=0`}
                    style={{ width: '100%', height: '100%', border: 'none', borderRadius: 12 } as any}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                />
            </View>
        );
    }

    // Native fallback — open in YouTube app/browser
    return (
        <TouchableOpacity
            style={styles.nativeContainer}
            onPress={() => Linking.openURL(videoUrl)}
        >
            <View style={styles.playOverlay}>
                <Icon name="youtube-play" size={48} color="#FF0000" />
                <Text style={styles.watchText}>Watch Video</Text>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        aspectRatio: 16 / 9,
        borderRadius: borderRadius.md,
        overflow: 'hidden',
        marginBottom: spacing.md,
    },
    nativeContainer: {
        width: '100%',
        aspectRatio: 16 / 9,
        borderRadius: borderRadius.md,
        overflow: 'hidden',
        marginBottom: spacing.md,
        backgroundColor: colors.background.secondary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    playOverlay: {
        alignItems: 'center',
        gap: spacing.sm,
    },
    watchText: {
        color: colors.text.primary,
        fontWeight: '600',
        fontSize: 14,
    },
});

export default VideoPlayer;

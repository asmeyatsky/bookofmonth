import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    StyleSheet,
    FlatList,
    Pressable,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useAuth, ChildProfile } from '../context/AuthContext';
import { colors, spacing, borderRadius, shadows, getReadingLevelDisplay, getReadingLevelColor } from '../theme';

interface ProfileSwitcherProps {
    compact?: boolean;
    onProfileChange?: (profile: ChildProfile) => void;
}

const ProfileSwitcher: React.FC<ProfileSwitcherProps> = ({ compact = false, onProfileChange }) => {
    const { childProfiles, activeChildProfile, setActiveChildProfile, isAuthenticated } = useAuth();
    const [modalVisible, setModalVisible] = useState(false);

    if (!isAuthenticated || childProfiles.length === 0) {
        return null;
    }

    const handleSelectProfile = async (profile: ChildProfile) => {
        await setActiveChildProfile(profile);
        setModalVisible(false);
        onProfileChange?.(profile);
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const getAvatarColor = (index: number) => {
        const avatarColors = [
            colors.categories.animals,
            colors.categories.science,
            colors.categories.space,
            colors.categories.arts,
            colors.categories.sports,
        ];
        return avatarColors[index % avatarColors.length];
    };

    if (compact) {
        return (
            <TouchableOpacity
                style={styles.compactButton}
                onPress={() => setModalVisible(true)}
            >
                <View style={[styles.avatarSmall, { backgroundColor: getAvatarColor(0) }]}>
                    <Text style={styles.avatarTextSmall}>
                        {activeChildProfile ? getInitials(activeChildProfile.name) : '?'}
                    </Text>
                </View>
                <Icon name="caret-down" size={12} color={colors.text.secondary} style={styles.caretIcon} />

                <Modal
                    visible={modalVisible}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setModalVisible(false)}
                >
                    <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Switch Reader</Text>
                            <FlatList
                                data={childProfiles}
                                keyExtractor={item => item.id.toString()}
                                renderItem={({ item, index }) => (
                                    <TouchableOpacity
                                        style={[
                                            styles.profileItem,
                                            activeChildProfile?.id === item.id && styles.profileItemActive,
                                        ]}
                                        onPress={() => handleSelectProfile(item)}
                                    >
                                        <View style={[styles.avatarMedium, { backgroundColor: getAvatarColor(index) }]}>
                                            <Text style={styles.avatarTextMedium}>{getInitials(item.name)}</Text>
                                        </View>
                                        <View style={styles.profileInfo}>
                                            <Text style={styles.profileName}>{item.name}</Text>
                                            <Text style={[styles.readingLevel, { color: getReadingLevelColor(item.reading_level) }]}>
                                                {getReadingLevelDisplay(item.reading_level)}
                                            </Text>
                                        </View>
                                        {activeChildProfile?.id === item.id && (
                                            <Icon name="check" size={16} color={colors.status.success} />
                                        )}
                                    </TouchableOpacity>
                                )}
                            />
                        </View>
                    </Pressable>
                </Modal>
            </TouchableOpacity>
        );
    }

    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={styles.switcherButton}
                onPress={() => setModalVisible(true)}
            >
                <View style={[styles.avatar, { backgroundColor: getAvatarColor(0) }]}>
                    <Text style={styles.avatarText}>
                        {activeChildProfile ? getInitials(activeChildProfile.name) : '?'}
                    </Text>
                </View>
                <View style={styles.profileDetails}>
                    <Text style={styles.activeProfileName}>
                        {activeChildProfile?.name || 'Select Reader'}
                    </Text>
                    {activeChildProfile && (
                        <Text style={[styles.activeReadingLevel, { color: getReadingLevelColor(activeChildProfile.reading_level) }]}>
                            {getReadingLevelDisplay(activeChildProfile.reading_level)}
                        </Text>
                    )}
                </View>
                <Icon name="chevron-down" size={14} color={colors.text.secondary} />
            </TouchableOpacity>

            <Modal
                visible={modalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setModalVisible(false)}
            >
                <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Who's Reading Today?</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Icon name="times" size={24} color={colors.text.secondary} />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={childProfiles}
                            keyExtractor={item => item.id.toString()}
                            renderItem={({ item, index }) => (
                                <TouchableOpacity
                                    style={[
                                        styles.profileCard,
                                        activeChildProfile?.id === item.id && styles.profileCardActive,
                                    ]}
                                    onPress={() => handleSelectProfile(item)}
                                >
                                    <View style={[styles.avatarLarge, { backgroundColor: getAvatarColor(index) }]}>
                                        <Text style={styles.avatarTextLarge}>{getInitials(item.name)}</Text>
                                    </View>
                                    <Text style={styles.cardProfileName}>{item.name}</Text>
                                    <View style={[styles.levelBadge, { backgroundColor: getReadingLevelColor(item.reading_level) }]}>
                                        <Text style={styles.levelBadgeText}>
                                            {getReadingLevelDisplay(item.reading_level)}
                                        </Text>
                                    </View>
                                    {activeChildProfile?.id === item.id && (
                                        <View style={styles.checkBadge}>
                                            <Icon name="check" size={12} color={colors.background.card} />
                                        </View>
                                    )}
                                </TouchableOpacity>
                            )}
                            horizontal={childProfiles.length <= 3}
                            numColumns={childProfiles.length > 3 ? 2 : undefined}
                            contentContainerStyle={styles.profileList}
                        />
                    </View>
                </Pressable>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: spacing.md,
    },
    switcherButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background.card,
        padding: spacing.sm,
        borderRadius: borderRadius.lg,
        ...shadows.sm,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: colors.text.inverse,
        fontWeight: 'bold',
        fontSize: 16,
    },
    avatarSmall: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarTextSmall: {
        color: colors.text.inverse,
        fontWeight: 'bold',
        fontSize: 11,
    },
    avatarMedium: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarTextMedium: {
        color: colors.text.inverse,
        fontWeight: 'bold',
        fontSize: 14,
    },
    avatarLarge: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    avatarTextLarge: {
        color: colors.text.inverse,
        fontWeight: 'bold',
        fontSize: 22,
    },
    profileDetails: {
        flex: 1,
        marginLeft: spacing.sm,
    },
    activeProfileName: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text.primary,
    },
    activeReadingLevel: {
        fontSize: 12,
        marginTop: 2,
    },
    compactButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    caretIcon: {
        marginLeft: 4,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: colors.background.overlay,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: colors.background.card,
        borderRadius: borderRadius.xl,
        padding: spacing.lg,
        width: '90%',
        maxWidth: 400,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.text.primary,
    },
    profileList: {
        justifyContent: 'center',
    },
    profileItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        borderRadius: borderRadius.md,
        marginBottom: spacing.sm,
    },
    profileItemActive: {
        backgroundColor: colors.background.secondary,
    },
    profileInfo: {
        flex: 1,
        marginLeft: spacing.md,
    },
    profileName: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text.primary,
    },
    readingLevel: {
        fontSize: 12,
        marginTop: 2,
    },
    profileCard: {
        alignItems: 'center',
        backgroundColor: colors.background.secondary,
        padding: spacing.lg,
        borderRadius: borderRadius.lg,
        margin: spacing.sm,
        minWidth: 100,
        position: 'relative',
    },
    profileCardActive: {
        borderWidth: 2,
        borderColor: colors.primary,
    },
    cardProfileName: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.text.primary,
        marginBottom: spacing.xs,
        textAlign: 'center',
    },
    levelBadge: {
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.round,
    },
    levelBadgeText: {
        color: colors.text.inverse,
        fontSize: 10,
        fontWeight: '600',
    },
    checkBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: colors.status.success,
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default ProfileSwitcher;

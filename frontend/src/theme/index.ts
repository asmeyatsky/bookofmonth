// Book of the Month - Child-Friendly Theme System

export const colors = {
    // Primary palette - bright and playful
    primary: '#FF6B6B',      // Coral red - main action color
    secondary: '#4ECDC4',    // Teal - secondary actions
    accent: '#FFE66D',       // Yellow - highlights and emphasis

    // Background colors
    background: {
        primary: '#FFF9F0',      // Warm cream
        secondary: '#F5F5F5',    // Light gray
        card: '#FFFFFF',         // White
        overlay: 'rgba(0,0,0,0.5)',
    },

    // Text colors
    text: {
        primary: '#2D3436',      // Dark gray for main text
        secondary: '#636E72',    // Medium gray for secondary text
        light: '#B2BEC3',        // Light gray for hints
        inverse: '#FFFFFF',      // White text on dark backgrounds
    },

    // Category-specific colors for news content
    categories: {
        animals: '#7CB342',      // Green - nature and animals
        science: '#42A5F5',      // Blue - science experiments
        space: '#7E57C2',        // Purple - astronomy and space
        technology: '#FF7043',   // Orange - tech and gadgets
        sports: '#26C6DA',       // Cyan - sports and activities
        arts: '#EC407A',         // Pink - arts and creativity
        funFacts: '#FFCA28',     // Amber - fun facts and trivia
        history: '#8D6E63',      // Brown - history
        nature: '#66BB6A',       // Light green - nature
        health: '#EF5350',       // Red - health and body
    },

    // Reading level colors
    readingLevels: {
        AGE_4_6: '#FFB74D',      // Orange - youngest readers
        AGE_7_9: '#64B5F6',      // Blue - middle readers
        AGE_10_12: '#81C784',    // Green - advanced readers
    },

    // Status colors
    status: {
        success: '#4CAF50',
        error: '#F44336',
        warning: '#FF9800',
        info: '#2196F3',
    },

    // Achievement colors
    achievements: {
        gold: '#FFD700',
        silver: '#C0C0C0',
        bronze: '#CD7F32',
        locked: '#E0E0E0',
    },

    // Streak colors
    streak: {
        fire: '#FF5722',
        glow: '#FFAB40',
    },
};

export const typography = {
    // Font families - using system fonts for better compatibility
    fontFamily: {
        regular: 'System',
        bold: 'System',
        light: 'System',
    },

    // Font sizes by reading level
    sizes: {
        // For AGE_4_6: Larger, easier to read
        young: {
            title: 28,
            subtitle: 22,
            body: 20,
            caption: 16,
        },
        // For AGE_7_9: Medium sizes
        middle: {
            title: 26,
            subtitle: 20,
            body: 18,
            caption: 14,
        },
        // For AGE_10_12: Standard sizes
        advanced: {
            title: 24,
            subtitle: 18,
            body: 16,
            caption: 12,
        },
        // Default (no reading level)
        default: {
            title: 24,
            subtitle: 18,
            body: 16,
            caption: 12,
        },
    },

    // Line heights for readability
    lineHeight: {
        tight: 1.2,
        normal: 1.5,
        relaxed: 1.8,
    },
};

export const spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
};

export const borderRadius = {
    sm: 4,
    md: 8,
    lg: 16,
    xl: 24,
    round: 999,
};

export const shadows = {
    sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.18,
        shadowRadius: 1.0,
        elevation: 1,
    },
    md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.22,
        shadowRadius: 2.22,
        elevation: 3,
    },
    lg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
};

// Helper to get typography sizes based on reading level
export const getTypographyForLevel = (readingLevel?: string) => {
    switch (readingLevel) {
        case 'AGE_4_6':
            return typography.sizes.young;
        case 'AGE_7_9':
            return typography.sizes.middle;
        case 'AGE_10_12':
            return typography.sizes.advanced;
        default:
            return typography.sizes.default;
    }
};

// Helper to get category color
export const getCategoryColor = (category?: string): string => {
    if (!category) return colors.primary;
    const normalizedCategory = category.toLowerCase().replace(/[^a-z]/g, '');
    return (colors.categories as Record<string, string>)[normalizedCategory] || colors.primary;
};

// Helper to get reading level color
export const getReadingLevelColor = (level?: string): string => {
    if (!level) return colors.text.secondary;
    return (colors.readingLevels as Record<string, string>)[level] || colors.text.secondary;
};

// Helper to get reading level display name
export const getReadingLevelDisplay = (level?: string): string => {
    switch (level) {
        case 'AGE_4_6':
            return 'Ages 4-6';
        case 'AGE_7_9':
            return 'Ages 7-9';
        case 'AGE_10_12':
            return 'Ages 10-12';
        default:
            return 'All Ages';
    }
};

// Category icons mapping (FontAwesome icon names)
export const categoryIcons: Record<string, string> = {
    animals: 'paw',
    science: 'flask',
    space: 'rocket',
    technology: 'laptop',
    sports: 'futbol-o',
    arts: 'paint-brush',
    funFacts: 'lightbulb-o',
    history: 'history',
    nature: 'leaf',
    health: 'heartbeat',
};

// Get category icon name
export const getCategoryIcon = (category?: string): string => {
    if (!category) return 'book';
    const normalizedCategory = category.toLowerCase().replace(/[^a-z]/g, '');
    return categoryIcons[normalizedCategory] || 'book';
};

export default {
    colors,
    typography,
    spacing,
    borderRadius,
    shadows,
    getTypographyForLevel,
    getCategoryColor,
    getReadingLevelColor,
    getReadingLevelDisplay,
    getCategoryIcon,
};

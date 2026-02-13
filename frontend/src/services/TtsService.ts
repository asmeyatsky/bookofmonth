import { Platform } from 'react-native';

class TtsService {
    private webUtterance: SpeechSynthesisUtterance | null = null;

    constructor() {
        if (Platform.OS !== 'web') {
            try {
                const Tts = require('react-native-tts').default;
                Tts.setDefaultLanguage('en-US');
                Tts.setDucking(true);
            } catch (e) {
                // TTS not available on this platform
            }
        }
    }

    async speak(text: string): Promise<void> {
        try {
            if (Platform.OS === 'web') {
                this.stopWeb();
                if (typeof window !== 'undefined' && window.speechSynthesis) {
                    this.webUtterance = new SpeechSynthesisUtterance(text);
                    this.webUtterance.lang = 'en-US';
                    window.speechSynthesis.speak(this.webUtterance);
                }
            } else {
                const Tts = require('react-native-tts').default;
                await Tts.stop();
                await Tts.speak(text);
            }
        } catch (error) {
            if (__DEV__) console.error('TTS speak error:', error);
        }
    }

    async stop(): Promise<void> {
        try {
            if (Platform.OS === 'web') {
                this.stopWeb();
            } else {
                const Tts = require('react-native-tts').default;
                await Tts.stop();
            }
        } catch (error) {
            if (__DEV__) console.error('TTS stop error:', error);
        }
    }

    private stopWeb(): void {
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
        this.webUtterance = null;
    }
}

export const ttsService = new TtsService();

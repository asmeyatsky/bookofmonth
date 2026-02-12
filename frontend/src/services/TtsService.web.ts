// Web version using Web Speech API
class TtsService {
    private synth: SpeechSynthesis | null = null;

    constructor() {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            this.synth = window.speechSynthesis;
        }
    }

    async speak(text: string): Promise<void> {
        if (!this.synth) {
            if (__DEV__) console.warn('Speech synthesis not available');
            return;
        }

        try {
            this.synth.cancel(); // Stop any ongoing speech
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'en-US';
            this.synth.speak(utterance);
        } catch (error) {
            if (__DEV__) console.error('TTS speak error:', error);
        }
    }

    async stop(): Promise<void> {
        if (!this.synth) return;

        try {
            this.synth.cancel();
        } catch (error) {
            if (__DEV__) console.error('TTS stop error:', error);
        }
    }
}

export const ttsService = new TtsService();

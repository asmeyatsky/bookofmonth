import Tts from 'react-native-tts';

class TtsService {
    constructor() {
        Tts.setDefaultLanguage('en-US');
        Tts.setDucking(true); // Lower other audio while speaking

        Tts.addEventListener('tts-start', (event) => { if (__DEV__) console.log('start', event); });
        Tts.addEventListener('tts-finish', (event) => { if (__DEV__) console.log('finish', event); });
        Tts.addEventListener('tts-cancel', (event) => { if (__DEV__) console.log('cancel', event); });
        Tts.addEventListener('tts-paused', (event) => { if (__DEV__) console.log('paused', event); });
        Tts.addEventListener('tts-resumed', (event) => { if (__DEV__) console.log('resumed', event); });
    }

    async speak(text: string): Promise<void> {
        try {
            await Tts.stop(); // Stop any ongoing speech
            await Tts.speak(text);
        } catch (error) {
            if (__DEV__) console.error('TTS speak error:', error);
        }
    }

    async stop(): Promise<void> {
        try {
            await Tts.stop();
        } catch (error) {
            if (__DEV__) console.error('TTS stop error:', error);
        }
    }
}

export const ttsService = new TtsService();

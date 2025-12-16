import Tts from 'react-native-tts';

class TtsService {
    constructor() {
        Tts.setDefaultLanguage('en-US');
        Tts.setDucking(true); // Lower other audio while speaking

        Tts.addEventListener('tts-start', (event) => console.log('start', event));
        Tts.addEventListener('tts-finish', (event) => console.log('finish', event));
        Tts.addEventListener('tts-cancel', (event) => console.log('cancel', event));
        Tts.addEventListener('tts-paused', (event) => console.log('paused', event));
        Tts.addEventListener('tts-resumed', (event) => console.log('resumed', event));
    }

    async speak(text: string): Promise<void> {
        try {
            await Tts.stop(); // Stop any ongoing speech
            await Tts.speak(text);
        } catch (error) {
            console.error('TTS speak error:', error);
        }
    }

    async stop(): Promise<void> {
        try {
            await Tts.stop();
        } catch (error) {
            console.error('TTS stop error:', error);
        }
    }
}

export const ttsService = new TtsService();

// frontend/src/services/DictionaryService.ts
class DictionaryService {
    async getDefinition(word: string): Promise<string | null> {
        // Mock implementation: In a real app, this would call a dictionary API.
        if (__DEV__) console.log(`Mock Dictionary Service: Getting definition for "${word}"`);
        const mockDefinitions: { [key: string]: string } = {
            "bioluminescent": "emitting light by natural physiological processes.",
            "archaeologists": "people who study human history and prehistory through the excavation of sites and the analysis of artifacts and other physical remains.",
            "technology": "the application of scientific knowledge for practical purposes, especially in industry.",
            "ecosystem": "a biological community of interacting organisms and their physical environment."
        };
        return mockDefinitions[word.toLowerCase()] || `No definition found for "${word}". (Mock)`;
    }
}

export const dictionaryService = new DictionaryService();

// Web version - stubs out Firebase analytics
class AnalyticsService {
    async logEvent(eventName: string, params?: { [key: string]: any }) {
        if (__DEV__) console.log(`[Analytics] Event: ${eventName}`, params);
    }

    async setUserId(userId: string) {
        if (__DEV__) console.log(`[Analytics] User ID: ${userId}`);
    }

    async setUserProperty(name: string, value: string) {
        if (__DEV__) console.log(`[Analytics] Property: ${name} = ${value}`);
    }

    async setCurrentScreen(screenName: string, screenClass?: string) {
        if (__DEV__) console.log(`[Analytics] Screen: ${screenName}`);
    }
}

export const analyticsService = new AnalyticsService();

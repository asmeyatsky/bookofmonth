import analytics from '@react-native-firebase/analytics';

class AnalyticsService {
    async logEvent(eventName: string, params?: { [key: string]: any }) {
        if (__DEV__) console.log(`Logging event: ${eventName}`, params);
        await analytics().logEvent(eventName, params);
    }

    async setUserId(userId: string) {
        if (__DEV__) console.log(`Setting user ID: ${userId}`);
        await analytics().setUserId(userId);
    }

    async setUserProperty(name: string, value: string) {
        if (__DEV__) console.log(`Setting user property: ${name} = ${value}`);
        await analytics().setUserProperty(name, value);
    }

    async setCurrentScreen(screenName: string, screenClass?: string) {
        if (__DEV__) console.log(`Setting current screen: ${screenName}`);
        await analytics().logScreenView({ screen_name: screenName, screen_class: screenClass || screenName });
    }
}

export const analyticsService = new AnalyticsService();

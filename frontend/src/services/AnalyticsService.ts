import analytics from '@react-native-firebase/analytics';

class AnalyticsService {
    async logEvent(eventName: string, params?: { [key: string]: any }) {
        console.log(`Logging event: ${eventName}`, params);
        await analytics().logEvent(eventName, params);
    }

    async setUserId(userId: string) {
        console.log(`Setting user ID: ${userId}`);
        await analytics().setUserId(userId);
    }

    async setUserProperty(name: string, value: string) {
        console.log(`Setting user property: ${name} = ${value}`);
        await analytics().setUserProperty(name, value);
    }

    async setCurrentScreen(screenName: string, screenClass?: string) {
        console.log(`Setting current screen: ${screenName}`);
        await analytics().logScreenView({ screen_name: screenName, screen_class: screenClass || screenName });
    }
}

export const analyticsService = new AnalyticsService();

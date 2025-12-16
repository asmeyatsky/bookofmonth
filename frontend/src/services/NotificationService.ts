import PushNotification from 'react-native-push-notification';

class NotificationService {
    constructor() {
        PushNotification.configure({
            // (optional) Called when Token is generated (iOS and Android)
            onRegister: function (token: any) {
                console.log("TOKEN:", token);
            },

            // (required) Called when a remote is received or opened, or local notification is served on iOS 10+ and Android
            onNotification: function (notification: any) {
                console.log("NOTIFICATION:", notification);
                // process the notification

                // (required) Called when a remote is received or opened, or local notification is served
                // notification.finish(PushNotificationIOS.FetchResult.NoData);
            },

            // (optional) Called when Action is pressed (Android)
            onAction: function (notification: any) {
                console.log("ACTION:", notification.action);
                console.log("NOTIFICATION:", notification);

                // process the action
            },

            // (optional) Called when the user fails to register for remote notifications. Typically occurs when APNS is having issues, or the device is a simulator. (iOS)
            onRegistrationError: function(err: any) {
                console.error(err.message, err);
            },

            // IOS ONLY (optional): default: all notifications are shown to the user
            permissions: {
                alert: true,
                badge: true,
                sound: true,
            },

            popInitialNotification: true,
            requestPermissions: true,
        });

        // Create a channel for Android notifications
        PushNotification.createChannel(
            {
                channelId: "daily-reminders", // (required)
                channelName: "Daily Reminders", // (required)
                channelDescription: "Reminders for new daily entries", // (optional) default: undefined.
                soundName: "default", // (optional) See `soundName` parameter of `PushNotification.localNotification`
                importance: 4, // (optional) default: 4. Int value of the Android notification importance:
                vibrate: true, // (optional) default: true. Creates the default vibration pattern if true.
            },
            (created) => console.log(`createChannel returned '${created}'`) // (optional) callback returns whether the channel was created, false means it already existed.
        );
    }

    scheduleDailyNotification(title: string, message: string, hour: number, minute: number) {
        PushNotification.localNotificationSchedule({
            channelId: "daily-reminders",
            title: title,
            message: message,
            date: new Date(Date.now() + 60 * 1000), // Schedule for 1 minute from now for testing
            // repeatType: 'day', // Uncomment for daily repeat
            // repeatTime: 1,
            // fireDate: new Date(Date.now() + (hour * 60 + minute) * 60 * 1000) // For specific time
        });
    }

    cancelAllNotifications() {
        PushNotification.cancelAllLocalNotifications();
    }
}

export const notificationService = new NotificationService();

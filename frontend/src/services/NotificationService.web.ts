// Web version - uses Web Notifications API or stubs out functionality
class NotificationService {
    private permission: NotificationPermission = 'default';

    constructor() {
        if (typeof window !== 'undefined' && 'Notification' in window) {
            this.permission = Notification.permission;
            if (this.permission === 'default') {
                Notification.requestPermission().then((p) => {
                    this.permission = p;
                });
            }
        }
    }

    scheduleDailyNotification(title: string, message: string, hour: number, minute: number) {
        if (this.permission !== 'granted') {
            if (__DEV__) console.log('Notifications not permitted');
            return;
        }

        // For web, we can use the Notifications API directly
        // Note: scheduled notifications aren't supported natively in web
        if (__DEV__) console.log(`Would schedule notification: "${title}" at ${hour}:${minute}`);
    }

    showNotification(title: string, message: string) {
        if (this.permission === 'granted' && typeof Notification !== 'undefined') {
            new Notification(title, { body: message });
        }
    }

    cancelAllNotifications() {
        if (__DEV__) console.log('Cancel all notifications (web stub)');
    }
}

export const notificationService = new NotificationService();

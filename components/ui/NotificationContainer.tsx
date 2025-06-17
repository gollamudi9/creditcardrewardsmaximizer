import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import NotificationBanner from './NotificationBanner';
import { useNotifications } from '@/hooks/useNotifications';

export default function NotificationContainer() {
  const { notifications, hideNotification } = useNotifications();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { top: insets.top + 10 }]} pointerEvents="box-none">
      {notifications.map((notification, index) => (
        <View
          key={notification.id}
          style={[styles.notificationWrapper, { top: index * 80 }]}
        >
          <NotificationBanner
            type={notification.type}
            title={notification.title}
            message={notification.message}
            visible={notification.visible}
            onDismiss={() => hideNotification(notification.id)}
            autoHide={notification.autoHide}
            duration={notification.duration}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  notificationWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
});
import { useState, useCallback } from 'react';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  visible: boolean;
  autoHide?: boolean;
  duration?: number;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const showNotification = useCallback((
    type: Notification['type'],
    title: string,
    message: string,
    options?: {
      autoHide?: boolean;
      duration?: number;
    }
  ) => {
    const id = Date.now().toString();
    const notification: Notification = {
      id,
      type,
      title,
      message,
      visible: true,
      autoHide: options?.autoHide ?? true,
      duration: options?.duration ?? 4000,
    };

    setNotifications(prev => [...prev, notification]);

    return id;
  }, []);

  const hideNotification = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id
          ? { ...notification, visible: false }
          : notification
      )
    );

    // Remove from array after animation completes
    setTimeout(() => {
      setNotifications(prev =>
        prev.filter(notification => notification.id !== id)
      );
    }, 300);
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, visible: false }))
    );

    setTimeout(() => {
      setNotifications([]);
    }, 300);
  }, []);

  const showSuccess = useCallback((title: string, message: string, options?: { autoHide?: boolean; duration?: number }) => {
    return showNotification('success', title, message, options);
  }, [showNotification]);

  const showError = useCallback((title: string, message: string, options?: { autoHide?: boolean; duration?: number }) => {
    return showNotification('error', title, message, options);
  }, [showNotification]);

  const showWarning = useCallback((title: string, message: string, options?: { autoHide?: boolean; duration?: number }) => {
    return showNotification('warning', title, message, options);
  }, [showNotification]);

  const showInfo = useCallback((title: string, message: string, options?: { autoHide?: boolean; duration?: number }) => {
    return showNotification('info', title, message, options);
  }, [showNotification]);

  return {
    notifications,
    showNotification,
    hideNotification,
    clearAllNotifications,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
}
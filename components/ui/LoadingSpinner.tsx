import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '@/context/ThemeContext';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
}

export default function LoadingSpinner({ 
  size = 'medium', 
  color 
}: LoadingSpinnerProps) {
  const { colors } = useTheme();
  const rotation = useSharedValue(0);

  React.useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, {
        duration: 1000,
        easing: Easing.linear,
      }),
      -1
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });

  const sizeStyles = {
    small: { width: 16, height: 16, borderWidth: 2 },
    medium: { width: 24, height: 24, borderWidth: 2 },
    large: { width: 32, height: 32, borderWidth: 3 },
  };

  const spinnerColor = color || colors.primary;

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.spinner,
          sizeStyles[size],
          {
            borderColor: `${spinnerColor}20`,
            borderTopColor: spinnerColor,
          },
          animatedStyle,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinner: {
    borderRadius: 999,
  },
});
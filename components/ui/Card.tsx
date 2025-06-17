import React from 'react';
import { StyleSheet, View, ViewStyle, StyleProp } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  elevation?: 'none' | 'small' | 'medium' | 'large';
  padded?: boolean;
  outlined?: boolean;
}

const Card: React.FC<CardProps> = ({
  children,
  style,
  elevation = 'small',
  padded = true,
  outlined = false,
}) => {
  const { colors, isDark } = useTheme();

  const getElevationStyle = () => {
    if (isDark) {
      // Minimal shadows for dark mode
      switch (elevation) {
        case 'none':
          return {};
        case 'medium':
          return styles.darkElevationMedium;
        case 'large':
          return styles.darkElevationLarge;
        default:
          return styles.darkElevationSmall;
      }
    } else {
      // Regular shadows for light mode
      switch (elevation) {
        case 'none':
          return {};
        case 'medium':
          return styles.elevationMedium;
        case 'large':
          return styles.elevationLarge;
        default:
          return styles.elevationSmall;
      }
    }
  };

  return (
    <View
      style={[
        styles.card,
        getElevationStyle(),
        { backgroundColor: colors.card },
        outlined && { borderWidth: 1, borderColor: colors.border },
        padded && styles.padded,
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  padded: {
    padding: 16,
  },
  elevationSmall: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  elevationMedium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  elevationLarge: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  darkElevationSmall: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  darkElevationMedium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  darkElevationLarge: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
});

export default Card;
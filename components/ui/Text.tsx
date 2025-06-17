import React from 'react';
import { Text as RNText, TextStyle, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

interface TextProps {
  children: React.ReactNode;
  style?: TextStyle;
  variant?: 'heading1' | 'heading2' | 'heading3' | 'subtitle' | 'body' | 'caption' | 'button';
  color?: string;
  center?: boolean;
  bold?: boolean;
  medium?: boolean;
}

const Text: React.FC<TextProps> = ({
  children,
  style,
  variant = 'body',
  color,
  center = false,
  bold = false,
  medium = false,
  ...props
}) => {
  const { colors } = useTheme();
  
  const getVariantStyle = () => {
    switch (variant) {
      case 'heading1':
        return styles.heading1;
      case 'heading2':
        return styles.heading2;
      case 'heading3':
        return styles.heading3;
      case 'subtitle':
        return styles.subtitle;
      case 'caption':
        return styles.caption;
      case 'button':
        return styles.button;
      default:
        return styles.body;
    }
  };

  const getFontFamily = () => {
    if (bold) return 'Inter-Bold';
    if (medium) return 'Inter-Medium';
    return 'Inter-Regular';
  };

  return (
    <RNText
      style={[
        getVariantStyle(),
        { fontFamily: getFontFamily() },
        { color: color || colors.text },
        center && styles.center,
        style,
      ]}
      {...props}
    >
      {children}
    </RNText>
  );
};

const styles = StyleSheet.create({
  heading1: {
    fontSize: 28,
    lineHeight: 34,
  },
  heading2: {
    fontSize: 24,
    lineHeight: 29,
  },
  heading3: {
    fontSize: 20,
    lineHeight: 24,
  },
  subtitle: {
    fontSize: 18,
    lineHeight: 22,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
  },
  caption: {
    fontSize: 14,
    lineHeight: 20,
  },
  button: {
    fontSize: 16,
    lineHeight: 24,
  },
  center: {
    textAlign: 'center',
  },
});

export default Text;
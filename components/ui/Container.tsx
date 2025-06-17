import React from 'react';
import { StyleSheet, View, ScrollView, SafeAreaView, ViewProps } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

interface ContainerProps extends ViewProps {
  children: React.ReactNode;
  scrollable?: boolean;
  padded?: boolean;
  safeArea?: boolean;
}

const Container: React.FC<ContainerProps> = ({ 
  children, 
  scrollable = true,
  padded = true, 
  safeArea = true,
  style,
  ...props 
}) => {
  const { colors } = useTheme();
  
  const containerStyles = [
    styles.container,
    { backgroundColor: colors.background },
    padded && styles.padded,
    style,
  ];

  const content = (
    <View style={containerStyles} {...props}>
      {children}
    </View>
  );

  if (scrollable) {
    return (
      <ScrollView 
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={!safeArea && styles.growContainer}
      >
        {safeArea ? (
          <SafeAreaView style={styles.safeArea}>
            {content}
          </SafeAreaView>
        ) : content}
      </ScrollView>
    );
  }

  return safeArea ? (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {content}
    </SafeAreaView>
  ) : content;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  padded: {
    padding: 16,
  },
  safeArea: {
    flex: 1,
  },
  growContainer: {
    flexGrow: 1,
  }
});

export default Container;
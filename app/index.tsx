import { useEffect } from 'react';
import { router } from 'expo-router';
import { useAuthContext } from '@/context/AuthContext';
import Container from '@/components/ui/Container';
import Text from '@/components/ui/Text';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

export default function IndexScreen() {
  const { user, loading } = useAuthContext();
  const { colors } = useTheme();

  useEffect(() => {
    // Add a small delay to ensure navigation is fully ready
    const navigationTimer = setTimeout(() => {
      if (!loading) {
        if (user) {
          router.replace('/(tabs)');
        } else {
          router.replace('/(auth)/login');
        }
      }
    }, 150); // Increased delay for better stability

    return () => clearTimeout(navigationTimer);
  }, [user, loading]);

  if (loading) {
    return (
      <Container safeArea>
        <View style={styles.loadingContainer}>
          <Text variant="heading2" color={colors.primary}>Loading...</Text>
        </View>
      </Container>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
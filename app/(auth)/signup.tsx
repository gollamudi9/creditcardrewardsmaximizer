import React, { useState } from 'react';
import { StyleSheet, View, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import Container from '@/components/ui/Container';
import Text from '@/components/ui/Text';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useTheme } from '@/context/ThemeContext';
import { useAuthContext } from '@/context/AuthContext';
import { TextInput } from 'react-native';
import { Eye, EyeOff, CreditCard } from 'lucide-react-native';

export default function SignupScreen() {
  const { colors } = useTheme();
  const { signUp, loading } = useAuthContext();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{ 
    name?: string; 
    email?: string; 
    password?: string; 
    confirmPassword?: string; 
    general?: string;
  }>({});

  const validateForm = () => {
    const newErrors: { 
      name?: string; 
      email?: string; 
      password?: string; 
      confirmPassword?: string;
    } = {};

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!password.trim()) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async () => {
    if (!validateForm()) return;

    setErrors({});
    const { data, error } = await signUp(email.trim(), password, name.trim());

    if (error) {
      setErrors({ general: error.message || 'Signup failed. Please try again.' });
    } else if (data?.user) {
      router.replace('/(tabs)');
    }
  };

  return (
    <Container scrollable padded safeArea>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <View style={[styles.logoContainer, { backgroundColor: colors.primary + '20' }]}>
            <CreditCard size={32} color={colors.primary} />
          </View>
          <Text variant="heading1" bold style={styles.title}>Create Account</Text>
          <Text variant="body" color={colors.subtext} center style={styles.subtitle}>
            Join us to start maximizing your credit card rewards
          </Text>
        </View>

        <Card style={styles.formCard}>
          {errors.general && (
            <View style={[styles.errorContainer, { backgroundColor: colors.error + '10' }]}>
              <Text variant="caption" color={colors.error}>{errors.general}</Text>
            </View>
          )}

          <View style={styles.inputContainer}>
            <Text variant="caption" color={colors.text} style={styles.inputLabel}>Full Name</Text>
            <TextInput
              style={[
                styles.input,
                { 
                  backgroundColor: colors.background,
                  borderColor: errors.name ? colors.error : colors.border,
                  color: colors.text
                }
              ]}
              placeholder="Enter your full name"
              placeholderTextColor={colors.subtext}
              value={name}
              onChangeText={(text) => {
                setName(text);
                if (errors.name) setErrors(prev => ({ ...prev, name: undefined }));
              }}
              autoCapitalize="words"
              autoCorrect={false}
            />
            {errors.name && (
              <Text variant="caption" color={colors.error} style={styles.errorText}>
                {errors.name}
              </Text>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text variant="caption" color={colors.text} style={styles.inputLabel}>Email</Text>
            <TextInput
              style={[
                styles.input,
                { 
                  backgroundColor: colors.background,
                  borderColor: errors.email ? colors.error : colors.border,
                  color: colors.text
                }
              ]}
              placeholder="Enter your email"
              placeholderTextColor={colors.subtext}
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (errors.email) setErrors(prev => ({ ...prev, email: undefined }));
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {errors.email && (
              <Text variant="caption" color={colors.error} style={styles.errorText}>
                {errors.email}
              </Text>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text variant="caption" color={colors.text} style={styles.inputLabel}>Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[
                  styles.input,
                  styles.passwordInput,
                  { 
                    backgroundColor: colors.background,
                    borderColor: errors.password ? colors.error : colors.border,
                    color: colors.text
                  }
                ]}
                placeholder="Create a password"
                placeholderTextColor={colors.subtext}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (errors.password) setErrors(prev => ({ ...prev, password: undefined }));
                }}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Button
                title=""
                onPress={() => setShowPassword(!showPassword)}
                variant="ghost"
                style={styles.eyeButton}
                leftIcon={showPassword ? <EyeOff size={20} color={colors.subtext} /> : <Eye size={20} color={colors.subtext} />}
              />
            </View>
            {errors.password && (
              <Text variant="caption" color={colors.error} style={styles.errorText}>
                {errors.password}
              </Text>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text variant="caption" color={colors.text} style={styles.inputLabel}>Confirm Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[
                  styles.input,
                  styles.passwordInput,
                  { 
                    backgroundColor: colors.background,
                    borderColor: errors.confirmPassword ? colors.error : colors.border,
                    color: colors.text
                  }
                ]}
                placeholder="Confirm your password"
                placeholderTextColor={colors.subtext}
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: undefined }));
                }}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Button
                title=""
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                variant="ghost"
                style={styles.eyeButton}
                leftIcon={showConfirmPassword ? <EyeOff size={20} color={colors.subtext} /> : <Eye size={20} color={colors.subtext} />}
              />
            </View>
            {errors.confirmPassword && (
              <Text variant="caption" color={colors.error} style={styles.errorText}>
                {errors.confirmPassword}
              </Text>
            )}
          </View>

          <Button
            title="Create Account"
            onPress={handleSignup}
            loading={loading}
            disabled={loading}
            fullWidth
            style={styles.signupButton}
          />

          <View style={styles.loginContainer}>
            <Text variant="body" color={colors.subtext}>Already have an account? </Text>
            <Button
              title="Sign In"
              onPress={() => router.push('/(auth)/login')}
              variant="ghost"
              size="small"
            />
          </View>
        </Card>
      </KeyboardAvoidingView>
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    marginBottom: 8,
  },
  subtitle: {
    paddingHorizontal: 20,
  },
  formCard: {
    padding: 24,
  },
  errorContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeButton: {
    position: 'absolute',
    right: 8,
    top: 0,
    height: 48,
    width: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    marginTop: 4,
  },
  signupButton: {
    marginTop: 8,
    marginBottom: 24,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
import React, { useState } from 'react';
import { StyleSheet, View, Image, Switch, ScrollView, Pressable } from 'react-native';
import Container from '@/components/ui/Container';
import Text from '@/components/ui/Text';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useTheme } from '@/context/ThemeContext';
import { useAuthContext } from '@/context/AuthContext';
import { router } from 'expo-router';
import { User, Settings, CreditCard, Bell, LogOut, ChevronRight, Moon, Sun, CircleHelp as HelpCircle, Shield, MessageSquare } from 'lucide-react-native';

export default function ProfileScreen() {
  const { colors, isDark, setTheme, theme } = useTheme();
  const { user, signOut } = useAuthContext();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  const toggleNotifications = () => {
    setNotificationsEnabled(prev => !prev);
  };

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (!error) {
      router.replace('/(auth)/login');
    }
  };

  if (!user) {
    return (
      <Container safeArea padded>
        <View style={styles.errorContainer}>
          <Text variant="heading2">Please sign in to view profile</Text>
        </View>
      </Container>
    );
  }

  return (
    <Container padded>
      <View style={styles.header}>
        <Text variant="heading1" bold>Profile</Text>
        <Settings size={24} color={colors.text} />
      </View>

      {/* User Profile Card */}
      <Card style={styles.profileCard}>
        <View style={styles.profileHeader}>
          <Image 
            source={{ 
              uri: user.user_metadata?.avatar_url || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg' 
            }}
            style={styles.avatar}
          />
          <View style={styles.profileInfo}>
            <Text variant="heading2" bold>{user.user_metadata?.name || user.email}</Text>
            <Text variant="body" color={colors.subtext}>{user.email}</Text>
          </View>
        </View>
        <Button
          title="Edit Profile"
          variant="outline"
          onPress={() => {}}
          style={styles.editProfileButton}
        />
      </Card>

      {/* Settings Section */}
      <View style={styles.settingsSection}>
        <Text variant="subtitle" bold style={styles.sectionTitle}>Settings</Text>
        
        <Card style={styles.settingsCard}>
          <Pressable 
            style={styles.settingItem}
            onPress={toggleTheme}
          >
            <View style={styles.settingLeft}>
              {isDark ? (
                <Moon size={22} color={colors.text} style={styles.settingIcon} />
              ) : (
                <Sun size={22} color={colors.text} style={styles.settingIcon} />
              )}
              <Text variant="body">Dark Mode</Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: '#767577', true: colors.primary + '80' }}
              thumbColor={isDark ? colors.primary : '#f4f3f4'}
            />
          </Pressable>
          
          <View style={styles.divider} />
          
          <Pressable 
            style={styles.settingItem}
            onPress={toggleNotifications}
          >
            <View style={styles.settingLeft}>
              <Bell size={22} color={colors.text} style={styles.settingIcon} />
              <Text variant="body">Notifications</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={toggleNotifications}
              trackColor={{ false: '#767577', true: colors.primary + '80' }}
              thumbColor={notificationsEnabled ? colors.primary : '#f4f3f4'}
            />
          </Pressable>
          
          <View style={styles.divider} />
          
          <Pressable style={styles.settingItem} onPress={() => {}}>
            <View style={styles.settingLeft}>
              <CreditCard size={22} color={colors.text} style={styles.settingIcon} />
              <Text variant="body">Manage Cards</Text>
            </View>
            <ChevronRight size={22} color={colors.subtext} />
          </Pressable>
          
          <View style={styles.divider} />
          
          <Pressable style={styles.settingItem} onPress={() => {}}>
            <View style={styles.settingLeft}>
              <Shield size={22} color={colors.text} style={styles.settingIcon} />
              <Text variant="body">Privacy & Security</Text>
            </View>
            <ChevronRight size={22} color={colors.subtext} />
          </Pressable>
        </Card>
      </View>

      {/* Support Section */}
      <View style={styles.supportSection}>
        <Text variant="subtitle" bold style={styles.sectionTitle}>Support</Text>
        
        <Card style={styles.supportCard}>
          <Pressable style={styles.supportItem} onPress={() => {}}>
            <View style={styles.supportLeft}>
              <HelpCircle size={22} color={colors.text} style={styles.supportIcon} />
              <Text variant="body">Help Center</Text>
            </View>
            <ChevronRight size={22} color={colors.subtext} />
          </Pressable>
          
          <View style={styles.divider} />
          
          <Pressable style={styles.supportItem} onPress={() => {}}>
            <View style={styles.supportLeft}>
              <MessageSquare size={22} color={colors.text} style={styles.supportIcon} />
              <Text variant="body">Contact Us</Text>
            </View>
            <ChevronRight size={22} color={colors.subtext} />
          </Pressable>
        </Card>
      </View>

      {/* Logout Button */}
      <Button
        title="Log Out"
        variant="outline"
        leftIcon={<LogOut size={18} color={colors.error} />}
        onPress={handleSignOut}
        style={styles.logoutButton}
        textStyle={{ color: colors.error }}
      />
      
      <Text variant="caption" color={colors.subtext} center style={styles.versionText}>
        Version 1.0.0
      </Text>
    </Container>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  profileCard: {
    marginBottom: 24,
    padding: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  editProfileButton: {
    marginTop: 8,
  },
  settingsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  settingsCard: {
    padding: 0,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    marginRight: 12,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginHorizontal: 16,
  },
  supportSection: {
    marginBottom: 24,
  },
  supportCard: {
    padding: 0,
  },
  supportItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  supportLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  supportIcon: {
    marginRight: 12,
  },
  logoutButton: {
    marginBottom: 24,
  },
  versionText: {
    marginBottom: 40,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
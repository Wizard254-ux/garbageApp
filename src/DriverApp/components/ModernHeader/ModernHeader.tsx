import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../shared/context/AuthContext';
import { useTheme } from '../../../shared/context/ThemeContext';

interface ModernHeaderProps {
  onNotificationPress?: () => void;
  onProfilePress?: () => void;
}

export const ModernHeader: React.FC<ModernHeaderProps> = ({ 
  onNotificationPress, 
  onProfilePress 
}) => {
  const { user } = useAuth();
  const { colors, mode, toggleTheme } = useTheme();
  
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <StatusBar 
        barStyle={mode === 'dark' ? 'light-content' : 'dark-content'} 
        backgroundColor={colors.statusBarBackground || colors.background}
        translucent={false}
      />
      <View style={styles.header}>
        <View style={styles.leftSection}>
          <View style={styles.greetingContainer}>
            <Text style={styles.greeting}>
              {getGreeting()}, {user?.name?.split(' ')[0]?.toUpperCase() || 'DRIVER'} 👋
            </Text>
          </View>
        </View>
        
        <View style={styles.rightSection}>
          <TouchableOpacity 
            style={styles.iconButton} 
            onPress={toggleTheme}
          >
            <Ionicons 
              name={mode === 'dark' ? 'sunny' : 'moon'} 
              size={24} 
              color={colors.headerText} 
            />
          </TouchableOpacity>
          

          
          <TouchableOpacity 
            style={styles.profileButton} 
            onPress={onProfilePress}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.name?.charAt(0)?.toUpperCase() || 'D'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    backgroundColor: colors.headerBackground,
  },

  header: {
    backgroundColor: colors.headerBackground,
    paddingHorizontal: 20,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 12 : 44,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  leftSection: {
    flex: 1,
  },
  greetingContainer: {
    marginRight: 20,
  },
  greeting: {
    color: colors.headerText,
    fontSize: 18,
    fontWeight: 'bold',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconButton: {
    position: 'relative',
    padding: 8,
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  profileButton: {
    marginLeft: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
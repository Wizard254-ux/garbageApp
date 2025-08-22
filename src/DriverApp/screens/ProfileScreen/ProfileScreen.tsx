import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../shared/context/AuthContext';
import { useTheme } from '../../../shared/context/ThemeContext';
import { useDriverStats } from '../../hooks/useDriverStats';
import { ModernHeader } from '../../components/ModernHeader/ModernHeader';

export const ProfileScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const { colors, mode, toggleTheme } = useTheme();
  const { stats, loading, fetchStats } = useDriverStats();
  
  useEffect(() => {
    fetchStats();
  }, []);

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: logout }
      ]
    );
  };


  const menuItems = [
    {
      id: 'theme',
      title: 'Dark Mode',
      icon: mode === 'dark' ? 'moon' : 'sunny',
      onPress: toggleTheme,
      hasSwitch: true,
      switchValue: mode === 'dark',
    },
  ];

  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <ModernHeader />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
              <Text style={styles.avatarText}>
                {user?.name?.charAt(0)?.toUpperCase() || 'D'}
              </Text>
            </View>
          </View>
          
          <Text style={[styles.userName, { color: colors.text }]}>
            {user?.name || 'Driver Name'}
          </Text>
          <Text style={[styles.userRole, { color: colors.textSecondary }]}>
            {user?.role?.toUpperCase() || 'DRIVER'}
          </Text>
          
          {user?.email && (
            <Text style={[styles.userEmail, { color: colors.textSecondary }]}>
              {user.email}
            </Text>
          )}
        </View>

        {/* Driver Stats Summary */}
        <View style={[styles.statsCard, { backgroundColor: colors.cardBackground }]}>
          <Text style={[styles.statsTitle, { color: colors.text }]}>Performance Summary</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.primary }]}>
                {loading ? '...' : (stats?.totalPickups || stats?.completedPickups || 0)}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Pickups</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.success }]}>
                {loading ? '...' : (stats?.successRate || '95%')}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Success Rate</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.warning }]}>
                {loading ? '...' : (stats?.rating || '4.8')}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Rating</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.secondary }]}>
                {loading ? '...' : (stats?.totalRoutes || 0)}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Routes</Text>
            </View>
          </View>
        </View>

        {/* Menu Items */}
        <View style={[styles.menuCard, { backgroundColor: colors.cardBackground }]}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.menuItem,
                index < menuItems.length - 1 && { borderBottomColor: colors.border }
              ]}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <Ionicons name={item.icon as any} size={24} color={colors.textSecondary} />
                <Text style={[styles.menuItemText, { color: colors.text }]}>
                  {item.title}
                </Text>
              </View>
              
              {item.hasSwitch ? (
                <View style={[
                  styles.switch,
                  { backgroundColor: item.switchValue ? colors.primary : colors.border }
                ]}>
                  <View style={[
                    styles.switchThumb,
                    {
                      backgroundColor: 'white',
                      transform: [{ translateX: item.switchValue ? 16 : 0 }]
                    }
                  ]} />
                </View>
              ) : (
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: colors.error }]}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out" size={24} color="white" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userRole: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 8,
  },
  userEmail: {
    fontSize: 16,
  },
  statsCard: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  menuCard: {
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemText: {
    fontSize: 16,
    marginLeft: 16,
    fontWeight: '500',
  },
  switch: {
    width: 48,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  switchThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 100,
  },
  logoutText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
  },
});
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../shared/context/ThemeContext';

interface StatusCardProps {
  driverStatus?: 'active' | 'inactive' | 'on-route';
  activeRoute?: string;
  loading?: boolean;
  showActiveRoute?: boolean;
}

export const StatusCard: React.FC<StatusCardProps> = ({
  driverStatus = 'active',
  activeRoute = 'No active route',
  loading = false,
  showActiveRoute = false
}) => {
  const { colors } = useTheme();
  
  const styles = createStyles(colors);

  const getStatusColor = () => {
    switch (driverStatus) {
      case 'active': return colors.success;
      case 'on-route': return colors.warning;
      default: return colors.textSecondary;
    }
  };

  const getStatusText = () => {
    if (showActiveRoute) {
      return 'Active Route';
    }
    switch (driverStatus) {
      case 'active': return 'Available for Pickups';
      case 'on-route': return 'Currently on Route';
      default: return 'Offline';
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.statusContainer}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
          <Text style={styles.statusText}>{getStatusText()}</Text>
        </View>
      </View>

      {!showActiveRoute && (
        <View style={styles.content}>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Active Route</Text>
            <Text style={styles.routeValue}>
              {loading ? 'Loading...' : activeRoute}
            </Text>
          </View>
        </View>
      )}
      
      {showActiveRoute && (
        <View style={styles.content}>
          <Text style={styles.routeDisplayValue}>
            {loading ? 'Loading...' : activeRoute}
          </Text>
        </View>
      )}
    </View>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 20,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  content: {
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  routeValue: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  routeDisplayValue: {
    fontSize: 18,
    color: colors.primary,
    fontWeight: '600',
    textAlign: 'center',
  },
});
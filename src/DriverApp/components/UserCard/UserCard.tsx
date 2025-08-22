import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../shared/styles/theme';

interface UserCardProps {
  user: {
    _id?: string;
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    status?: string;
    pickUpDay?: string;
    route?: string;
  };
  onPress?: () => void;
  showActions?: boolean;
}

export const UserCard: React.FC<UserCardProps> = ({ 
  user, 
  onPress, 
  showActions = false 
}) => {
  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'picked':
      case 'completed':
        return theme.colors.success;
      case 'unpicked':
      case 'pending':
        return theme.colors.warning;
      case 'not_yet_marked':
      case 'not marked':
        return theme.colors.error;
      default:
        return theme.colors.secondary;
    }
  };

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.header}>
        <Text style={styles.name}>
          {user.name || 'Unknown User'}
        </Text>
        {user.status && (
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(user.status) }]}>
            <Text style={styles.statusText}>
              {user.status.replace('_', ' ').toUpperCase()}
            </Text>
          </View>
        )}
      </View>
      
      <View style={styles.details}>
        {user.email && (
          <View style={styles.detailRow}>
            <Ionicons name="mail" size={16} color={theme.colors.textSecondary} />
            <Text style={styles.detailText}>{user.email}</Text>
          </View>
        )}
        {user.phone && (
          <View style={styles.detailRow}>
            <Ionicons name="call" size={16} color={theme.colors.textSecondary} />
            <Text style={styles.detailText}>{user.phone}</Text>
          </View>
        )}
        {user.address && (
          <View style={styles.detailRow}>
            <Ionicons name="location" size={16} color={theme.colors.textSecondary} />
            <Text style={styles.detailText}>{user.address}</Text>
          </View>
        )}
        {user.pickUpDay && (
          <View style={styles.detailRow}>
            <Ionicons name="calendar" size={16} color={theme.colors.textSecondary} />
            <Text style={styles.detailText}>{user.pickUpDay}</Text>
          </View>
        )}
        {user.route && (
          <View style={styles.detailRow}>
            <Ionicons name="navigate" size={16} color={theme.colors.textSecondary} />
            <Text style={styles.detailText}>Route: {user.route}</Text>
          </View>
        )}
      </View>

      {showActions && (
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionText}>Mark as Picked</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginVertical: 6,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  details: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    lineHeight: 20,
  },
  actions: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
  },
  actionButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  actionText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});
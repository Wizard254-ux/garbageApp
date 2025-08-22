import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { Button } from '../../../shared/components';
import { PickupRecord } from '../../../shared/types';
import { theme } from '../../../shared/styles/theme';

interface PickupCardProps {
  pickup: PickupRecord;
  onMarkPicked: (pickupId: string, notes?: string) => Promise<void>;
}

export const PickupCard: React.FC<PickupCardProps> = ({ pickup, onMarkPicked }) => {
  const [loading, setLoading] = useState(false);

  const handleMarkPicked = async () => {
    setLoading(true);
    try {
      await onMarkPicked(pickup._id, 'Collected successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to mark pickup as collected');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.date}>{new Date(pickup.date).toLocaleDateString()}</Text>
        <View style={[
          styles.status,
          { backgroundColor: pickup.isPicked ? theme.colors.success : theme.colors.warning }
        ]}>
          <Text style={styles.statusText}>
            {pickup.isPicked ? 'Collected' : 'Pending'}
          </Text>
        </View>
      </View>
      
      <Text style={styles.userId}>User ID: {pickup.user_id}</Text>
      
      {pickup.notes && (
        <Text style={styles.notes}>Notes: {pickup.notes}</Text>
      )}
      
      {!pickup.isPicked && (
        <Button
          title="Mark as Collected"
          onPress={handleMarkPicked}
          loading={loading}
          variant="primary"
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  date: {
    ...theme.typography.h3,
    color: theme.colors.text,
  },
  status: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  statusText: {
    ...theme.typography.caption,
    color: '#fff',
    fontWeight: '600',
  },
  userId: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  notes: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
    fontStyle: 'italic',
  },
});
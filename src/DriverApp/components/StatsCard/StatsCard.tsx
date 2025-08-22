import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../../shared/styles/theme';

interface StatsCardProps {
  title: string;
  value: number;
  color: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({ title, value, color }) => {
  return (
    <View style={[styles.card, { borderLeftColor: color }]}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderLeftWidth: 4,
    width: '48%',
    marginBottom: theme.spacing.md,
  },
  value: {
    ...theme.typography.h1,
    color: theme.colors.text,
    fontWeight: 'bold',
  },
  title: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
});
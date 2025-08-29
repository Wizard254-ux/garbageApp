import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../../shared/context/ThemeContext';

interface BagStatsCardProps {
  allocated: number;
  used: number;
  available: number;
  onTransferPress?: () => void;
  loading?: boolean;
}

export const BagStatsCard: React.FC<BagStatsCardProps> = ({
  allocated,
  used,
  available,
  onTransferPress,
  loading = false,
}) => {
  const { colors } = useTheme();
  
  return (
    <View style={[styles.container, { backgroundColor: colors.cardBackground }]}>
      <View style={styles.header}>
        <MaterialIcons name="shopping-bag" size={24} color={colors.primary} />
        <Text style={[styles.title, { color: colors.text }]}>Bag Inventory</Text>
      </View>
      
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.primary }]}>{allocated}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Allocated</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.warning }]}>{used}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Used</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.success }]}>{available}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Available</Text>
        </View>
      </View>

      {onTransferPress && (
        <TouchableOpacity 
          style={[styles.transferButton, { backgroundColor: colors.primary }]} 
          onPress={onTransferPress}
          disabled={loading || available === 0}
        >
          <MaterialIcons name="swap-horiz" size={20} color="white" />
          <Text style={styles.transferButtonText}>Transfer Bags</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  transferButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  transferButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 8,
  },
});
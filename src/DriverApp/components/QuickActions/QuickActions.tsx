import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../shared/context/ThemeContext';

interface QuickActionsProps {
  onSortedClientsPress?: () => void;
  onNotSortedClientsPress?: () => void;
  sortedCount?: number;
  notSortedCount?: number;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  onSortedClientsPress,
  onNotSortedClientsPress,
  sortedCount = 0,
  notSortedCount = 0
}) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Quick Access</Text>
      
      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.sortedButton]}
          onPress={onSortedClientsPress}
          activeOpacity={0.8}
        >
          <View style={styles.buttonContent}>
            <Ionicons name="checkmark-circle" size={24} color="white" />
            <View style={styles.buttonTextContainer}>
              <Text style={styles.buttonTitle}>Sorted Clients</Text>
              <Text style={styles.buttonSubtitle}>{sortedCount} clients</Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.notSortedButton]}
          onPress={onNotSortedClientsPress}
          activeOpacity={0.8}
        >
          <View style={styles.buttonContent}>
            <Ionicons name="close-circle" size={24} color="white" />
            <View style={styles.buttonTextContainer}>
              <Text style={styles.buttonTitle}>Not Sorted Clients</Text>
              <Text style={styles.buttonSubtitle}>{notSortedCount} clients</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 100, // Space for bottom tab bar
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  buttonsContainer: {
    gap: 12,
  },
  actionButton: {
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sortedButton: {
    backgroundColor: colors.success,
  },
  notSortedButton: {
    backgroundColor: colors.error,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  buttonTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  buttonSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
});
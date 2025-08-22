import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../shared/context/ThemeContext';

interface ActionButton {
  id: string;
  title: string;
  icon: string;
  color: string;
  onPress: () => void;
}

interface ActionButtonsProps {
  onCompletePickup?: () => void;
  onViewPending?: () => void;
  onRegisterClient?: () => void;
  onSelectRoute?: () => void;
  totalRoutes?: number;
  pendingPickups?: number;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  onCompletePickup,
  onViewPending,
  onRegisterClient,
  onSelectRoute,
  totalRoutes = 0,
  pendingPickups = 0
}) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  
  // Get current week info
  const getCurrentWeekInfo = () => {
    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    const formatDate = (date: Date) => {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };
    
    return {
      weekRange: `${formatDate(startOfWeek)} - ${formatDate(endOfWeek)}`,
      weekNumber: Math.ceil(((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / 86400000 + 1) / 7)
    };
  };
  
  const weekInfo = getCurrentWeekInfo();

  const buttons: ActionButton[] = [
    {
      id: 'complete-pickup',
      title: 'COMPLETE PICKUP',
      icon: 'checkmark-circle',
      color: '#3B82F6',
      onPress: onCompletePickup || (() => {})
    },
    {
      id: 'view-pending',
      title: 'VIEW PENDING',
      icon: 'time',
      color: '#F59E0B',
      onPress: onViewPending || (() => {})
    },
    {
      id: 'select-route',
      title: 'SELECT ROUTE',
      icon: 'navigate',
      color: '#10B981',
      onPress: onSelectRoute || (() => {})
    },
    {
      id: 'register-client',
      title: 'REGISTER CLIENT',
      icon: 'person-add',
      color: '#8B5CF6',
      onPress: onRegisterClient || (() => {})
    }
  ];

  return (
    <View style={styles.container}>
      {/* Week Indicator */}
      <View style={styles.weekIndicator}>
        <View style={styles.weekHeader}>
          <Ionicons name="calendar-outline" size={20} color={colors.primary} />
          <Text style={styles.weekTitle}>Available Pickups</Text>
        </View>
        <View style={styles.weekInfo}>
          <Text style={styles.weekRange}>Week {weekInfo.weekNumber}</Text>
          <Text style={styles.weekDates}>{weekInfo.weekRange}</Text>
        </View>
        <View style={styles.pickupCount}>
          <Text style={styles.pickupCountNumber}>{pendingPickups}</Text>
          <Text style={styles.pickupCountLabel}>Pending</Text>
        </View>
      </View>
      
      <View style={styles.grid}>
        {buttons.map((button) => (
          <TouchableOpacity
            key={button.id}
            style={styles.buttonContainer}
            onPress={button.onPress}
            activeOpacity={0.7}
          >
            <View style={[styles.button, { backgroundColor: button.color }]}>
              <Ionicons name={button.icon as any} size={32} color="white" />
              {button.id === 'select-route' && totalRoutes > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{totalRoutes}</Text>
                </View>
              )}
            </View>
            <Text style={styles.buttonLabel}>{button.title}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  weekIndicator: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  weekHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  weekTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  weekInfo: {
    alignItems: 'center',
    flex: 1,
  },
  weekRange: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  weekDates: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  pickupCount: {
    alignItems: 'center',
    flex: 1,
  },
  pickupCountNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.warning,
  },
  pickupCountLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  buttonContainer: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 16,
  },
  button: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 16,
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
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
  onRegisterClient?: () => void;
  onSelectRoute?: () => void;
  activeRoute?: string;
  availablePickups?: number;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  onRegisterClient,
  onSelectRoute,
  activeRoute = "No active route",
  availablePickups = 0
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
      id: 'select-route',
      title: 'ROUTE',
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
  routeIndicator: {
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
  routeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  routeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  routeInfo: {
    alignItems: 'center',
    flex: 2,
  },
  routeName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    textAlign: 'center',
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
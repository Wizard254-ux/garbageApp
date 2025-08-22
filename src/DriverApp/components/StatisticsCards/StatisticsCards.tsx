import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../shared/context/ThemeContext';

interface StatData {
  icon: string;
  value: number;
  label: string;
  color: string;
}

interface StatisticsCardsProps {
  completedPickups?: number;
  pendingPickups?: number;
  todayPickups?: number;
  totalRoutes?: number;
  onSeeAll?: () => void;
}

export const StatisticsCards: React.FC<StatisticsCardsProps> = ({
  completedPickups = 5,
  pendingPickups = 7,
  todayPickups = 5,
  totalRoutes = 9,
  onSeeAll
}) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const stats: StatData[] = [
    {
      icon: 'checkmark-circle',
      value: completedPickups,
      label: 'Completed Pickups',
      color: colors.success
    },
    {
      icon: 'time',
      value: pendingPickups,
      label: 'Pending Pickups', 
      color: colors.warning
    },
    {
      icon: 'calendar',
      value: todayPickups,
      label: "Today's Pickups",
      color: colors.primary
    }
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>DRIVER STATISTICS</Text>
        {/*<TouchableOpacity onPress={onSeeAll}>*/}
        {/*  <Text style={styles.seeAllText}></Text>*/}
        {/*</TouchableOpacity>*/}
      </View>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {stats.map((stat, index) => (
          <View key={index} style={styles.statCard}>
            <View style={[styles.iconContainer, { backgroundColor: `${stat.color}15` }]}>
              <Ionicons name={stat.icon as any} size={24} color={stat.color} />
            </View>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    // paddingVertical: 16,
    // // paddingBottom:16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    letterSpacing: 0.5,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 16,
  },
  statCard: {
    backgroundColor: colors.cardBackground,
    marginBottom: 14,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    width: 100,
    height: 85,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    lineHeight: 12,
  },
});
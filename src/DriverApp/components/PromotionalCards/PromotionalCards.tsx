import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../shared/context/ThemeContext';

interface PromoCard {
  id: string;
  title: string;
  description: string;
  icon: string;
  gradient: string[];
}

interface PromotionalCardsProps {
  onCardPress?: (cardId: string) => void;
}

export const PromotionalCards: React.FC<PromotionalCardsProps> = ({
  onCardPress
}) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const promoCards: PromoCard[] = [
    {
      id: 'safety-tips',
      title: 'Safety First!',
      description: 'Follow safety protocols for efficient pickups',
      icon: 'shield-checkmark',
      gradient: ['#10B981', '#059669']
    },
    {
      id: 'performance',
      title: 'Great Performance!',
      description: 'You completed 95% of routes this week',
      icon: 'trophy',
      gradient: ['#3B82F6', '#2563EB']
    },
    {
      id: 'route-optimization',
      title: 'Route Optimization',
      description: 'New AI-powered route suggestions available',
      icon: 'map',
      gradient: ['#8B5CF6', '#7C3AED']
    }
  ];

  const [currentIndex, setCurrentIndex] = React.useState(0);

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={(event) => {
          const slideSize = event.nativeEvent.layoutMeasurement.width - 40;
          const index = Math.round(event.nativeEvent.contentOffset.x / slideSize);
          setCurrentIndex(index);
        }}
        scrollEventThrottle={200}
      >
        {promoCards.map((card) => (
          <TouchableOpacity
            key={card.id}
            style={[styles.card, { backgroundColor: card.gradient[0] }]}
            onPress={() => onCardPress?.(card.id)}
            activeOpacity={0.9}
          >
            <View style={styles.cardContent}>
              <View style={styles.iconContainer}>
                <Ionicons name={card.icon as any} size={32} color="white" />
              </View>
              <View style={styles.textContainer}>
                <Text style={styles.cardTitle}>{card.title}</Text>
                <Text style={styles.cardDescription}>{card.description}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      <View style={styles.pagination}>
        {promoCards.map((_, index) => (
          <View
            key={index}
            style={[
              styles.paginationDot,
              index === currentIndex && styles.paginationDotActive
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    paddingVertical: 16,
  },
  card: {
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 20,
    width: 320,
    height: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 20,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    gap: 8,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.textSecondary,
    opacity: 0.5,
  },
  paginationDotActive: {
    backgroundColor: colors.primary,
    opacity: 1,
  },
});
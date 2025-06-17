import React from 'react';
import { StyleSheet, View, Pressable, Dimensions } from 'react-native';
import { CreditCard as CreditCardType } from '@/types';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  interpolate 
} from 'react-native-reanimated';
import Text from '@/components/ui/Text';
import { useTheme } from '@/context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { CreditCard as CreditCardIcon } from 'lucide-react-native';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.85;
const CARD_HEIGHT = CARD_WIDTH * 0.6; // Standard credit card aspect ratio

interface CreditCardItemProps {
  card: CreditCardType;
  onPress?: (card: CreditCardType) => void;
}

const CreditCardItem: React.FC<CreditCardItemProps> = ({ card, onPress }) => {
  const { colors } = useTheme();
  const rotation = useSharedValue(0);
  
  // Flip card animation
  const frontAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          rotateY: `${interpolate(rotation.value, [0, 1], [0, 180])}deg`,
        },
      ],
      backfaceVisibility: 'hidden',
    };
  });
  
  const backAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          rotateY: `${interpolate(rotation.value, [0, 1], [180, 360])}deg`,
        },
      ],
      backfaceVisibility: 'hidden',
    };
  });
  
  const handlePress = () => {
    // Animate card flip
    rotation.value = withSpring(rotation.value ? 0 : 1, { damping: 20, stiffness: 100 });
    
    // Trigger onPress after animation
    if (onPress) {
      setTimeout(() => onPress(card), 300);
    }
  };

  // Get card background colors based on issuer
  const getCardGradient = () => {
    switch(card.issuer.toLowerCase()) {
      case 'chase':
        return ['#1E3B70', '#29539B'];
      case 'amex':
        return ['#108A00', '#0A5F00'];
      case 'discover':
        return ['#F37021', '#F89E1B'];
      case 'citi':
        return ['#003B70', '#056DAE'];
      case 'capital one':
        return ['#C01F2F', '#FF0000'];
      default:
        return [card.color, card.color + '99'];
    }
  };

  // Get logo by network
  const getNetworkIcon = () => {
    return <CreditCardIcon size={24} color="#FFFFFF" />;
  };

  return (
    <Pressable onPress={handlePress} style={styles.container}>
      {/* Front of Card */}
      <Animated.View style={[styles.cardFace, frontAnimatedStyle]}>
        <LinearGradient
          colors={getCardGradient()}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardGradient}
        >
          <View style={styles.cardContent}>
            <View style={styles.cardTop}>
              <Text variant="caption" color="#FFFFFF" style={styles.issuerName}>
                {card.issuer.toUpperCase()}
              </Text>
              <View style={styles.cardLogo}>
                {getNetworkIcon()}
              </View>
            </View>

            <View style={styles.cardNumber}>
              <Text color="#FFFFFF" style={styles.cardNumberDots}>
                •••• •••• •••• {card.lastFourDigits}
              </Text>
            </View>

            <View style={styles.cardBottom}>
              <View>
                <Text variant="caption" color="#FFFFFF99">
                  CARD HOLDER
                </Text>
                <Text color="#FFFFFF" medium>
                  {card.cardholderName}
                </Text>
              </View>
              <View>
                <Text variant="caption" color="#FFFFFF99">
                  EXPIRES
                </Text>
                <Text color="#FFFFFF" medium>
                  {card.expiryMonth.toString().padStart(2, '0')}/{card.expiryYear.toString().slice(-2)}
                </Text>
              </View>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Back of Card */}
      <Animated.View style={[styles.cardFace, styles.cardBack, backAnimatedStyle]}>
        <LinearGradient
          colors={getCardGradient()}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardGradient}
        >
          <View style={styles.cardContent}>
            <View style={styles.magneticStrip} />
            
            <View style={styles.rewardsContainer}>
              <Text variant="caption" color="#FFFFFF" bold>
                REWARDS
              </Text>
              {card.rewards.slice(0, 3).map((reward, index) => (
                <Text key={index} variant="caption" color="#FFFFFF" style={styles.rewardText}>
                  {reward.category.name}: {reward.rate}% {reward.type}
                </Text>
              ))}
            </View>

            <View style={styles.cardBalance}>
              <View>
                <Text variant="caption" color="#FFFFFF99">
                  BALANCE
                </Text>
                <Text color="#FFFFFF" medium>
                  ${card.balance.toLocaleString()}
                </Text>
              </View>
              <View>
                <Text variant="caption" color="#FFFFFF99">
                  LIMIT
                </Text>
                <Text color="#FFFFFF" medium>
                  ${card.limit.toLocaleString()}
                </Text>
              </View>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    marginVertical: 10,
    borderRadius: 12,
    perspective: 800,
  },
  cardFace: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    borderRadius: 12,
    overflow: 'hidden',
  },
  cardBack: {
    transform: [{ rotateY: '180deg' }],
  },
  cardGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  cardContent: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  issuerName: {
    fontSize: 16,
    letterSpacing: 1,
  },
  cardLogo: {
    width: 50,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardNumber: {
    marginVertical: 20,
  },
  cardNumberDots: {
    letterSpacing: 2,
    fontSize: 18,
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  magneticStrip: {
    height: 40,
    backgroundColor: '#000',
    marginLeft: -20,
    marginRight: -20,
    marginTop: -20,
    marginBottom: 20,
  },
  rewardsContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  rewardText: {
    marginTop: 5,
  },
  cardBalance: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
});

export default CreditCardItem;
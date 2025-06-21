import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useCallStateHooks } from '@stream-io/video-react-native-sdk';
import { useColorScheme } from '@/lib/useColorScheme';

interface NetworkStatusIndicatorProps {
  className?: string;
}

const NetworkQualityColors = {
  excellent: '#00FF00',
  good: '#00CC00',
  fair: '#FFFF00',
  poor: '#FF0000',
} as const;

const NetworkQualityLabels = {
  excellent: 'Excellent',
  good: 'Good',
  fair: 'Fair',
  poor: 'Poor',
} as const;

export const NetworkStatusIndicator: React.FC<NetworkStatusIndicatorProps> = ({ className }) => {
  const { isDarkColorScheme } = useColorScheme();
  const { useCallNetworkState } = useCallStateHooks();
  const networkState = useCallNetworkState();

  const getNetworkQuality = () => {
    const latency = networkState.latency || 0;
    const packetLoss = networkState.packetLoss || 0;

    if (latency < 100 && packetLoss < 1) return 'excellent';
    if (latency < 200 && packetLoss < 5) return 'good';
    if (latency < 500 && packetLoss < 10) return 'fair';
    return 'poor';
  };

  const quality = getNetworkQuality();
  const color = NetworkQualityColors[quality];
  const label = NetworkQualityLabels[quality];

  return (
    <View className={`absolute top-4 right-4 z-50 ${className}`} style={styles.container}>
      <View style={[styles.barContainer, { backgroundColor: color }]}>
        <View style={styles.bar} />
      </View>
      <Text style={[styles.label, { color }]}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  barContainer: {
    width: 24,
    height: 16,
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: 8,
  },
  bar: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
  },
});

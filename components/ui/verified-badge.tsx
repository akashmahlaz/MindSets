import { Badge } from '@/components/ui/badge';
import React from 'react';
import { Text, View } from 'react-native';

interface VerifiedBadgeProps {
  verificationStatus?: 'pending' | 'verified' | 'rejected';
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({
  verificationStatus,
  size = 'md',
  showText = true,
  className = ''
}) => {
  if (verificationStatus !== 'verified') {
    return null;
  }

  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-xs',
    md: 'px-2 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base'
  };

  return (
    <Badge 
      className={`bg-blue-500 text-white ${sizeClasses[size]} ${className}`}
      variant="secondary"
    >
      {showText ? (
        <View className="flex-row items-center space-x-1">
          <Text className="text-white">✓</Text>
          <Text className="text-white">Verified</Text>
        </View>
      ) : (
        <Text className="text-white">✓</Text>
      )}
    </Badge>
  );
};

export const CounsellorVerificationStatus: React.FC<{
  verificationStatus?: 'pending' | 'verified' | 'rejected';
  size?: 'sm' | 'md' | 'lg';
}> = ({ verificationStatus, size = 'md' }) => {
  if (!verificationStatus) return null;

  const statusConfig = {
    pending: {
      color: 'bg-yellow-500',
      text: 'Pending Review',
      icon: '⏳'
    },
    verified: {
      color: 'bg-green-500',
      text: 'Verified',
      icon: '✓'
    },
    rejected: {
      color: 'bg-red-500',
      text: 'Needs Review',
      icon: '⚠️'
    }
  };

  const config = statusConfig[verificationStatus];
  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-xs',
    md: 'px-2 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base'
  };

  return (
    <Badge className={`${config.color} text-white ${sizeClasses[size]}`}>
      <View className="flex-row items-center space-x-1">
        <Text className="text-white">{config.icon}</Text>
        <Text className="text-white">{config.text}</Text>
      </View>
    </Badge>
  );
};

export default VerifiedBadge;

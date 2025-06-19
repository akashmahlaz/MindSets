import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import { useColorScheme } from '@/lib/useColorScheme';
import { MENTAL_HEALTH_CONCERNS, UserProfileData } from '@/types/user';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StatusBar, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface UserSignUpData {
  // Basic info
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  age: number;
profession?: string;
  location?: string;
    occupation?: string;
    childhoodExperience?: string;
    problemsYouFacing?: string;




  // Mental health info
  primaryConcerns: string[];
  severityLevel: 'mild' | 'moderate' | 'severe' | '';
  previousTherapy: boolean | null;
  
  // Preferences
  preferredCounsellorGender: 'male' | 'female' | 'no-preference';
  preferredSessionType: 'video' | 'audio' | 'chat' | 'any';
  
  // Emergency contact
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelation: string;
}

export default function UserSignUpScreen() {
  const router = useRouter();
  const { signUpEnhanced } = useAuth();
  const params = useLocalSearchParams();
  const { isDarkColorScheme } = useColorScheme();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<UserSignUpData>({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    age: 0,
    primaryConcerns: [],
    severityLevel: '',
    previousTherapy: null,
    preferredCounsellorGender: 'no-preference',
    preferredSessionType: 'any',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelation: '',
  });

  const isStep1Valid = formData.email && formData.password && formData.confirmPassword && 
                     formData.firstName && formData.lastName && 
                     formData.password === formData.confirmPassword;
  
  const isStep2Valid = formData.primaryConcerns.length > 0 && formData.severityLevel;
  
  const isStep3Valid = formData.emergencyContactName && formData.emergencyContactPhone && 
                      formData.emergencyContactRelation;

  const handleConcernToggle = (concern: string) => {
    setFormData(prev => ({
      ...prev,
      primaryConcerns: prev.primaryConcerns.includes(concern)
        ? prev.primaryConcerns.filter(c => c !== concern)
        : [...prev.primaryConcerns, concern]
    }));
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      router.back();
    }
  };
  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Create the enhanced profile data
      const profileData: Partial<UserProfileData> = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        displayName: `${formData.firstName} ${formData.lastName}`,
        primaryConcerns: formData.primaryConcerns,
        severityLevel: formData.severityLevel as any,
        previousTherapy: formData.previousTherapy!,
        preferredCounsellorGender: formData.preferredCounsellorGender,
        preferredSessionType: formData.preferredSessionType,
        emergencyContact: {
          name: formData.emergencyContactName,
          phone: formData.emergencyContactPhone,
          relationship: formData.emergencyContactRelation,
        },
      };

      await signUpEnhanced(formData.email, formData.password, profileData, 'user');
      
      Alert.alert(
        'Registration Successful',
        'Welcome to MindConnect! Your account has been created.',
        [{ text: 'OK', onPress: () => router.replace('/(main)') }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <CardContent className="space-y-4">
      <View className="space-y-2">
        <Label>First Name</Label>
        <Input
          value={formData.firstName}
          onChangeText={(text) => setFormData(prev => ({ ...prev, firstName: text }))}
          placeholder="Enter your first name"
        />
      </View>
      
      <View className="space-y-2">
        <Label>Last Name</Label>
        <Input
          value={formData.lastName}
          onChangeText={(text) => setFormData(prev => ({ ...prev, lastName: text }))}
          placeholder="Enter your last name"
        />
      </View>
      
      <View className="space-y-2">
        <Label>Email</Label>
        <Input
          value={formData.email}
          onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
          placeholder="Enter your email"
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>
      
      <View className="space-y-2">
        <Label>Password</Label>
        <Input
          value={formData.password}
          onChangeText={(text) => setFormData(prev => ({ ...prev, password: text }))}
          placeholder="Create a password"
          secureTextEntry
        />
      </View>
      
      <View className="space-y-2">
        <Label>Confirm Password</Label>
        <Input
          value={formData.confirmPassword}
          onChangeText={(text) => setFormData(prev => ({ ...prev, confirmPassword: text }))}
          placeholder="Confirm your password"
          secureTextEntry
        />
      </View>
      
      {formData.password !== formData.confirmPassword && formData.confirmPassword && (
        <Text className="text-destructive text-sm">Passwords do not match</Text>
      )}
    </CardContent>
  );

  const renderStep2 = () => (
    <CardContent className="space-y-4">
      <View className="space-y-2">
        <Label>What are your primary mental health concerns? (Select all that apply)</Label>
        <View className="flex-row flex-wrap gap-2">
          {MENTAL_HEALTH_CONCERNS.slice(0, 12).map((concern) => (
            <Pressable
              key={concern}
              onPress={() => handleConcernToggle(concern)}
              className={`px-3 py-2 rounded-full border ${
                formData.primaryConcerns.includes(concern)
                  ? 'bg-primary border-primary'
                  : 'bg-background border-border'
              }`}
            >
              <Text className={`text-sm ${
                formData.primaryConcerns.includes(concern)
                  ? 'text-primary-foreground'
                  : 'text-foreground'
              }`}>
                {concern.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
      
      <View className="space-y-2">
        <Label>How would you rate the severity of your concerns?</Label>
        <View className="space-y-2">
          {[
            { value: 'mild', label: 'Mild - Some difficulty but manageable' },
            { value: 'moderate', label: 'Moderate - Noticeable impact on daily life' },
            { value: 'severe', label: 'Severe - Significant impact on daily functioning' }
          ].map((option) => (
            <Pressable
              key={option.value}
              onPress={() => setFormData(prev => ({ ...prev, severityLevel: option.value as any }))}
              className={`p-3 rounded-lg border ${
                formData.severityLevel === option.value
                  ? 'bg-primary/10 border-primary'
                  : 'bg-background border-border'
              }`}
            >
              <Text className="text-foreground">{option.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>
      
      <View className="space-y-2">
        <Label>Have you had therapy or counseling before?</Label>
        <View className="flex-row space-x-4">
          {[
            { value: true, label: 'Yes' },
            { value: false, label: 'No' }
          ].map((option) => (
            <Pressable
              key={option.label}
              onPress={() => setFormData(prev => ({ ...prev, previousTherapy: option.value }))}
              className={`flex-1 p-3 rounded-lg border ${
                formData.previousTherapy === option.value
                  ? 'bg-primary/10 border-primary'
                  : 'bg-background border-border'
              }`}
            >
              <Text className="text-foreground text-center">{option.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </CardContent>
  );

  const renderStep3 = () => (
    <CardContent className="space-y-4">
      <View className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
        <Text className="text-yellow-800 dark:text-yellow-200 text-sm">
          Emergency contact information helps us reach someone if you're in crisis and need immediate support.
        </Text>
      </View>
      
      <View className="space-y-2">
        <Label>Emergency Contact Name</Label>
        <Input
          value={formData.emergencyContactName}
          onChangeText={(text) => setFormData(prev => ({ ...prev, emergencyContactName: text }))}
          placeholder="Full name"
        />
      </View>
      
      <View className="space-y-2">
        <Label>Emergency Contact Phone</Label>
        <Input
          value={formData.emergencyContactPhone}
          onChangeText={(text) => setFormData(prev => ({ ...prev, emergencyContactPhone: text }))}
          placeholder="Phone number"
          keyboardType="phone-pad"
        />
      </View>
      
      <View className="space-y-2">
        <Label>Relationship</Label>
        <Input
          value={formData.emergencyContactRelation}
          onChangeText={(text) => setFormData(prev => ({ ...prev, emergencyContactRelation: text }))}
          placeholder="e.g., Parent, Spouse, Friend"
        />
      </View>
      
      <View className="space-y-2">
        <Label>Preferred Counsellor Gender</Label>
        <View className="space-y-2">
          {[
            { value: 'no-preference', label: 'No preference' },
            { value: 'male', label: 'Male' },
            { value: 'female', label: 'Female' }
          ].map((option) => (
            <Pressable
              key={option.value}
              onPress={() => setFormData(prev => ({ ...prev, preferredCounsellorGender: option.value as any }))}
              className={`p-3 rounded-lg border ${
                formData.preferredCounsellorGender === option.value
                  ? 'bg-primary/10 border-primary'
                  : 'bg-background border-border'
              }`}
            >
              <Text className="text-foreground">{option.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </CardContent>
  );

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <StatusBar 
        barStyle={isDarkColorScheme ? "light-content" : "dark-content"}
        backgroundColor={isDarkColorScheme ? '#0f172a' : '#ffffff'}
      />
      
      <ScrollView className="flex-1 px-6">
        <View className="py-6">
          {/* Progress indicator */}
          <View className="flex-row justify-center mb-6">
            {[1, 2, 3].map((step) => (
              <View key={step} className="flex-row items-center">
                <View
                  className={`w-8 h-8 rounded-full items-center justify-center ${
                    step <= currentStep ? 'bg-primary' : 'bg-muted'
                  }`}
                >
                  <Text className={`text-sm font-medium ${
                    step <= currentStep ? 'text-primary-foreground' : 'text-muted-foreground'
                  }`}>
                    {step}
                  </Text>
                </View>
                {step < 3 && (
                  <View className={`w-12 h-0.5 ${
                    step < currentStep ? 'bg-primary' : 'bg-muted'
                  }`} />
                )}
              </View>
            ))}
          </View>
          
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="text-xl text-center">
                {currentStep === 1 && 'Basic Information'}
                {currentStep === 2 && 'Mental Health Assessment'}
                {currentStep === 3 && 'Safety & Preferences'}
              </CardTitle>
              <CardDescription className="text-center">
                {currentStep === 1 && 'Let\'s start with some basic information about you'}
                {currentStep === 2 && 'Help us understand how we can best support you'}
                {currentStep === 3 && 'Final details to ensure your safety and match you with the right counsellor'}
              </CardDescription>
            </CardHeader>
            
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
            
            <CardContent className="pt-0">
              <View className="flex-row space-x-4">
                <Button variant="outline" onPress={handleBack} className="flex-1">
                  <Text className="text-foreground">
                    {currentStep === 1 ? 'Back' : 'Previous'}
                  </Text>
                </Button>
                
                {currentStep < 3 ? (
                  <Button 
                    onPress={handleNext} 
                    disabled={
                      (currentStep === 1 && !isStep1Valid) ||
                      (currentStep === 2 && !isStep2Valid)
                    }
                    className="flex-1"
                  >
                    <Text className="text-primary-foreground">Next</Text>
                  </Button>
                ) : (
                  <Button 
                    onPress={handleSubmit} 
                    disabled={!isStep3Valid || loading}
                    className="flex-1"
                  >
                    <Text className="text-primary-foreground">
                      {loading ? 'Creating Account...' : 'Create Account'}
                    </Text>
                  </Button>
                )}
              </View>
            </CardContent>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

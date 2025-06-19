import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import { useColorScheme } from '@/lib/useColorScheme';
import { LICENSE_TYPES, MENTAL_HEALTH_CONCERNS, THERAPY_APPROACHES, CounsellorProfileData } from '@/types/user';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StatusBar, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface CounsellorSignUpData {
  // Basic info
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  
  // Professional info
  licenseNumber: string;
  licenseType: string;
  yearsExperience: string;
  
  // Specializations
  specializations: string[];
  approaches: string[];
  ageGroups: string[];
  
  // Availability
  hourlyRate: string;
  maxClientsPerWeek: string;
  languages: string[];
}

export default function CounsellorSignUpScreen() {
  const router = useRouter();
  const { signUpEnhanced } = useAuth();
  const { isDarkColorScheme } = useColorScheme();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CounsellorSignUpData>({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    licenseNumber: '',
    licenseType: '',
    yearsExperience: '',
    specializations: [],
    approaches: [],
    ageGroups: [],
    hourlyRate: '',
    maxClientsPerWeek: '',
    languages: ['English'],
  });

  const isStep1Valid = formData.email && formData.password && formData.confirmPassword && 
                     formData.firstName && formData.lastName && 
                     formData.password === formData.confirmPassword;
  
  const isStep2Valid = formData.licenseNumber && formData.licenseType && formData.yearsExperience;
  
  const isStep3Valid = formData.specializations.length > 0 && formData.approaches.length > 0;
  const handleArrayToggle = (array: string[], value: string, field: keyof CounsellorSignUpData) => {
    setFormData(prev => ({
      ...prev,
      [field]: array.includes(value) 
        ? array.filter(item => item !== value)
        : [...array, value]
    }));
  };

  const handleSpecializationToggle = (specialization: string) => {
    setFormData(prev => ({
      ...prev,
      specializations: prev.specializations.includes(specialization)
        ? prev.specializations.filter(s => s !== specialization)
        : [...prev.specializations, specialization]
    }));
  };

  const handleApproachToggle = (approach: string) => {
    setFormData(prev => ({
      ...prev,
      approaches: prev.approaches.includes(approach)
        ? prev.approaches.filter(a => a !== approach)
        : [...prev.approaches, approach]
    }));
  };

  const handleAgeGroupToggle = (ageGroup: string) => {
    setFormData(prev => ({
      ...prev,
      ageGroups: prev.ageGroups.includes(ageGroup)
        ? prev.ageGroups.filter(ag => ag !== ageGroup)
        : [...prev.ageGroups, ageGroup]
    }));
  };

  const handleNext = () => {
    if (currentStep < 4) {
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
      // Create the enhanced profile data for counsellor
      const profileData: Partial<CounsellorProfileData> = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        displayName: `Dr. ${formData.firstName} ${formData.lastName}`,
        licenseNumber: formData.licenseNumber,
        licenseType: formData.licenseType,
        yearsExperience: parseInt(formData.yearsExperience),
        specializations: formData.specializations,
        approaches: formData.approaches,
        ageGroups: formData.ageGroups,
        hourlyRate: parseFloat(formData.hourlyRate) || undefined,
        maxClientsPerWeek: parseInt(formData.maxClientsPerWeek) || undefined,
        languages: formData.languages,
        acceptsNewClients: true,
        verificationStatus: 'pending',
        availableHours: {
          timezone: 'UTC', // Default timezone, can be updated later
        },
      };

      await signUpEnhanced(formData.email, formData.password, profileData, 'counsellor');
      
      Alert.alert(
        'Application Submitted',
        'Thank you for applying to join MindConnect as a counsellor. Your application is under review and we\'ll contact you within 3-5 business days.',
        [{ text: 'OK', onPress: () => router.replace('/(auth)/sign-in') }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit application. Please try again.');
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
        <Label>Professional Email</Label>
        <Input
          value={formData.email}
          onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
          placeholder="Enter your professional email"
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>
      
      <View className="space-y-2">
        <Label>Password</Label>
        <Input
          value={formData.password}
          onChangeText={(text) => setFormData(prev => ({ ...prev, password: text }))}
          placeholder="Create a secure password"
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
      <View className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
        <Text className="text-blue-800 dark:text-blue-200 text-sm">
          Professional credentials will be verified before your account is approved.
        </Text>
      </View>
      
      <View className="space-y-2">
        <Label>License Number</Label>
        <Input
          value={formData.licenseNumber}
          onChangeText={(text) => setFormData(prev => ({ ...prev, licenseNumber: text }))}
          placeholder="Enter your license number"
        />
      </View>
      
      <View className="space-y-2">
        <Label>License Type</Label>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="max-h-32">
          <View className="flex-row space-x-2">
            {LICENSE_TYPES.map((license) => (
              <Pressable
                key={license}
                onPress={() => setFormData(prev => ({ ...prev, licenseType: license }))}
                className={`px-3 py-2 rounded-lg border min-w-max ${
                  formData.licenseType === license
                    ? 'bg-primary border-primary'
                    : 'bg-background border-border'
                }`}
              >
                <Text className={`text-sm whitespace-nowrap ${
                  formData.licenseType === license
                    ? 'text-primary-foreground'
                    : 'text-foreground'
                }`}>
                  {license}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>
      
      <View className="space-y-2">
        <Label>Years of Experience</Label>
        <Input
          value={formData.yearsExperience}
          onChangeText={(text) => setFormData(prev => ({ ...prev, yearsExperience: text }))}
          placeholder="e.g., 5"
          keyboardType="numeric"
        />
      </View>
    </CardContent>
  );

  const renderStep3 = () => (
    <CardContent className="space-y-4">
      <View className="space-y-2">
        <Label>Specializations (Select all that apply)</Label>
        <View className="flex-row flex-wrap gap-2">
          {MENTAL_HEALTH_CONCERNS.slice(0, 15).map((specialization) => (
            <Pressable
              key={specialization}
              onPress={() => handleSpecializationToggle(specialization)}
              className={`px-3 py-2 rounded-full border ${
                formData.specializations.includes(specialization)
                  ? 'bg-primary border-primary'
                  : 'bg-background border-border'
              }`}
            >
              <Text className={`text-sm ${
                formData.specializations.includes(specialization)
                  ? 'text-primary-foreground'
                  : 'text-foreground'
              }`}>
                {specialization.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
      
      <View className="space-y-2">
        <Label>Therapy Approaches</Label>
        <View className="flex-row flex-wrap gap-2">
          {THERAPY_APPROACHES.slice(0, 10).map((approach) => (
            <Pressable
              key={approach}
              onPress={() => handleApproachToggle(approach)}
              className={`px-3 py-2 rounded-full border ${
                formData.approaches.includes(approach)
                  ? 'bg-primary border-primary'
                  : 'bg-background border-border'
              }`}
            >
              <Text className={`text-sm ${
                formData.approaches.includes(approach)
                  ? 'text-primary-foreground'
                  : 'text-foreground'
              }`}>
                {approach}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
      
      <View className="space-y-2">
        <Label>Age Groups You Work With</Label>
        <View className="flex-row flex-wrap gap-2">
          {['Children (5-12)', 'Teens (13-17)', 'Young Adults (18-25)', 'Adults (26-64)', 'Seniors (65+)'].map((ageGroup) => (
            <Pressable
              key={ageGroup}
              onPress={() => handleAgeGroupToggle(ageGroup)}
              className={`px-3 py-2 rounded-full border ${
                formData.ageGroups.includes(ageGroup)
                  ? 'bg-primary border-primary'
                  : 'bg-background border-border'
              }`}
            >
              <Text className={`text-sm ${
                formData.ageGroups.includes(ageGroup)
                  ? 'text-primary-foreground'
                  : 'text-foreground'
              }`}>
                {ageGroup}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </CardContent>
  );

  const renderStep4 = () => (
    <CardContent className="space-y-4">
      <View className="space-y-2">
        <Label>Hourly Rate (USD)</Label>
        <Input
          value={formData.hourlyRate}
          onChangeText={(text) => setFormData(prev => ({ ...prev, hourlyRate: text }))}
          placeholder="e.g., 120"
          keyboardType="numeric"
        />
      </View>
      
      <View className="space-y-2">
        <Label>Maximum Clients Per Week</Label>
        <Input
          value={formData.maxClientsPerWeek}
          onChangeText={(text) => setFormData(prev => ({ ...prev, maxClientsPerWeek: text }))}
          placeholder="e.g., 20"
          keyboardType="numeric"
        />
      </View>
      
      <View className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
        <Text className="text-green-800 dark:text-green-200 text-sm font-medium mb-2">
          Application Review Process:
        </Text>
        <Text className="text-green-800 dark:text-green-200 text-sm">
          • Credential verification (1-2 days){'\n'}
          • Background check (2-3 days){'\n'}
          • Platform training (1 day){'\n'}
          • Account activation
        </Text>
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
            {[1, 2, 3, 4].map((step) => (
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
                {step < 4 && (
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
                {currentStep === 1 && 'Personal Information'}
                {currentStep === 2 && 'Professional Credentials'}
                {currentStep === 3 && 'Expertise & Specializations'}
                {currentStep === 4 && 'Practice Details'}
              </CardTitle>
              <CardDescription className="text-center">
                {currentStep === 1 && 'Let\'s start with your basic information'}
                {currentStep === 2 && 'Please provide your professional license information'}
                {currentStep === 3 && 'Tell us about your areas of expertise'}
                {currentStep === 4 && 'Final details about your practice'}
              </CardDescription>
            </CardHeader>
            
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
            {currentStep === 4 && renderStep4()}
            
            <CardContent className="pt-0">
              <View className="flex-row space-x-4">
                <Button variant="outline" onPress={handleBack} className="flex-1">
                  <Text className="text-foreground">
                    {currentStep === 1 ? 'Back' : 'Previous'}
                  </Text>
                </Button>
                
                {currentStep < 4 ? (
                  <Button 
                    onPress={handleNext} 
                    disabled={
                      (currentStep === 1 && !isStep1Valid) ||
                      (currentStep === 2 && !isStep2Valid) ||
                      (currentStep === 3 && !isStep3Valid)
                    }
                    className="flex-1"
                  >
                    <Text className="text-primary-foreground">Next</Text>
                  </Button>
                ) : (
                  <Button 
                    onPress={handleSubmit} 
                    disabled={loading}
                    className="flex-1"
                  >
                    <Text className="text-primary-foreground">
                      {loading ? 'Submitting...' : 'Submit Application'}
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

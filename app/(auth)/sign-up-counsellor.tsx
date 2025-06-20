import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { H2, P } from '@/components/ui/typography';
import { useAuth } from '@/context/AuthContext';
import { useColorScheme } from '@/lib/useColorScheme';
import { CounsellorProfileData, LICENSE_TYPES, MENTAL_HEALTH_CONCERNS, THERAPY_APPROACHES } from '@/types/user';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StatusBar, Text, TouchableWithoutFeedback, View } from 'react-native';
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
  const [error, setError] = useState('');
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
      <H2 className="mb-2">Personal Information</H2>
      <P className="mb-4">Let's start with your basic information.</P>
      <View className="space-y-2">
        <Label className="font-semibold text-base">First Name</Label>
        <Input
          value={formData.firstName}
          onChangeText={(text) => setFormData(prev => ({ ...prev, firstName: text }))}
          placeholder="Enter your first name"
          className="h-12 rounded-lg px-4 bg-background border border-input text-base text-foreground"
          placeholderTextColor="#9CA3AF"
        />
      </View>
      <View className="space-y-2">
        <Label className="font-semibold text-base">Last Name</Label>
        <Input
          value={formData.lastName}
          onChangeText={(text) => setFormData(prev => ({ ...prev, lastName: text }))}
          placeholder="Enter your last name"
          className="h-12 rounded-lg px-4 bg-background border border-input text-base text-foreground"
          placeholderTextColor="#9CA3AF"
        />
      </View>
      <View className="space-y-2">
        <Label className="font-semibold text-base">Professional Email</Label>
        <Input
          value={formData.email}
          onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
          placeholder="Enter your professional email"
          keyboardType="email-address"
          autoCapitalize="none"
          className="h-12 rounded-lg px-4 bg-background border border-input text-base text-foreground"
          placeholderTextColor="#9CA3AF"
        />
      </View>
      <View className="space-y-2">
        <Label className="font-semibold text-base">Password</Label>
        <Input
          value={formData.password}
          onChangeText={(text) => setFormData(prev => ({ ...prev, password: text }))}
          placeholder="Create a secure password"
          secureTextEntry
          className="h-12 rounded-lg px-4 bg-background border border-input text-base text-foreground"
          placeholderTextColor="#9CA3AF"
        />
      </View>
      <View className="space-y-2">
        <Label className="font-semibold text-base">Confirm Password</Label>
        <Input
          value={formData.confirmPassword}
          onChangeText={(text) => setFormData(prev => ({ ...prev, confirmPassword: text }))}
          placeholder="Confirm your password"
          secureTextEntry
          className="h-12 rounded-lg px-4 bg-background border border-input text-base text-foreground"
          placeholderTextColor="#9CA3AF"
        />
      </View>
      
      {formData.password !== formData.confirmPassword && formData.confirmPassword && (
        <Text className="text-destructive text-sm">Passwords do not match</Text>
      )}
    </CardContent>
  );

  const renderStep2 = () => (
    <CardContent className="space-y-4">
      <H2 className="mb-2">Professional Credentials</H2>
      <P className="mb-4">Please provide your professional license information.</P>
      <View className="space-y-2">
        <Label className="font-semibold text-base">License Number</Label>
        <Input
          value={formData.licenseNumber}
          onChangeText={(text) => setFormData(prev => ({ ...prev, licenseNumber: text }))}
          placeholder="Enter your license number"
          className="h-12 rounded-lg px-4 bg-background border border-input text-base text-foreground"
          placeholderTextColor="#9CA3AF"
        />
      </View>
      
      <View className="space-y-2">
        <Label className="font-semibold text-base">License Type</Label>
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
        <Label className="font-semibold text-base">Years of Experience</Label>
        <Input
          value={formData.yearsExperience}
          onChangeText={(text) => setFormData(prev => ({ ...prev, yearsExperience: text }))}
          placeholder="e.g., 5"
          keyboardType="numeric"
          className="h-12 rounded-lg px-4 bg-background border border-input text-base text-foreground"
          placeholderTextColor="#9CA3AF"
        />
      </View>
    </CardContent>
  );

  const renderStep3 = () => (
    <CardContent className="space-y-4">
      <H2 className="mb-2">Expertise & Specializations</H2>
      <P className="mb-4">Tell us about your areas of expertise.</P>
      <View className="space-y-2">
        <Label className="font-semibold text-base">Specializations (Select all that apply)</Label>
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
        <Label className="font-semibold text-base">Therapy Approaches</Label>
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
        <Label className="font-semibold text-base">Age Groups You Work With</Label>
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
      <H2 className="mb-2">Practice Details</H2>
      <P className="mb-4">Final details about your practice.</P>
      <View className="space-y-2">
        <Label className="font-semibold text-base">Hourly Rate (USD)</Label>
        <Input
          value={formData.hourlyRate}
          onChangeText={(text) => setFormData(prev => ({ ...prev, hourlyRate: text }))}
          placeholder="e.g., 120"
          keyboardType="numeric"
          className="h-12 rounded-lg px-4 bg-background border border-input text-base text-foreground"
          placeholderTextColor="#9CA3AF"
        />
      </View>
      
      <View className="space-y-2">
        <Label className="font-semibold text-base">Maximum Clients Per Week</Label>
        <Input
          value={formData.maxClientsPerWeek}
          onChangeText={(text) => setFormData(prev => ({ ...prev, maxClientsPerWeek: text }))}
          placeholder="e.g., 20"
          keyboardType="numeric"
          className="h-12 rounded-lg px-4 bg-background border border-input text-base text-foreground"
          placeholderTextColor="#9CA3AF"
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
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar barStyle={isDarkColorScheme ? 'light-content' : 'dark-content'} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={{ maxWidth: 480, width: '100%', alignSelf: 'center' }}>
              <Card style={{ elevation: 4, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, borderRadius: 16 }}>
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-center mb-2">Sign Up as Counsellor</CardTitle>
                  <CardDescription className="text-center mb-2">Apply to join MindConnect as a professional</CardDescription>
                  {/* Step Indicator */}
                  <View className="flex-row justify-center items-center mb-2">
                    {[1, 2, 3, 4].map((step) => (
                      <View key={step} className={`w-3 h-3 rounded-full mx-1 ${currentStep === step ? 'bg-blue-500' : 'bg-gray-300'}`} />
                    ))}
                  </View>
                </CardHeader>
                {/* Error Message */}
                {error ? (
                  <View className="bg-red-100 rounded-lg p-2 mb-2">
                    <Text className="text-red-700 text-center text-sm">{error}</Text>
                  </View>
                ) : null}
                {/* Loading Indicator */}
                {loading && (
                  <View className="mb-2">
                    <ActivityIndicator size="small" color="#3B82F6" />
                  </View>
                )}
                {/* Step Content */}
                {currentStep === 1 && renderStep1()}
                {currentStep === 2 && renderStep2()}
                {currentStep === 3 && renderStep3()}
                {currentStep === 4 && renderStep4()}
                {/* Navigation Buttons */}
                <CardContent>
                  <View className="flex-row justify-between mt-4">
                    <Button variant="outline" onPress={handleBack} disabled={loading} style={{ flex: 1, marginRight: 8 }}>
                      <Text className="text-foreground">Back</Text>
                    </Button>
                    {currentStep < 4 ? (
                      <Button onPress={handleNext} disabled={loading || (currentStep === 1 && !isStep1Valid) || (currentStep === 2 && !isStep2Valid) || (currentStep === 3 && !isStep3Valid)} style={{ flex: 1, marginLeft: 8 }}>
                        <Text className="text-primary-foreground">Next</Text>
                      </Button>
                    ) : (
                      <Button onPress={handleSubmit} disabled={loading} style={{ flex: 1, marginLeft: 8 }}>
                        <Text className="text-primary-foreground">Submit</Text>
                      </Button>
                    )}
                  </View>
                </CardContent>
              </Card>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

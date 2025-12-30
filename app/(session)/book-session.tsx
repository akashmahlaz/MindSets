import "@/app/global.css";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { M3Icon } from "@/components/ui/M3Icon";
import { M3CircularProgress } from "@/components/ui/M3ProgressIndicator";
import { useAuth } from "@/context/AuthContext";
import { addSessionToCalendar } from "@/lib/calendarService";
import { useColorScheme } from "@/lib/useColorScheme";
import { createSessionBooking, SessionData } from "@/services/sessionService";
import { getCounsellors, getUserProfile } from "@/services/userService";
import { CounsellorProfileData } from "@/types/user";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    Alert,
    ScrollView,
    Share,
    StatusBar,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface TimeSlot {
  id: string;
  time: string;
  available: boolean;
}

interface SessionType {
  id: string;
  name: string;
  duration: number;
  price: number;
  description: string;
}

// Helper function to generate session types based on counsellor's hourly rate
const getSessionTypes = (hourlyRate: number = 80): SessionType[] => [
  {
    id: "1",
    name: "Consultation",
    duration: 60,
    price: hourlyRate, // Full hour rate
    description: "First session to understand your needs and goals",
  },
  {
    id: "2",
    name: "Therapy",
    duration: 50,
    price: Math.round(hourlyRate * 0.85), // ~50 min session
    description: "Regular therapy session",
  },
  {
    id: "3",
    name: "Follow-up",
    duration: 30,
    price: Math.round(hourlyRate * 0.5), // Half hour rate
    description: "Short check-in session",
  },
  {
    id: "4",
    name: "Crisis Support",
    duration: 45,
    price: Math.round(hourlyRate * 1.25), // Premium rate for urgent support
    description: "Immediate support for urgent situations",
  },
];

export default function BookSessionScreen() {
  const { userProfile } = useAuth();
  const router = useRouter();
  const { counsellorId } = useLocalSearchParams<{ counsellorId?: string }>();
  const { isDarkColorScheme } = useColorScheme();

  const [step, setStep] = useState(1); // 1: Select Counselor, 2: Select Date/Time, 3: Session Details, 4: Confirm
  const [counsellors, setCounsellors] = useState<CounsellorProfileData[]>([]);
  const [selectedCounselor, setSelectedCounselor] =
    useState<CounsellorProfileData | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState<TimeSlot | null>(null);
  const [selectedSessionType, setSelectedSessionType] =
    useState<SessionType | null>(null);
  const [sessionNotes, setSessionNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);

  // Get session types based on selected counsellor's hourly rate
  const sessionTypes = getSessionTypes(selectedCounselor?.hourlyRate || 80);

  useEffect(() => {
    loadCounsellors();
  }, []);
  
  // If counsellorId is passed as param, pre-select that counsellor
  useEffect(() => {
    const loadPreselectedCounsellor = async () => {
      if (counsellorId) {
        try {
          const counsellorProfile = await getUserProfile(counsellorId);
          // Only allow booking with VERIFIED counsellors
          if (counsellorProfile && 
              counsellorProfile.role === "counsellor" &&
              (counsellorProfile as CounsellorProfileData).verificationStatus === "verified") {
            setSelectedCounselor(counsellorProfile as CounsellorProfileData);
            setStep(2); // Skip to date/time selection
          } else if (counsellorProfile?.role === "counsellor") {
            // Counsellor exists but not verified
            Alert.alert(
              "Counsellor Not Available",
              "This counsellor is not currently accepting new bookings. Please choose another counsellor.",
              [{ text: "OK" }]
            );
          }
        } catch (error) {
          console.error("Error loading pre-selected counsellor:", error);
        }
      }
    };
    loadPreselectedCounsellor();
  }, [counsellorId]);
  
  const loadCounsellors = async () => {
    try {
      const allUsers = await getCounsellors();
      // Filter for VERIFIED counsellor users only
      const counsellorList = allUsers.filter(
        (user) => user.role === "counsellor" && (user as CounsellorProfileData).verificationStatus === "verified",
      ) as CounsellorProfileData[];
      setCounsellors(counsellorList);
    } catch (error) {
      console.error("Error loading counsellors:", error);
      Alert.alert("Error", "Failed to load counsellors");
    } finally {
      setLoading(false);
    }
  };

  // Generate time slots for selected date
  const generateTimeSlots = (date: Date): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    const startHour = 9;
    const endHour = 17;

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
        const slotDate = new Date(date);
        slotDate.setHours(hour, minute, 0, 0);

        // Mock availability - in real app, check counselor's availability
        const available = Math.random() > 0.3 && slotDate > new Date();

        slots.push({
          id: `${hour}-${minute}`,
          time,
          available,
        });
      }
    }
    return slots;
  };

  const selectCounselor = (counselor: CounsellorProfileData) => {
    setSelectedCounselor(counselor);
    setStep(2);
  };

  const selectDateTime = () => {
    if (!selectedTime) {
      Alert.alert("Error", "Please select a time slot");
      return;
    }
    setStep(3);
  };

  const selectSessionDetails = () => {
    if (!selectedSessionType) {
      Alert.alert("Error", "Please select a session type");
      return;
    }
    setStep(4);
  };

  const bookSession = async () => {
    if (!selectedCounselor || !selectedTime || !selectedSessionType) {
      Alert.alert("Error", "Please complete all booking details");
      return;
    }

    setBooking(true);
    try {
      // Create session object
      const sessionDateTime = new Date(selectedDate);
      const [hours, minutes] = selectedTime.time.split(":").map(Number);
      sessionDateTime.setHours(hours, minutes, 0, 0);

      const sessionType = selectedSessionType.name
        .toLowerCase()
        .replace(/\s+/g, "-") as
        | "therapy"
        | "consultation"
        | "follow-up"
        | "crisis-support";

      const sessionData: SessionData = {
        counselorId: selectedCounselor.uid,
        counselorName: selectedCounselor.displayName,
        clientId: userProfile?.uid || "",
        clientName: userProfile?.displayName || "",
        date: sessionDateTime,
        duration: selectedSessionType.duration,
        type: sessionType,
        price: selectedSessionType.price,
        notes: sessionNotes,
        status: "pending",
        location: "Virtual Session",
      };

      // Save to database
      const sessionId = await createSessionBooking(sessionData);

      // Add to device calendar with reminders
      const calendarEventId = await addSessionToCalendar({
        title: `${selectedSessionType.name} Session`,
        counsellorName: selectedCounselor.displayName,
        clientName: userProfile?.displayName || "",
        startDate: sessionDateTime,
        durationMinutes: selectedSessionType.duration,
        sessionType: selectedSessionType.name,
        notes: sessionNotes,
        sessionId: sessionId,
      });

      // Show success with options
      const sessionDetails = `
📅 Session Booked Successfully!

${selectedSessionType.name} with ${selectedCounselor.displayName}
📅 Date: ${sessionDateTime.toLocaleDateString()}
⏰ Time: ${selectedTime.time}
⏱️ Duration: ${selectedSessionType.duration} minutes
${sessionNotes ? `📝 Notes: ${sessionNotes}` : ""}

⚠️ Note: Your session is pending confirmation from the counsellor.
You will be notified once it's confirmed.
${calendarEventId ? "\n✅ Reminder added to your calendar!" : ""}

MindHeal Mental Health Platform
      `.trim();

      Alert.alert(
        "Session Request Sent!",
        `Your ${selectedSessionType.name.toLowerCase()} request with ${selectedCounselor.displayName} has been sent for ${sessionDateTime.toLocaleDateString()} at ${selectedTime.time}.\n\nThe counsellor will confirm your booking shortly.${calendarEventId ? "\n\n📅 A reminder has been added to your calendar." : ""}`,
        [
          {
            text: "Share Details",
            onPress: async () => {
              try {
                await Share.share({
                  message: sessionDetails,
                  title: "Session Details",
                });
              } catch (error) {
                console.error("Error sharing session:", error);
              }
              router.push("/(main)/sessions");
            },
          },
          {
            text: "View Sessions",
            onPress: () => router.push("/(main)/sessions"),
          },
        ],
      );
    } catch (error) {
      console.error("Error booking session:", error);
      Alert.alert("Error", "Failed to book session. Please try again.");
    } finally {
      setBooking(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const nextWeekDays = () => {
    const days = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      days.push(date);
    }
    return days;
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <StatusBar
          barStyle={isDarkColorScheme ? "light-content" : "dark-content"}
        />
        <View className="flex-1 justify-center items-center">
          <M3CircularProgress
            size="large"
            color={isDarkColorScheme ? "#ffffff" : "#000000"}
          />
          <Text className="text-foreground text-lg mt-4">Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar
        barStyle={isDarkColorScheme ? "light-content" : "dark-content"}
        backgroundColor={isDarkColorScheme ? "#141820" : "#F8F9FA"}
      />

      {/* Header */}
      <View className="px-6 py-4 border-b border-border flex-row items-center">
        <TouchableOpacity
          onPress={() => {
            if (booking) return;
            if (step > 1) {
              setStep(step - 1);
            } else {
              router.back();
            }
          }}
          disabled={booking}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          accessibilityHint="Returns to previous screen"
          className="mr-4"
          style={{ opacity: booking ? 0.5 : 1 }}
        >
          <M3Icon
            name="chevron-left"
            size={24}
            color={isDarkColorScheme ? "#ffffff" : "#000000"}
          />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-2xl font-bold text-foreground">
            Book Session
          </Text>
          <Text className="text-muted-foreground">Step {step} of 4</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-6 py-4">
        {/* Step 1: Select Counselor */}
        {step === 1 && (
          <View>
            <Text className="text-xl font-semibold text-foreground mb-4">
              Choose Your Counselor
            </Text>
            {counsellors.map((counselor) => (
              <Card key={counselor.uid} className="mb-4 shadow-sm">
                <CardContent className="p-4">
                  <View className="flex-row justify-between items-start">
                    <View className="flex-1">
                      <Text className="text-lg font-semibold text-foreground mb-1">
                        {counselor.displayName}
                      </Text>
                      <Text className="text-muted-foreground mb-2">
                        {counselor.licenseType} • {counselor.yearsExperience}
                        years experience
                      </Text>
                      {counselor.specializations && (
                        <View className="flex-row flex-wrap gap-1 mb-2">
                          {counselor.specializations
                            .slice(0, 3)
                            .map((spec, index) => (
                              <View
                                key={index}
                                className="bg-primary/10 px-2 py-1 rounded"
                              >
                                <Text className="text-primary text-xs">
                                  {spec}
                                </Text>
                              </View>
                            ))}
                        </View>
                      )}
                      <Text className="text-foreground font-medium">
                        ${counselor.hourlyRate}/hour
                      </Text>
                    </View>
                    <Button
                      onPress={() => selectCounselor(counselor)}
                      className="ml-4"
                    >
                      <Text className="text-primary-foreground">Select</Text>
                    </Button>
                  </View>
                </CardContent>
              </Card>
            ))}
          </View>
        )}

        {/* Step 2: Select Date & Time */}
        {step === 2 && (
          <View>
            <Text className="text-xl font-semibold text-foreground mb-4">
              Select Date & Time
            </Text>

            {/* Date Selection */}
            <Text className="text-lg font-medium text-foreground mb-3">
              Choose Date
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mb-6"
            >
              <View className="flex-row space-x-3">
                {nextWeekDays().map((date, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => setSelectedDate(date)}
                    className={`p-4 rounded-lg border min-w-24 items-center ${
                      selectedDate.toDateString() === date.toDateString()
                        ? "bg-primary border-primary"
                        : "bg-card border-border"
                    }`}
                  >
                    <Text
                      className={`text-sm ${
                        selectedDate.toDateString() === date.toDateString()
                          ? "text-primary-foreground"
                          : "text-muted-foreground"
                      }`}
                    >
                      {date.toLocaleDateString("en-US", { weekday: "short" })}
                    </Text>
                    <Text
                      className={`text-lg font-semibold ${
                        selectedDate.toDateString() === date.toDateString()
                          ? "text-primary-foreground"
                          : "text-foreground"
                      }`}
                    >
                      {date.getDate()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* Time Selection */}
            <Text className="text-lg font-medium text-foreground mb-3">
              Choose Time
            </Text>
            <View className="flex-row flex-wrap gap-3 mb-6">
              {generateTimeSlots(selectedDate).map((slot) => (
                <TouchableOpacity
                  key={slot.id}
                  onPress={() => slot.available && setSelectedTime(slot)}
                  disabled={!slot.available}
                  className={`px-4 py-3 rounded-lg border ${
                    selectedTime?.id === slot.id
                      ? "bg-primary border-primary"
                      : slot.available
                        ? "bg-card border-border"
                        : "bg-muted border-muted opacity-50"
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${
                      selectedTime?.id === slot.id
                        ? "text-primary-foreground"
                        : slot.available
                          ? "text-foreground"
                          : "text-muted-foreground"
                    }`}
                  >
                    {slot.time}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Button onPress={selectDateTime} className="w-full">
              <Text className="text-primary-foreground">Continue</Text>
            </Button>
          </View>
        )}

        {/* Step 3: Session Details */}
        {step === 3 && (
          <View className="pb-4">
            <Text className="text-xl font-semibold text-foreground mb-3">
              Session Details
            </Text>

            <Text className="text-base font-medium text-foreground mb-2">
              Session Type
            </Text>
            {/* Compact session type cards - 2 columns */}
            <View className="flex-row flex-wrap justify-between mb-3">
              {sessionTypes.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  onPress={() => setSelectedSessionType(type)}
                  className={`w-[48%] p-3 rounded-lg border mb-2 ${
                    selectedSessionType?.id === type.id
                      ? "bg-primary/10 border-primary"
                      : "bg-card border-border"
                  }`}
                >
                  <View className="flex-row justify-between items-center mb-1">
                    <Text className="text-base font-semibold text-foreground flex-1" numberOfLines={1}>
                      {type.name}
                    </Text>
                    <Text className="text-base font-bold text-primary ml-1">
                      ${type.price}
                    </Text>
                  </View>
                  <Text className="text-xs text-muted-foreground mb-1" numberOfLines={2}>
                    {type.description}
                  </Text>
                  <Text className="text-xs text-muted-foreground">
                    {type.duration} min
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Compact Payment Note */}
            <View className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 mb-3">
              <View className="flex-row items-start">
                <M3Icon name="information-circle" size={16} color="#F59E0B" />
                <Text className="text-muted-foreground text-xs ml-2 flex-1">
                  Payment arranged directly with counsellor. Price is an estimate.
                </Text>
              </View>
            </View>

            <Text className="text-base font-medium text-foreground mb-2">
              Notes (Optional)
            </Text>
            <Input
              value={sessionNotes}
              onChangeText={setSessionNotes}
              placeholder="Topics or goals for this session..."
              multiline
              numberOfLines={2}
              className="mb-4"
              style={{ minHeight: 60, maxHeight: 80 }}
            />

            <Button onPress={selectSessionDetails} className="w-full">
              <Text className="text-primary-foreground">Continue</Text>
            </Button>
          </View>
        )}

        {/* Step 4: Confirmation */}
        {step === 4 && (
          <View>
            <Text className="text-xl font-semibold text-foreground mb-4">
              Confirm Booking
            </Text>

            <Card className="mb-6 shadow-sm">
              <CardHeader>
                <CardTitle>Session Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <View className="space-y-3">
                  <View className="flex-row justify-between">
                    <Text className="text-muted-foreground">Counselor:</Text>
                    <Text className="text-foreground font-medium">
                      {selectedCounselor?.displayName}
                    </Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-muted-foreground">Date:</Text>
                    <Text className="text-foreground font-medium">
                      {formatDate(selectedDate)}
                    </Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-muted-foreground">Time:</Text>
                    <Text className="text-foreground font-medium">
                      {selectedTime?.time}
                    </Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-muted-foreground">Session Type:</Text>
                    <Text className="text-foreground font-medium">
                      {selectedSessionType?.name}
                    </Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-muted-foreground">Duration:</Text>
                    <Text className="text-foreground font-medium">
                      {selectedSessionType?.duration} minutes
                    </Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-muted-foreground">Cost:</Text>
                    <Text className="text-foreground font-bold text-lg">
                      ${selectedSessionType?.price}
                    </Text>
                  </View>
                  {sessionNotes && (
                    <View>
                      <Text className="text-muted-foreground mb-1">Notes:</Text>
                      <Text className="text-foreground">{sessionNotes}</Text>
                    </View>
                  )}
                </View>
              </CardContent>
            </Card>

            <Button
              onPress={bookSession}
              disabled={booking}
              className="w-full mb-4 h-12"
            >
              {booking ? (
                <View className="flex-row items-center">
                  <M3CircularProgress
                    size={20}
                    color="#ffffff"
                    style={{ marginRight: 8 }}
                  />
                  <Text className="text-primary-foreground font-medium">
                    Booking Session...
                  </Text>
                </View>
              ) : (
                <Text className="text-primary-foreground font-medium">
                  Confirm Booking
                </Text>
              )}
            </Button>

            <Text className="text-center text-xs text-muted-foreground">
              By booking this session, you agree to our terms and conditions.
              You can cancel up to 24 hours before the session.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

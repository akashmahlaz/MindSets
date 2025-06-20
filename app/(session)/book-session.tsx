import "@/app/global.css";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { useColorScheme } from "@/lib/useColorScheme";
import { createSessionBooking, SessionData } from "@/services/sessionService";
import { getCounsellors } from "@/services/userService";
import { CounsellorProfileData } from "@/types/user";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
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

export default function BookSessionScreen() {
  const { userProfile } = useAuth();
  const router = useRouter();
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

  const sessionTypes: SessionType[] = [
    {
      id: "1",
      name: "Consultation",
      duration: 60,
      price: 80,
      description: "First session to understand your needs and goals",
    },
    {
      id: "2",
      name: "Therapy",
      duration: 50,
      price: 100,
      description: "Regular therapy session",
    },
    {
      id: "3",
      name: "Follow-up",
      duration: 30,
      price: 60,
      description: "Short check-in session",
    },
    {
      id: "4",
      name: "Crisis Support",
      duration: 45,
      price: 120,
      description: "Immediate support for urgent situations",
    },
  ];

  useEffect(() => {
    loadCounsellors();
  }, []);
  const loadCounsellors = async () => {
    try {
      const allUsers = await getCounsellors();
      // Filter for counsellor users and cast to CounsellorProfileData
      const counsellorList = allUsers.filter(
        (user) => user.role === "counsellor",
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
      await createSessionBooking(sessionData);

      // Show success with sharing option
      const sessionDetails = `
📅 Session Booked Successfully!

${selectedSessionType.name} with ${selectedCounselor.displayName}
📅 Date: ${sessionDateTime.toLocaleDateString()}
⏰ Time: ${selectedTime.time}
⏱️ Duration: ${selectedSessionType.duration} minutes
${sessionNotes ? `📝 Notes: ${sessionNotes}` : ""}

MindConnect Mental Health Platform
      `.trim();

      Alert.alert(
        "Session Booked!",
        `Your ${selectedSessionType.name.toLowerCase()} with ${selectedCounselor.displayName} has been scheduled for ${sessionDateTime.toLocaleDateString()} at ${selectedTime.time}.`,
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
          <ActivityIndicator
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
      />

      {/* Header */}
      <View className="px-6 py-4 border-b border-border flex-row items-center">
        <TouchableOpacity
          onPress={() => {
            if (booking) return; // Prevent navigation during booking
            step > 1 ? setStep(step - 1) : router.back();
          }}
          disabled={booking}
          className="mr-4"
          style={{ opacity: booking ? 0.5 : 1 }}
        >
          <Ionicons
            name="chevron-back"
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
          <View>
            <Text className="text-xl font-semibold text-foreground mb-4">
              Session Details
            </Text>

            <Text className="text-lg font-medium text-foreground mb-3">
              Session Type
            </Text>
            {sessionTypes.map((type) => (
              <TouchableOpacity
                key={type.id}
                onPress={() => setSelectedSessionType(type)}
                className={`p-4 rounded-lg border mb-3 ${
                  selectedSessionType?.id === type.id
                    ? "bg-primary/10 border-primary"
                    : "bg-card border-border"
                }`}
              >
                <View className="flex-row justify-between items-start">
                  <View className="flex-1">
                    <Text className="text-lg font-semibold text-foreground mb-1">
                      {type.name}
                    </Text>
                    <Text className="text-muted-foreground mb-2">
                      {type.description}
                    </Text>
                    <Text className="text-sm text-muted-foreground">
                      {type.duration} minutes
                    </Text>
                  </View>
                  <Text className="text-lg font-bold text-foreground">
                    ${type.price}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}

            <Text className="text-lg font-medium text-foreground mb-3 mt-4">
              Additional Notes (Optional)
            </Text>
            <Input
              value={sessionNotes}
              onChangeText={setSessionNotes}
              placeholder="Any specific topics or concerns you'd like to discuss..."
              multiline
              numberOfLines={3}
              className="mb-6"
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
                  <ActivityIndicator
                    size="small"
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

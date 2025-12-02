import "@/app/global.css";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/firebaseConfig";
import { useColorScheme } from "@/lib/useColorScheme";
import { SessionBooking } from "@/services/sessionService";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StatusBar,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SessionHistoryScreen() {
  const { clientId } = useLocalSearchParams();
  const { user, userProfile } = useAuth();
  const router = useRouter();
  const { isDarkColorScheme } = useColorScheme();
  const [sessions, setSessions] = useState<SessionBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const colors = {
    background: isDarkColorScheme ? "#0C0F14" : "#FAFBFC",
    surface: isDarkColorScheme ? "#1A1F2E" : "#FFFFFF",
    surfaceVariant: isDarkColorScheme ? "#252B3B" : "#F1F5F9",
    text: isDarkColorScheme ? "#F1F5F9" : "#0F172A",
    textSecondary: isDarkColorScheme ? "#94A3B8" : "#64748B",
    primary: "#2AA79D",
    border: isDarkColorScheme ? "#334155" : "#E2E8F0",
    success: "#10B981",
    warning: "#F59E0B",
    error: "#EF4444",
  };

  useEffect(() => {
    const fetchSessionHistory = async () => {
      if (!user || !clientId) {
        setError("Missing user or client information");
        setLoading(false);
        return;
      }

      // Verify the current user is a counsellor
      if ((userProfile as any)?.role !== "counsellor") {
        setError("Only counsellors can view session history");
        setLoading(false);
        return;
      }

      try {
        const clientIdStr = Array.isArray(clientId) ? clientId[0] : clientId;

        // Query sessions where current user is counselor and clientId matches
        const q = query(
          collection(db, "sessions"),
          where("counselorId", "==", user.uid),
          where("clientId", "==", clientIdStr),
          orderBy("date", "desc")
        );

        const querySnapshot = await getDocs(q);
        const fetchedSessions: SessionBooking[] = [];

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          fetchedSessions.push({
            id: doc.id,
            counselorId: data.counselorId,
            counselorName: data.counselorName,
            clientId: data.clientId,
            clientName: data.clientName,
            date: data.date.toDate(),
            duration: data.duration,
            type: data.type,
            status: data.status,
            notes: data.notes,
            price: data.price,
            location: data.location,
            createdAt: data.createdAt.toDate(),
            updatedAt: data.updatedAt.toDate(),
          });
        });

        setSessions(fetchedSessions);
      } catch (err) {
        console.error("Error fetching session history:", err);
        setError("Failed to load session history");
      } finally {
        setLoading(false);
      }
    };

    fetchSessionHistory();
  }, [user, userProfile, clientId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return colors.success;
      case "confirmed":
        return colors.primary;
      case "pending":
        return colors.warning;
      case "cancelled":
        return colors.error;
      default:
        return colors.textSecondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return "checkmark-circle";
      case "confirmed":
        return "calendar";
      case "pending":
        return "time";
      case "cancelled":
        return "close-circle";
      default:
        return "help-circle";
    }
  };

  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    return date.toLocaleDateString("en-US", options);
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <StatusBar
          barStyle={isDarkColorScheme ? "light-content" : "dark-content"}
        />
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" color={colors.primary} />
          <Text
            style={{
              color: colors.textSecondary,
              marginTop: 16,
              fontSize: 16,
            }}
          >
            Loading session history...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <StatusBar
          barStyle={isDarkColorScheme ? "light-content" : "dark-content"}
        />
        <View style={{ flex: 1 }}>
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
          >
            <Pressable
              onPress={() => router.back()}
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                backgroundColor: colors.surfaceVariant,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Ionicons name="chevron-back" size={24} color={colors.text} />
            </Pressable>
            <Text
              style={{
                flex: 1,
                fontSize: 18,
                fontWeight: "600",
                color: colors.text,
                marginLeft: 12,
              }}
            >
              Session History
            </Text>
          </View>

          {/* Error Message */}
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              padding: 24,
            }}
          >
            <Ionicons name="alert-circle" size={64} color={colors.error} />
            <Text
              style={{
                color: colors.text,
                fontSize: 18,
                fontWeight: "600",
                marginTop: 16,
              }}
            >
              Error
            </Text>
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: 14,
                marginTop: 8,
                textAlign: "center",
              }}
            >
              {error}
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar
        barStyle={isDarkColorScheme ? "light-content" : "dark-content"}
      />

      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            backgroundColor: colors.surfaceVariant,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Text
          style={{
            flex: 1,
            fontSize: 18,
            fontWeight: "600",
            color: colors.text,
            marginLeft: 12,
          }}
        >
          Session History
        </Text>
        <View
          style={{
            backgroundColor: colors.primary + "20",
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 12,
          }}
        >
          <Text style={{ color: colors.primary, fontSize: 14, fontWeight: "600" }}>
            {sessions.length} {sessions.length === 1 ? "Session" : "Sessions"}
          </Text>
        </View>
      </View>

      {/* Session List */}
      {sessions.length === 0 ? (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            padding: 24,
          }}
        >
          <Ionicons
            name="calendar-outline"
            size={64}
            color={colors.textSecondary}
          />
          <Text
            style={{
              color: colors.text,
              fontSize: 18,
              fontWeight: "600",
              marginTop: 16,
            }}
          >
            No Sessions Yet
          </Text>
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: 14,
              marginTop: 8,
              textAlign: "center",
            }}
          >
            No session history found with this client.
          </Text>
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
          {sessions.map((session) => (
            <View
              key={session.id}
              style={{
                backgroundColor: colors.surface,
                borderRadius: 16,
                padding: 16,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              {/* Status Badge */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <Ionicons
                  name={getStatusIcon(session.status) as any}
                  size={20}
                  color={getStatusColor(session.status)}
                />
                <Text
                  style={{
                    color: getStatusColor(session.status),
                    fontSize: 14,
                    fontWeight: "600",
                    marginLeft: 6,
                    textTransform: "capitalize",
                  }}
                >
                  {session.status}
                </Text>
                <View
                  style={{
                    flex: 1,
                    alignItems: "flex-end",
                  }}
                >
                  <Text
                    style={{
                      color: colors.textSecondary,
                      fontSize: 12,
                    }}
                  >
                    {session.type.replace("-", " ").toUpperCase()}
                  </Text>
                </View>
              </View>

              {/* Date & Duration */}
              <View style={{ marginBottom: 8 }}>
                <Text style={{ color: colors.text, fontSize: 16, fontWeight: "600" }}>
                  {formatDate(session.date)}
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: 14, marginTop: 4 }}>
                  Duration: {session.duration} minutes
                </Text>
              </View>

              {/* Location */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginTop: 8,
                }}
              >
                <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
                <Text
                  style={{
                    color: colors.textSecondary,
                    fontSize: 14,
                    marginLeft: 6,
                  }}
                >
                  {session.location}
                </Text>
              </View>

              {/* Notes */}
              {session.notes && (
                <View
                  style={{
                    marginTop: 12,
                    padding: 12,
                    backgroundColor: colors.surfaceVariant,
                    borderRadius: 12,
                  }}
                >
                  <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 4 }}>
                    Notes:
                  </Text>
                  <Text style={{ color: colors.text, fontSize: 14 }}>
                    {session.notes}
                  </Text>
                </View>
              )}

              {/* Price */}
              <View
                style={{
                  marginTop: 12,
                  paddingTop: 12,
                  borderTopWidth: 1,
                  borderTopColor: colors.border,
                }}
              >
                <Text style={{ color: colors.primary, fontSize: 16, fontWeight: "700" }}>
                  ₹{session.price}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

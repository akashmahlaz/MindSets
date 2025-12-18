import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const COLORS = {
  primary: "#2AA79D",
  background: "#F7F9F9",
  surface: "#FFFFFF",
  text: "#1F2937",
  textSecondary: "#6B7280",
};

export default function TermsOfServiceScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Terms of Service</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.lastUpdated}>Last updated: December 2024</Text>

        <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
        <Text style={styles.paragraph}>
          By using MindSets, you agree to these Terms of Service. If you do not agree, 
          please do not use our services.
        </Text>

        <Text style={styles.sectionTitle}>2. Description of Service</Text>
        <Text style={styles.paragraph}>
          MindSets provides a platform connecting users with licensed mental health 
          counselors through text, voice, and video sessions. Our service is not intended 
          for emergency situations.
        </Text>

        <Text style={styles.sectionTitle}>3. User Responsibilities</Text>
        <Text style={styles.paragraph}>
          You are responsible for maintaining the confidentiality of your account and for 
          all activities that occur under your account. You must be at least 18 years old 
          to use our services.
        </Text>

        <Text style={styles.sectionTitle}>4. Counselor Services</Text>
        <Text style={styles.paragraph}>
          All counselors on MindSets are licensed professionals. However, the platform 
          is not a substitute for in-person therapy or emergency mental health services.
        </Text>

        <Text style={styles.sectionTitle}>5. Payment Terms</Text>
        <Text style={styles.paragraph}>
          Payment for services is processed securely through our platform. Subscription 
          fees are billed according to your chosen plan.
        </Text>

        <Text style={styles.sectionTitle}>6. Limitation of Liability</Text>
        <Text style={styles.paragraph}>
          MindSets is not liable for any damages arising from the use of our services. 
          In case of emergency, please contact local emergency services immediately.
        </Text>

        <Text style={styles.sectionTitle}>7. Contact</Text>
        <Text style={styles.paragraph}>
          For questions about these Terms, contact us at support@mindsets.com
        </Text>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  lastUpdated: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text,
    marginTop: 20,
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 16,
    color: COLORS.textSecondary,
    lineHeight: 24,
  },
  bottomPadding: {
    height: 40,
  },
});

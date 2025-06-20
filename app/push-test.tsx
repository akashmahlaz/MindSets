import { usePushNotifications } from "@/hooks/usePushNotifications";
import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function PushNotificationTestScreen() {
  const { fcmToken, isInitialized, sendTestNotification, sendNotification } =
    usePushNotifications();

  const [customTitle, setCustomTitle] = useState("Custom Test Notification");
  const [customBody, setCustomBody] = useState("This is a custom test message");
  const [targetToken, setTargetToken] = useState("");

  const handleSendCustomNotification = async () => {
    if (!targetToken.trim()) {
      Alert.alert("Error", "Please enter a target FCM token");
      return;
    }

    try {
      const result = await sendNotification({
        token: targetToken,
        title: customTitle,
        body: customBody,
        data: {
          type: "custom_test",
          timestamp: Date.now().toString(),
        },
      });

      if (result.success) {
        Alert.alert("✅ Success", "Custom notification sent successfully!");
      } else {
        Alert.alert("❌ Error", `Failed to send notification: ${result.error}`);
      }
    } catch (error) {
      Alert.alert("❌ Error", `Error: ${error}`);
    }
  };

  const copyTokenToClipboard = () => {
    if (fcmToken) {
      // Copy to clipboard functionality would need additional setup
      Alert.alert("Token", fcmToken, [{ text: "OK" }]);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Push Notification Test</Text>
        <Text style={styles.subtitle}>
          Firebase Cloud Messaging V1 API Demo
        </Text>
      </View>

      {/* Status Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Status</Text>
        <View style={styles.statusItem}>
          <Text style={styles.statusLabel}>Initialized:</Text>
          <Text
            style={[
              styles.statusValue,
              { color: isInitialized ? "#4CAF50" : "#F44336" },
            ]}
          >
            {isInitialized ? "✅ Yes" : "❌ No"}
          </Text>
        </View>
        <View style={styles.statusItem}>
          <Text style={styles.statusLabel}>FCM Token:</Text>
          <Text
            style={[
              styles.statusValue,
              { color: fcmToken ? "#4CAF50" : "#F44336" },
            ]}
          >
            {fcmToken ? "✅ Available" : "❌ Not Available"}
          </Text>
        </View>
      </View>

      {/* FCM Token Section */}
      {fcmToken && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your FCM Token</Text>
          <TouchableOpacity
            style={styles.tokenContainer}
            onPress={copyTokenToClipboard}
          >
            <Text style={styles.tokenText} numberOfLines={3}>
              {fcmToken}
            </Text>
            <Text style={styles.tokenHint}>Tap to view full token</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Quick Test Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Test</Text>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={sendTestNotification}
          disabled={!isInitialized || !fcmToken}
        >
          <Text style={styles.buttonText}>
            Send Test Notification to This Device
          </Text>
        </TouchableOpacity>
      </View>

      {/* Custom Notification Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Send Custom Notification</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Title:</Text>
          <TextInput
            style={styles.input}
            value={customTitle}
            onChangeText={setCustomTitle}
            placeholder="Enter notification title"
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Body:</Text>
          <TextInput
            style={[styles.input, styles.multilineInput]}
            value={customBody}
            onChangeText={setCustomBody}
            placeholder="Enter notification body"
            placeholderTextColor="#999"
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Target FCM Token:</Text>
          <TextInput
            style={[styles.input, styles.multilineInput]}
            value={targetToken}
            onChangeText={setTargetToken}
            placeholder="Paste target device FCM token here"
            placeholderTextColor="#999"
            multiline
            numberOfLines={3}
          />
        </View>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={handleSendCustomNotification}
          disabled={!isInitialized}
        >
          <Text style={styles.buttonText}>Send Custom Notification</Text>
        </TouchableOpacity>
      </View>

      {/* Instructions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Instructions</Text>
        <Text style={styles.instructions}>
          1. Make sure your Firebase project is properly configured{"\n"}
          2. Set up environment variables for the API route{"\n"}
          3. Use "Send Test Notification" to test your own device{"\n"}
          4. Copy your FCM token and send it to another device for testing{"\n"}
          5. Use custom notifications to test different scenarios
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    backgroundColor: "#1976D2",
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#E3F2FD",
    textAlign: "center",
    marginTop: 8,
  },
  section: {
    backgroundColor: "white",
    margin: 16,
    padding: 16,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  statusItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  statusLabel: {
    fontSize: 16,
    color: "#666",
  },
  statusValue: {
    fontSize: 16,
    fontWeight: "bold",
  },
  tokenContainer: {
    backgroundColor: "#f0f0f0",
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  tokenText: {
    fontSize: 12,
    color: "#333",
    fontFamily: "monospace",
  },
  tokenHint: {
    fontSize: 12,
    color: "#999",
    marginTop: 8,
    textAlign: "center",
  },
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginVertical: 8,
  },
  primaryButton: {
    backgroundColor: "#4CAF50",
  },
  secondaryButton: {
    backgroundColor: "#2196F3",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    color: "#333",
    marginBottom: 8,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 6,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  instructions: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
});

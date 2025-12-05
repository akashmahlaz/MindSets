import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Calendar from 'expo-calendar';
import { Alert, Linking, Platform } from 'react-native';

const CALENDAR_PERMISSION_KEY = '@calendar_permission_asked';
const APP_CALENDAR_ID_KEY = '@mindheal_calendar_id';

/**
 * Request calendar permissions from the user
 */
export async function requestCalendarPermission(): Promise<boolean> {
  try {
    const { status: existingStatus } = await Calendar.getCalendarPermissionsAsync();
    
    if (existingStatus === 'granted') {
      return true;
    }

    // Check if we've already asked before
    const hasAsked = await AsyncStorage.getItem(CALENDAR_PERMISSION_KEY);
    
    const { status } = await Calendar.requestCalendarPermissionsAsync();
    await AsyncStorage.setItem(CALENDAR_PERMISSION_KEY, 'true');
    
    if (status !== 'granted') {
      if (hasAsked) {
        // User denied again, offer to open settings
        Alert.alert(
          'Calendar Permission Required',
          'To add session reminders to your calendar, please enable calendar access in your device settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() }
          ]
        );
      }
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error requesting calendar permission:', error);
    return false;
  }
}

/**
 * Get or create the MindHeal calendar
 */
async function getOrCreateMindHealCalendar(): Promise<string | null> {
  try {
    // Check if we have a stored calendar ID
    const storedCalendarId = await AsyncStorage.getItem(APP_CALENDAR_ID_KEY);
    
    if (storedCalendarId) {
      // Verify the calendar still exists
      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      const existingCalendar = calendars.find(cal => cal.id === storedCalendarId);
      if (existingCalendar) {
        return storedCalendarId;
      }
    }

    // Get default calendar source
    const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
    
    if (Platform.OS === 'ios') {
      // On iOS, try to find a local calendar or use the default
      const defaultCalendar = calendars.find(
        cal => cal.source.name === 'Default' || cal.source.type === Calendar.SourceType.LOCAL
      );
      
      if (defaultCalendar) {
        await AsyncStorage.setItem(APP_CALENDAR_ID_KEY, defaultCalendar.id);
        return defaultCalendar.id;
      }
    } else {
      // On Android, find a calendar that allows modifications
      const writableCalendar = calendars.find(
        cal => cal.accessLevel === Calendar.CalendarAccessLevel.OWNER ||
               cal.accessLevel === Calendar.CalendarAccessLevel.ROOT
      );
      
      if (writableCalendar) {
        await AsyncStorage.setItem(APP_CALENDAR_ID_KEY, writableCalendar.id);
        return writableCalendar.id;
      }
      
      // If no writable calendar found, try to create one
      const defaultCalendarSource = calendars[0]?.source;
      if (defaultCalendarSource) {
        const newCalendarId = await Calendar.createCalendarAsync({
          title: 'MindHeal Sessions',
          color: '#2AA79D',
          entityType: Calendar.EntityTypes.EVENT,
          sourceId: defaultCalendarSource.id,
          source: defaultCalendarSource,
          name: 'MindHeal',
          ownerAccount: defaultCalendarSource.name,
          accessLevel: Calendar.CalendarAccessLevel.OWNER,
        });
        
        await AsyncStorage.setItem(APP_CALENDAR_ID_KEY, newCalendarId);
        return newCalendarId;
      }
    }

    // Fallback: use the first available calendar
    if (calendars.length > 0) {
      await AsyncStorage.setItem(APP_CALENDAR_ID_KEY, calendars[0].id);
      return calendars[0].id;
    }

    return null;
  } catch (error) {
    console.error('Error getting/creating calendar:', error);
    return null;
  }
}

export interface SessionCalendarEvent {
  title: string;
  counsellorName: string;
  clientName: string;
  startDate: Date;
  durationMinutes: number;
  sessionType: string;
  notes?: string;
  sessionId: string;
}

/**
 * Add a session to the device calendar with reminders
 */
export async function addSessionToCalendar(session: SessionCalendarEvent): Promise<string | null> {
  try {
    const hasPermission = await requestCalendarPermission();
    if (!hasPermission) {
      return null;
    }

    const calendarId = await getOrCreateMindHealCalendar();
    if (!calendarId) {
      Alert.alert('Error', 'Could not access your calendar. Please try again.');
      return null;
    }

    const endDate = new Date(session.startDate);
    endDate.setMinutes(endDate.getMinutes() + session.durationMinutes);

    const eventDetails = {
      title: `🧠 ${session.sessionType} Session`,
      notes: `Session with ${session.counsellorName}\n\n${session.notes || ''}\n\nSession ID: ${session.sessionId}\n\nOpen MindHeal app to join the session.`,
      startDate: session.startDate,
      endDate: endDate,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      location: 'MindHeal Video Call',
      alarms: [
        { relativeOffset: -60 },    // 1 hour before
        { relativeOffset: -15 },    // 15 minutes before
        { relativeOffset: -5 },     // 5 minutes before
      ],
    };

    const eventId = await Calendar.createEventAsync(calendarId, eventDetails);
    
    console.log('✅ Calendar event created:', eventId);
    return eventId;
  } catch (error) {
    console.error('Error adding session to calendar:', error);
    Alert.alert('Calendar Error', 'Could not add session to your calendar. Please add it manually.');
    return null;
  }
}

/**
 * Update an existing calendar event
 */
export async function updateCalendarEvent(
  eventId: string,
  updates: Partial<SessionCalendarEvent>
): Promise<boolean> {
  try {
    const hasPermission = await requestCalendarPermission();
    if (!hasPermission) return false;

    const updateDetails: Record<string, unknown> = {};
    
    if (updates.startDate) {
      updateDetails.startDate = updates.startDate;
      if (updates.durationMinutes) {
        const endDate = new Date(updates.startDate);
        endDate.setMinutes(endDate.getMinutes() + updates.durationMinutes);
        updateDetails.endDate = endDate;
      }
    }

    if (updates.notes) {
      updateDetails.notes = updates.notes;
    }

    await Calendar.updateEventAsync(eventId, updateDetails);
    return true;
  } catch (error) {
    console.error('Error updating calendar event:', error);
    return false;
  }
}

/**
 * Delete a calendar event
 */
export async function deleteCalendarEvent(eventId: string): Promise<boolean> {
  try {
    const hasPermission = await requestCalendarPermission();
    if (!hasPermission) return false;

    await Calendar.deleteEventAsync(eventId);
    return true;
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    return false;
  }
}

/**
 * Check if calendar permission has been granted
 */
export async function hasCalendarPermission(): Promise<boolean> {
  try {
    const { status } = await Calendar.getCalendarPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

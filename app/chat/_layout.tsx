import { Ionicons } from '@expo/vector-icons';
import type {
    MaterialTopTabNavigationEventMap,
    MaterialTopTabNavigationOptions,
} from '@react-navigation/material-top-tabs';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import {
    useTheme,
    type ParamListBase,
    type TabNavigationState,
} from '@react-navigation/native';
import { withLayoutContext } from 'expo-router';

const { Navigator } = createMaterialTopTabNavigator();

const MaterialTopTabs = withLayoutContext<
  MaterialTopTabNavigationOptions,
  typeof Navigator,
  TabNavigationState<ParamListBase>,
  MaterialTopTabNavigationEventMap
>(Navigator);

export default function ChatTabsLayout() {
  const { colors } = useTheme();
  
  return (
    <MaterialTopTabs
      initialRouteName='index'
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: 'grey',
        tabBarLabelStyle: {
          fontSize: 14,
          textTransform: 'capitalize',
          fontWeight: '600',
        },
        tabBarIndicatorStyle: {
          backgroundColor: colors.primary,
          height: 3,
        },
        tabBarStyle: {
          backgroundColor: colors.card,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        tabBarScrollEnabled: true,        tabBarItemStyle: { 
          width: 'auto', 
          minWidth: 120,
          paddingHorizontal: 16,
        },
      }}
    >
      <MaterialTopTabs.Screen
        name='index'
        options={{
          title: 'All Chats',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? "chatbubbles" : "chatbubbles-outline"} 
              size={20} 
              color={color} 
            />
          ),
        }}
      />
      <MaterialTopTabs.Screen
        name='unread'
        options={{
          title: 'Unread',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? "mail" : "mail-outline"} 
              size={20} 
              color={color} 
            />
          ),
        }}
      />
      <MaterialTopTabs.Screen
        name='groups'
        options={{
          title: 'Groups',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? "people" : "people-outline"} 
              size={20} 
              color={color} 
            />
          ),
        }}
      />
      <MaterialTopTabs.Screen
        name='pinned'
        options={{
          title: 'Pinned',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? "bookmark" : "bookmark-outline"} 
              size={20} 
              color={color} 
            />
          ),
        }}
      />
    </MaterialTopTabs>
  );
}

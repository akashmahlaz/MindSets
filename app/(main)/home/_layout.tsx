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

export default function MaterialTopTabsLayout() {
  const { colors } = useTheme();
  
  return (
    <MaterialTopTabs
      initialRouteName='overview'
      screenOptions={{
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: 'gray',
        tabBarLabelStyle: {
          fontSize: 14,
          textTransform: 'capitalize',
          fontWeight: 'bold',
        },
        tabBarIndicatorStyle: {
          backgroundColor: colors.primary,
          height: 3,
        },
        tabBarScrollEnabled: true,
        tabBarItemStyle: { width: 'auto', minWidth: 100 },
        tabBarStyle: {
          backgroundColor: colors.card,
        },
      }}
    >
      <MaterialTopTabs.Screen
        name='overview'
        options={{
          title: 'Overview',
        }}
      />
      <MaterialTopTabs.Screen
        name='recent'
        options={{
          title: 'Recent',
        }}
      />
      <MaterialTopTabs.Screen
        name='activity'
        options={{
          title: 'Activity',
        }}
      />
      <MaterialTopTabs.Screen
        name='discover'
        options={{
          title: 'Discover',
        }}
      />
    </MaterialTopTabs>
  );
}

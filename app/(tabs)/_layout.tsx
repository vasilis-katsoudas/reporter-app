import { HapticTab } from '@/components/haptic-tab';
import AntDesign from '@expo/vector-icons/AntDesign';
import { Tabs } from 'expo-router';
import React, { useContext } from 'react';
import { Platform, View } from 'react-native';
import { AuthContext } from '../../context/AuthContext';

export default function TabLayout() {
  const { notifications } = useContext(AuthContext);
  const hasUnread = notifications.some(notif => notif.read === false);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#205933',
        tabBarInactiveTintColor: '#999',
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginBottom: 5,
        },
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 0,
          height: Platform.OS === 'ios' ? 90 : 70, 
          paddingBottom: Platform.OS === 'ios' ? 30 : 12,
          paddingTop: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 10,
        }
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <AntDesign name="home" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          tabBarIcon: ({ color }) => <AntDesign name="global" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Notifications',
          tabBarIcon: ({ color }) => (
            <View>
              <AntDesign name="alert" size={24} color={color} />
              {hasUnread && (
                <View 
                  style={{
                    position: 'absolute',
                    right: -2,
                    top: -2,
                    backgroundColor: '#E53935',
                    width: 9,
                    height: 9,
                    borderRadius: 4.5,
                    borderWidth: 1.5,
                    borderColor: 'white',
                  }} 
                />
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <AntDesign name="user" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
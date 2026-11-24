import { Tabs } from 'expo-router';
import { Text } from 'react-native';

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: '#D32F2F',
      tabBarInactiveTintColor: '#999',
      tabBarStyle: { height: 65, paddingBottom: 8, paddingTop: 8, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee', elevation: 10 },
      tabBarLabelStyle: { fontSize: 11, fontWeight: 'bold' },
    }}>
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: () => <Text style={{ fontSize: 22 }}>🏠</Text> }} />
      <Tabs.Screen name="add" options={{ title: 'Become Donor', tabBarIcon: () => <Text style={{ fontSize: 22 }}>❤️</Text> }} />
      <Tabs.Screen name="emergency" options={{ title: 'Emergency', tabBarIcon: () => <Text style={{ fontSize: 22 }}>🚨</Text> }} />
    </Tabs>
  );
}
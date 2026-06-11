import { Tabs } from "expo-router";
import { Home, Users, Map, ScanQrCode, Siren } from "lucide-react-native";

const ACTIVE = "#f97316";
const INACTIVE = "#6b7280";
const BG = "#0d0d0d";
const BORDER = "#1a1a1a";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: ACTIVE,
        tabBarInactiveTintColor: INACTIVE,
        tabBarStyle: {
          backgroundColor: BG,
          borderTopColor: BORDER,
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "500",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "الرئيسية",
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="pilgrims"
        options={{
          title: "الحجاج",
          tabBarIcon: ({ color, size }) => <Users color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: "الخريطة",
          tabBarIcon: ({ color, size }) => <Map color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: "المسح",
          tabBarIcon: ({ color, size }) => (
            <ScanQrCode color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="support"
        options={{
          title: "البلاغات",
          tabBarIcon: ({ color, size }) => <Siren color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}

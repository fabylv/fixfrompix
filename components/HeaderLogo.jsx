import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Text, TouchableOpacity } from "react-native";

/**
 * Branded logo shown in every screen header.
 * Taps navigate to the dashboard (pass tappable=false on the dashboard itself).
 */
export default function HeaderLogo({ tappable = true }) {
  const router = useRouter();
  return (
    <TouchableOpacity
      onPress={() => tappable && router.replace("/(tabs)/dashboard")}
      activeOpacity={tappable ? 0.7 : 1}
      style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
    >
      <LinearGradient
        colors={["#F59E0B", "#D97706"]}
        style={{ width: 30, height: 30, borderRadius: 9, alignItems: "center", justifyContent: "center" }}
      >
        <Text style={{ fontSize: 15 }}>🔍</Text>
      </LinearGradient>
      <Text style={{ color: "#fff", fontSize: 15, fontWeight: "800", letterSpacing: -0.3 }}>
        FixFromPix
      </Text>
    </TouchableOpacity>
  );
}

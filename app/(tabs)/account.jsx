import * as Linking from "expo-linking";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Platform, Text, TextInput, TouchableOpacity, View } from "react-native";

import { useSafeAreaInsets } from "react-native-safe-area-context";
import HeaderLogo from "../../components/HeaderLogo";
import { isMockMode } from "../../lib/mockData";
import { shadows } from "../../lib/shadow";
import { supabase } from "../../lib/supabase";

function Row({ icon, label, sublabel, onPress, danger }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className="flex-row items-center gap-4 bg-white rounded-2xl px-5 py-4 mb-2.5"
      style={shadows.sm}
    >
      <View className="w-10 h-10 rounded-xl items-center justify-center"
        style={{ backgroundColor: danger ? "rgba(239,68,68,0.1)" : "rgba(245,158,11,0.1)" }}>
        <Text style={{ fontSize: 18 }}>{icon}</Text>
      </View>
      <View className="flex-1">
        <Text style={{ color: danger ? "#EF4444" : "#1A1F2E", fontSize: 15, fontWeight: "600" }}>{label}</Text>
        {sublabel ? <Text className="text-brand-muted text-xs mt-0.5">{sublabel}</Text> : null}
      </View>
      <Text className="text-brand-muted text-lg">›</Text>
    </TouchableOpacity>
  );
}

export default function AccountScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [email, setEmail] = useState(null);
  const [editingEmail, setEditingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [emailSaving, setEmailSaving] = useState(false);
  const [pwResetSent, setPwResetSent] = useState(false);


  useEffect(() => {
    if (isMockMode()) return; // no real user in mock mode
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
  }, []);



  function handleChangeEmail() {
    setNewEmail(email ?? "");
    setEditingEmail(true);
  }

  async function saveNewEmail() {
    const trimmed = newEmail.trim();
    if (!trimmed || trimmed === email) { setEditingEmail(false); return; }
    setEmailSaving(true);
    const { error } = await supabase.auth.updateUser({ email: trimmed });
    setEmailSaving(false);
    if (error) {
      Alert.alert("Error", error.message);
    } else {
      setEditingEmail(false);
      Alert.alert("Check your inbox", "A confirmation link was sent to your new address. Your email will update once confirmed.");
    }
  }

  async function handleChangePassword() {
    if (!email) {
      Alert.alert("Not available", "Could not load your email address. Please restart the app and try again.");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) {
      Alert.alert("Error", error.message);
    } else {
      setPwResetSent(true);
    }
  }

  function handleSupport() {
    Linking.openURL("mailto:support@fixfrompix.app");
  }

  function handlePrivacy() {
    router.push("/privacy");
  }

  function handleSignOut() {
    if (Platform.OS === "web") {
      if (!window.confirm("Sign out? You'll need to sign in again to access your projects.")) return;
      supabase.auth.signOut().finally(() => {
        try { localStorage.clear(); sessionStorage.clear(); } catch (_) {}
        window.location.replace(window.location.origin);
      });
      return;
    }
    Alert.alert("Sign Out", "You'll need to sign in again to access your projects.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: () => supabase.auth.signOut().finally(() => router.replace("/(auth)/login")),
      },
    ]);
  }

  return (
    <View className="flex-1 bg-brand-bg">
      {/* Dark header */}
      <LinearGradient colors={["#1A1F2E", "#252C3D"]}
        style={{ paddingTop: insets.top + 12, paddingBottom: 28, paddingHorizontal: 20, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <HeaderLogo />
        </View>
        <View className="flex-row items-center gap-4">
          <LinearGradient colors={["#F59E0B", "#D97706"]}
            style={{ width: 56, height: 56, borderRadius: 18, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ fontSize: 24 }}>👤</Text>
          </LinearGradient>
          <View>
            <Text className="text-white text-xl font-bold">My Account</Text>
            {email ? <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, marginTop: 2 }}>{email}</Text> : null}
          </View>
        </View>
      </LinearGradient>

      <View className="px-4 pt-6">
        <Text className="text-xs font-bold uppercase tracking-widest text-brand-muted mb-3 ml-1">
          Account
        </Text>
        <Row icon="📧" label="Email" sublabel={email ?? (isMockMode() ? "Demo mode" : "Loading…")} onPress={handleChangeEmail} />

        {/* Inline email editor — cross-platform TextInput approach */}
        {editingEmail && (
          <View className="bg-white rounded-2xl px-5 py-4 mb-2.5" style={shadows.sm}>
            <Text style={{ fontSize: 12, fontWeight: "700", color: "#64748B", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.8 }}>New email address</Text>
            <TextInput
              value={newEmail}
              onChangeText={setNewEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoFocus
              placeholder="you@example.com"
              placeholderTextColor="#9CA3AF"
              style={{ fontSize: 15, color: "#1A1F2E", borderBottomWidth: 1, borderBottomColor: "#FFA12B", paddingBottom: 6, marginBottom: 14 }}
            />
            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity onPress={() => setEditingEmail(false)}
                style={{ flex: 1, borderRadius: 12, borderWidth: 1, borderColor: "#E2E8F0", paddingVertical: 10, alignItems: "center" }}>
                <Text style={{ color: "#64748B", fontWeight: "600", fontSize: 14 }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={saveNewEmail} disabled={emailSaving}
                style={{ flex: 2, borderRadius: 12, backgroundColor: "#FFA12B", paddingVertical: 10, alignItems: "center", opacity: emailSaving ? 0.6 : 1 }}>
                <Text style={{ color: "#fff", fontWeight: "700", fontSize: 14 }}>{emailSaving ? "Saving…" : "Save Email"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        <Row icon="🔒" label="Change Password" sublabel="Update your password" onPress={handleChangePassword} />
        {pwResetSent && (
          <View style={{ backgroundColor: "#F0FDF4", borderWidth: 1, borderColor: "#86EFAC", borderRadius: 16, padding: 14, marginBottom: 10, flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
            <Text style={{ fontSize: 18 }}>✅</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ color: "#166534", fontWeight: "700", fontSize: 14 }}>Password reset email sent!</Text>
              <Text style={{ color: "#166534", fontSize: 13, marginTop: 3, lineHeight: 18 }}>
                Check your inbox at <Text style={{ fontWeight: "700" }}>{email}</Text> for a link to reset your password.
              </Text>
              <TouchableOpacity onPress={() => setPwResetSent(false)} style={{ marginTop: 8 }}>
                <Text style={{ color: "#16A34A", fontSize: 12, fontWeight: "600" }}>Dismiss</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <Text className="text-xs font-bold uppercase tracking-widest text-brand-muted mb-3 ml-1 mt-5">
          General
        </Text>
        <Row icon="❓" label="Help & Support" sublabel="support@fixfrompix.app" onPress={handleSupport} />
        <Row icon="📜" label="Privacy Policy" sublabel="fixfrompix.app/privacy" onPress={handlePrivacy} />
        <Row icon="📋" label="Terms of Service" sublabel="fixfrompix.app/terms" onPress={() => router.push("/terms")} />

        <View className="mt-4">
          <Row icon="🚪" label="Sign Out" danger onPress={handleSignOut} />
        </View>
      </View>
    </View>
  );
}

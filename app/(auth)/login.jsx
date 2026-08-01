import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { shadow } from "../../lib/shadow";
import { supabase } from "../../lib/supabase";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [focusedField, setFocusedField] = useState(null);

  async function handleLogin() {
    setError(null);
    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (error) setError(error.message);
  }

  const inputStyle = (field) => [
    "bg-white/10 border rounded-2xl px-4 py-4 text-white text-base",
    focusedField === field ? "border-brand-amber" : "border-white/20",
  ].join(" ");

  return (
    <LinearGradient
      colors={["#1A1F2E", "#12161F", "#1A1F2E"]}
      style={{ flex: 1 }}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingHorizontal: 28, paddingVertical: 60 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Brand mark */}
          <View className="items-center mb-12">
            <View className="w-20 h-20 rounded-3xl bg-brand-amber items-center justify-center mb-5 shadow-lg"
              style={shadow({ color: "#F59E0B", opacity: 0.4, radius: 20, y: 8 })}>
              <Text style={{ fontSize: 36 }}>🔍</Text>
            </View>
            <Text className="text-white text-4xl font-bold tracking-tight">FixFromPix</Text>
            <Text className="text-white/50 text-sm mt-1.5 text-center">
              AI-powered repair estimates
            </Text>
          </View>

          {/* Card */}
          <View
            className="rounded-3xl overflow-hidden"
            style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" }}
          >
            <View className="px-6 py-7 gap-4">
              <Text className="text-white text-xl font-semibold">Welcome back</Text>

              {/* Email */}
              <View className="gap-1.5">
                <Text className="text-white/60 text-xs font-medium uppercase tracking-wider">Email</Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  onFocus={() => setFocusedField("email")}
                  onBlur={() => setFocusedField(null)}
                  className={inputStyle("email")}
                />
              </View>

              {/* Password */}
              <View className="gap-1.5">
                <Text className="text-white/60 text-xs font-medium uppercase tracking-wider">Password</Text>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  secureTextEntry
                  autoComplete="current-password"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField(null)}
                  className={inputStyle("password")}
                />
              </View>

              {/* Error */}
              {error ? (
                <View className="bg-red-500/20 border border-red-500/40 rounded-xl px-4 py-3">
                  <Text className="text-red-300 text-sm">{error}</Text>
                </View>
              ) : null}

              {/* CTA */}
              <TouchableOpacity
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.85}
                className="mt-1"
              >
                <LinearGradient
                  colors={["#F59E0B", "#D97706"]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={{ borderRadius: 16, paddingVertical: 16, alignItems: "center" }}
                >
                  {loading
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>Sign In →</Text>
                  }
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>

          {/* Sign up link */}
          <View className="flex-row justify-center mt-8">
            <Text className="text-white/40 text-sm">Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push("/(auth)/signup")}>
              <Text className="text-brand-amber text-sm font-semibold">Create one</Text>
            </TouchableOpacity>
          </View>

          {/* Bottom tagline */}
          <View className="items-center mt-12">
            <Text className="text-white/20 text-xs text-center">
              For real estate investors, contractors &amp; landlords
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

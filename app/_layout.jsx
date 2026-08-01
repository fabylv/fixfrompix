import "../global.css";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Slot, useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

import { isMockMode } from "../lib/mockData";
import { supabase } from "../lib/supabase";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

/**
 * Root layout — handles auth state and redirects.
 * Authenticated users land on /(tabs)/dashboard.
 * Unauthenticated users are sent to /(auth)/login.
 */
function AuthGuard() {
  const router = useRouter();
  const segments = useSegments();
  const [session, setSession] = useState(undefined); // undefined = loading

  useEffect(() => {
    // In mock mode, skip auth entirely and go straight to the app
    if (isMockMode()) {
      setSession("mock");
      return;
    }

    // Hydrate session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Listen for auth changes (login, logout, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session === undefined) return; // still loading

    const inAuthGroup = segments[0] === "(auth)";

    const onLanding  = segments.length === 0;          // root "/"
    const onPublic   = ["privacy", "terms"].includes(segments[0]); // public pages

    if (session && (inAuthGroup || onLanding)) {
      router.replace("/(tabs)/dashboard"); // logged-in → skip landing/auth
    } else if (!session && !inAuthGroup && !onLanding && !onPublic) {
      router.replace("/"); // unauthenticated deep link → back to landing
    }
  }, [session, segments]);

  // Show a full-screen loader until the session resolves
  if (session === undefined) {
    return (
      <View className="flex-1 items-center justify-center bg-brand-bg">
        <ActivityIndicator size="large" color="#FFA12B" />
      </View>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthGuard />
    </QueryClientProvider>
  );
}

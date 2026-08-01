import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const AMBER  = "#FFA12B";
const MUTED  = "rgba(255,255,255,0.5)";
const BORDER = "rgba(255,255,255,0.08)";

function Section({ title, children }) {
  return (
    <View style={{ marginBottom: 36 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <View style={{ width: 3, height: 16, borderRadius: 2, backgroundColor: AMBER }} />
        <Text style={{ color: "#fff", fontSize: 18, fontWeight: "700" }}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function P({ children }) {
  return <Text style={{ color: MUTED, fontSize: 15, lineHeight: 26, marginBottom: 12 }}>{children}</Text>;
}

function Bullet({ children }) {
  return (
    <View style={{ flexDirection: "row", gap: 10, marginBottom: 8 }}>
      <Text style={{ color: AMBER, fontSize: 15, marginTop: 1 }}>•</Text>
      <Text style={{ color: MUTED, fontSize: 15, lineHeight: 24, flex: 1 }}>{children}</Text>
    </View>
  );
}

export default function PrivacyPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: "#12161F" }}>
      {/* Header */}
      <LinearGradient colors={["#1A1F2E", "#12161F"]}
        style={{ paddingTop: insets.top + 16, paddingHorizontal: 24, paddingBottom: 24, borderBottomWidth: 1, borderBottomColor: BORDER }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 16 }}>
          <Text style={{ color: AMBER, fontSize: 14, fontWeight: "600" }}>← Back</Text>
        </TouchableOpacity>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <LinearGradient colors={[AMBER, "#D97706"]}
            style={{ width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ fontSize: 18 }}>🔒</Text>
          </LinearGradient>
          <Text style={{ color: "#fff", fontSize: 26, fontWeight: "900", letterSpacing: -0.5 }}>Privacy Policy</Text>
        </View>
        <Text style={{ color: MUTED, fontSize: 13 }}>Last updated: August 1, 2026</Text>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 24, maxWidth: 720, width: "100%", alignSelf: "center" }}>

        <P>FixFromPix ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our mobile and web application.</P>

        <Section title="Information We Collect">
          <P>We collect the following types of information:</P>
          <Bullet>Account information — your email address and password (stored securely via Supabase Auth).</Bullet>
          <Bullet>Photos — images you upload for AI repair analysis. These are stored in our secure cloud storage.</Bullet>
          <Bullet>Project data — property names, repair issues, cost estimates, and contractor information you create within the app.</Bullet>
          <Bullet>Usage data — app interactions, feature usage, and error logs to help us improve the product.</Bullet>
        </Section>

        <Section title="How We Use Your Information">
          <P>Your information is used to:</P>
          <Bullet>Provide, operate, and improve the FixFromPix service.</Bullet>
          <Bullet>Analyze your photos using AI to detect repair issues and generate cost estimates.</Bullet>
          <Bullet>Store and sync your projects across devices.</Bullet>
          <Bullet>Send account-related emails (password resets, security alerts).</Bullet>
          <Bullet>Diagnose technical issues and prevent abuse.</Bullet>
        </Section>

        <Section title="AI Photo Analysis">
          <P>When you upload a photo, it is sent to our AI provider (OpenRouter / Google Gemini) for analysis. Photos are processed to identify repair issues and are not used to train AI models. We do not sell or share your photos with third parties for marketing purposes.</P>
        </Section>

        <Section title="Data Storage & Security">
          <P>Your data is stored using Supabase, a secure cloud platform with row-level security. All data transmission is encrypted via HTTPS/TLS. Access to your data is restricted to your account only — other users cannot see your projects or photos.</P>
        </Section>

        <Section title="Data Retention">
          <P>We retain your data for as long as your account is active. You may delete your account and all associated data at any time by contacting us at support@fixfrompix.app. Photos and project data are permanently deleted within 30 days of an account deletion request.</P>
        </Section>

        <Section title="Third-Party Services">
          <P>FixFromPix uses the following third-party services:</P>
          <Bullet>Supabase — database, authentication, and file storage.</Bullet>
          <Bullet>OpenRouter / Google Gemini — AI image analysis.</Bullet>
          <P>Each service has its own privacy policy. We encourage you to review them.</P>
        </Section>

        <Section title="Your Rights">
          <P>You have the right to:</P>
          <Bullet>Access the personal data we hold about you.</Bullet>
          <Bullet>Request correction of inaccurate data.</Bullet>
          <Bullet>Request deletion of your account and data.</Bullet>
          <Bullet>Opt out of non-essential communications.</Bullet>
          <P>To exercise any of these rights, contact us at support@fixfrompix.app.</P>
        </Section>

        <Section title="Children's Privacy">
          <P>FixFromPix is not intended for use by children under the age of 13. We do not knowingly collect personal information from children. If you believe a child has provided us with personal information, please contact us immediately.</P>
        </Section>

        <Section title="Changes to This Policy">
          <P>We may update this Privacy Policy from time to time. We will notify you of significant changes via email or an in-app notice. Continued use of FixFromPix after changes constitutes acceptance of the updated policy.</P>
        </Section>

        <Section title="Contact Us">
          <P>If you have any questions about this Privacy Policy, please contact us:</P>
          <Bullet>Email: support@fixfrompix.app</Bullet>
          <Bullet>Website: fixfrompix.app</Bullet>
        </Section>

        <View style={{ height: insets.bottom + 40 }} />
      </ScrollView>
    </View>
  );
}

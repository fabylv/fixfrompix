import { LinearGradient } from "expo-linear-gradient";
import { Redirect, useRouter } from "expo-router";
import { Platform, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ── Native: skip landing, go straight to login ────────────────────────────────
if (Platform.OS !== "web") {
  exports.default = function Index() {
    return <Redirect href="/(auth)/login" />;
  };
}

// ── Shared styles ─────────────────────────────────────────────────────────────
const AMBER   = "#FFA12B";
const DARK    = "#1A1F2E";
const DARKER  = "#12161F";
const MUTED   = "rgba(255,255,255,0.5)";

const SEV_BG  = { high: "rgba(239,68,68,0.15)", medium: "rgba(245,158,11,0.15)", low: "rgba(16,185,129,0.15)" };
const SEV_COL = { high: "#EF4444", medium: "#F59E0B", low: "#10B981" };

// ── Sub-components ────────────────────────────────────────────────────────────

function FeatureCard({ icon, title, desc }) {
  return (
    <View style={{ flex: 1, minWidth: 260, backgroundColor: "rgba(255,255,255,0.03)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderRadius: 20, padding: 28 }}>
      <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: "rgba(255,161,43,0.15)", borderWidth: 1, borderColor: "rgba(255,161,43,0.2)", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
        <Text style={{ fontSize: 22 }}>{icon}</Text>
      </View>
      <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700", marginBottom: 8 }}>{title}</Text>
      <Text style={{ color: MUTED, fontSize: 14, lineHeight: 22 }}>{desc}</Text>
    </View>
  );
}

function Step({ num, title, desc, last }) {
  return (
    <View style={{ flexDirection: "row", gap: 20, marginBottom: last ? 0 : 36 }}>
      <View style={{ alignItems: "center" }}>
        <LinearGradient colors={[AMBER, "#D97706"]} style={{ width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: "#fff", fontWeight: "800", fontSize: 15 }}>{num}</Text>
        </LinearGradient>
        {!last && <View style={{ width: 2, flex: 1, backgroundColor: "rgba(255,255,255,0.08)", marginTop: 8 }} />}
      </View>
      <View style={{ flex: 1, paddingTop: 8, paddingBottom: last ? 0 : 8 }}>
        <Text style={{ color: "#fff", fontSize: 17, fontWeight: "700", marginBottom: 6 }}>{title}</Text>
        <Text style={{ color: MUTED, fontSize: 14, lineHeight: 22 }}>{desc}</Text>
      </View>
    </View>
  );
}

function MockIssue({ icon, label, category, sev, cost }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
      <View style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: SEV_BG[sev], alignItems: "center", justifyContent: "center" }}>
        <Text style={{ fontSize: 13 }}>{icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: "#fff", fontSize: 13, fontWeight: "600" }}>{label}</Text>
        <Text style={{ color: MUTED, fontSize: 11, marginTop: 2 }}>{category} · <Text style={{ color: SEV_COL[sev], fontWeight: "700" }}>{sev.toUpperCase()}</Text> · ${cost.toLocaleString()}</Text>
      </View>
    </View>
  );
}

function StoreBtn({ icon, sub, name, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}
      style={{ flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "rgba(255,255,255,0.07)", borderWidth: 1, borderColor: "rgba(255,255,255,0.15)", borderRadius: 16, paddingHorizontal: 22, paddingVertical: 14, minWidth: 180 }}>
      <Text style={{ fontSize: 26 }}>{icon}</Text>
      <View>
        <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: "600" }}>{sub}</Text>
        <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>{name}</Text>
      </View>
    </TouchableOpacity>
  );
}

// ── Landing page (web only) ────────────────────────────────────────────────────
export default function LandingPage() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();

  return (
    <ScrollView style={{ flex: 1, backgroundColor: DARKER }} showsVerticalScrollIndicator={false}>

      {/* ── NAV ── */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 32, paddingTop: insets.top + 18, paddingBottom: 18, backgroundColor: "rgba(18,22,31,0.9)", borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.07)", position: "sticky", top: 0, zIndex: 100 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <LinearGradient colors={[AMBER, "#D97706"]} style={{ width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ fontSize: 18 }}>🔍</Text>
          </LinearGradient>
          <Text style={{ color: "#fff", fontSize: 18, fontWeight: "800" }}>FixFromPix</Text>
        </View>
        <TouchableOpacity onPress={() => router.push("/(auth)/login")} activeOpacity={0.85}>
          <LinearGradient colors={[AMBER, "#D97706"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={{ borderRadius: 12, paddingHorizontal: 22, paddingVertical: 10 }}>
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 14 }}>Sign In</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* ── HERO ── */}
      <LinearGradient colors={[DARK, DARKER, DARKER]} style={{ alignItems: "center", paddingHorizontal: 24, paddingTop: 80, paddingBottom: 80 }}>
        {/* Badge */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "rgba(255,161,43,0.12)", borderWidth: 1, borderColor: "rgba(255,161,43,0.3)", borderRadius: 100, paddingHorizontal: 16, paddingVertical: 7, marginBottom: 28 }}>
          <Text style={{ fontSize: 14 }}>✨</Text>
          <Text style={{ color: AMBER, fontSize: 13, fontWeight: "600" }}>AI-Powered Property Inspection</Text>
        </View>

        {/* Headline */}
        <Text style={{ color: "#fff", fontSize: 56, fontWeight: "900", textAlign: "center", lineHeight: 62, letterSpacing: -1.5, marginBottom: 20, maxWidth: 760 }}>
          Snap a photo.{"\n"}<Text style={{ color: AMBER }}>Get a repair estimate.</Text>
        </Text>
        <Text style={{ color: MUTED, fontSize: 18, textAlign: "center", lineHeight: 28, maxWidth: 540, marginBottom: 48 }}>
          Walk any property, photograph each issue, and FixFromPix uses AI to identify every repair and build a full cost estimate — in minutes, not hours.
        </Text>

        {/* Store Buttons */}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 14, justifyContent: "center", marginBottom: 64 }}>
          <StoreBtn icon="🍎" sub="Download on the" name="App Store" onPress={() => {}} />
          <StoreBtn icon="▶️" sub="Get it on" name="Google Play" onPress={() => {}} />
        </View>

        {/* App Mockup */}
        <View style={{ width: "100%", maxWidth: 360, backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderRadius: 28, padding: 24, shadowColor: "#000", shadowOffset: { width: 0, height: 24 }, shadowOpacity: 0.5, shadowRadius: 40 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>123 Main Street</Text>
            <View style={{ backgroundColor: "rgba(255,161,43,0.15)", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}>
              <Text style={{ color: AMBER, fontSize: 11, fontWeight: "700" }}>3 ISSUES</Text>
            </View>
          </View>
          <View style={{ height: 140, borderRadius: 18, backgroundColor: "#252C3D", alignItems: "center", justifyContent: "center", marginBottom: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)" }}>
            <Text style={{ fontSize: 44 }}>📸</Text>
          </View>
          <MockIssue icon="🏠" label="Roof shingles cracked near chimney" category="Roofing" sev="high" cost={3500} />
          <MockIssue icon="🔧" label="Water stain on bathroom ceiling" category="Plumbing" sev="medium" cost={800} />
          <MockIssue icon="🪵" label="Cracked floor tiles near sink" category="Flooring" sev="low" cost={300} />
          <LinearGradient colors={["#252C3D", DARK]} style={{ borderRadius: 14, padding: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
            <View>
              <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase" }}>Total Estimate</Text>
              <Text style={{ color: AMBER, fontSize: 26, fontWeight: "800", marginTop: 2 }}>$4,600</Text>
            </View>
            <Text style={{ fontSize: 28 }}>📊</Text>
          </LinearGradient>
        </View>
      </LinearGradient>

      {/* ── FEATURES ── */}
      <View style={{ backgroundColor: "#171C27", paddingHorizontal: 32, paddingVertical: 80 }}>
        <Text style={{ color: AMBER, fontSize: 12, fontWeight: "700", letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>Features</Text>
        <Text style={{ color: "#fff", fontSize: 38, fontWeight: "800", letterSpacing: -0.8, marginBottom: 12 }}>Everything you need to{"\n"}scope a property fast</Text>
        <Text style={{ color: MUTED, fontSize: 16, lineHeight: 26, marginBottom: 48, maxWidth: 500 }}>Built for professionals who need accurate repair estimates without the guesswork.</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 16 }}>
          <FeatureCard icon="🤖" title="AI Repair Detection" desc="Point your camera at any issue. The AI identifies every repair item — roof, plumbing, electrical, HVAC, flooring, and more." />
          <FeatureCard icon="💰" title="Instant Cost Estimates" desc="Each detected issue comes with a realistic contractor cost estimate, automatically tallied into a running total." />
          <FeatureCard icon="📷" title="Photo-Linked Reports" desc="Every repair item is linked to the photo it came from — so your reports are visual, clear, and easy to share." />
          <FeatureCard icon="🏗️" title="Severity Triage" desc="Issues are automatically ranked high, medium, or low severity — so you know exactly where to focus first." />
          <FeatureCard icon="👷" title="Your Contractor Rates" desc="Add your own contractors and their rates. FixFromPix uses your numbers, not generic guesses. (Coming soon)" />
          <FeatureCard icon="📍" title="Multi-Property Projects" desc="Manage multiple properties at once. Every inspection is saved, searchable, and accessible anywhere." />
        </View>
      </View>

      {/* ── HOW IT WORKS ── */}
      <View style={{ backgroundColor: DARKER, paddingHorizontal: 32, paddingVertical: 80 }}>
        <Text style={{ color: AMBER, fontSize: 12, fontWeight: "700", letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>How it works</Text>
        <Text style={{ color: "#fff", fontSize: 38, fontWeight: "800", letterSpacing: -0.8, marginBottom: 48 }}>From walkthrough to{"\n"}estimate in minutes</Text>
        <View style={{ maxWidth: 600 }}>
          <Step num="1" title="Create a project" desc="Add a property address and give it a name. Takes 10 seconds." />
          <Step num="2" title="Walk and snap" desc="Photograph each area of concern. The AI analyzes each shot in real time and flags every issue it sees." />
          <Step num="3" title="Review your estimate" desc="See a complete list of repairs with severity levels, cost estimates, and the photos they came from." />
          <Step num="4" title="Make your decision" last desc="Use the report to negotiate, budget your rehab, or share with your contractor — all from your phone." />
        </View>
      </View>

      {/* ── WHO IT'S FOR ── */}
      <View style={{ backgroundColor: "#171C27", paddingHorizontal: 32, paddingVertical: 80 }}>
        <Text style={{ color: AMBER, fontSize: 12, fontWeight: "700", letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>Who it's for</Text>
        <Text style={{ color: "#fff", fontSize: 38, fontWeight: "800", letterSpacing: -0.8, marginBottom: 48 }}>Built for anyone who needs{"\n"}to understand repair costs</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 14 }}>
          {[
            { icon: "🏘️", title: "Real Estate Investors", desc: "Scope properties fast and make confident offers backed by real numbers." },
            { icon: "🔨", title: "Contractors", desc: "Generate detailed scopes of work from a photo walkthrough in the field." },
            { icon: "🏠", title: "Landlords", desc: "Document unit conditions and get repair estimates between tenants." },
            { icon: "🏡", title: "Homeowners", desc: "Know what repairs your home needs and what they should cost before calling anyone." },
          ].map((w) => (
            <View key={w.title} style={{ flex: 1, minWidth: 200, backgroundColor: "rgba(255,255,255,0.03)", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", borderRadius: 18, padding: 24, alignItems: "center" }}>
              <Text style={{ fontSize: 32, marginBottom: 12 }}>{w.icon}</Text>
              <Text style={{ color: "#fff", fontSize: 15, fontWeight: "700", marginBottom: 6, textAlign: "center" }}>{w.title}</Text>
              <Text style={{ color: MUTED, fontSize: 13, lineHeight: 20, textAlign: "center" }}>{w.desc}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ── CTA ── */}
      <LinearGradient colors={[DARK, DARKER]} style={{ alignItems: "center", paddingHorizontal: 24, paddingVertical: 80 }}>
        <Text style={{ color: "#fff", fontSize: 42, fontWeight: "800", textAlign: "center", letterSpacing: -0.8, marginBottom: 14 }}>Ready to scope smarter?</Text>
        <Text style={{ color: MUTED, fontSize: 17, textAlign: "center", marginBottom: 44 }}>Download FixFromPix free — no credit card required.</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 14, justifyContent: "center", marginBottom: 32 }}>
          <StoreBtn icon="🍎" sub="Download on the" name="App Store" onPress={() => {}} />
          <StoreBtn icon="▶️" sub="Get it on" name="Google Play" onPress={() => {}} />
        </View>
        <TouchableOpacity onPress={() => router.push("/(auth)/login")} activeOpacity={0.85}>
          <Text style={{ color: AMBER, fontSize: 15, fontWeight: "600" }}>Already have an account? Sign in →</Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* ── FOOTER ── */}
      <View style={{ backgroundColor: "#0E1219", borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.06)", flexDirection: "row", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", paddingHorizontal: 32, paddingVertical: 28, gap: 12 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <LinearGradient colors={[AMBER, "#D97706"]} style={{ width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ fontSize: 13 }}>🔍</Text>
          </LinearGradient>
          <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 14, fontWeight: "700" }}>FixFromPix</Text>
        </View>
        <Text style={{ color: "rgba(255,255,255,0.3)", fontSize: 13 }}>© 2026 FixFromPix. All rights reserved.</Text>
      </View>

    </ScrollView>
  );
}

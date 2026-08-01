import { LinearGradient } from "expo-linear-gradient";
import { Redirect, useRouter } from "expo-router";
import { Platform, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ── Native: go straight to login ──────────────────────────────────────────────
if (Platform.OS !== "web") {
  exports.default = function Index() {
    return <Redirect href="/(auth)/login" />;
  };
}

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  amber:   "#FFA12B",
  amber2:  "#D97706",
  dark:    "#1A1F2E",
  darker:  "#12161F",
  darkest: "#0C0F17",
  card:    "rgba(255,255,255,0.04)",
  border:  "rgba(255,255,255,0.08)",
  muted:   "rgba(255,255,255,0.45)",
  white:   "#ffffff",
};

const SEV = {
  high:   { bg: "rgba(239,68,68,0.15)",   col: "#EF4444" },
  medium: { bg: "rgba(245,158,11,0.15)",  col: "#F59E0B" },
  low:    { bg: "rgba(16,185,129,0.15)",  col: "#10B981" },
};

// ── Reusable pieces ───────────────────────────────────────────────────────────

function GlowDot({ color = C.amber, size = 300, top, left, right, bottom, opacity = 0.12 }) {
  return (
    <View pointerEvents="none" style={{
      position: "absolute", top, left, right, bottom,
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: color, opacity,
      transform: [{ scaleY: 0.5 }],
      // blur via shadow on web
      shadowColor: color, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: size / 2,
    }} />
  );
}

function SectionLabel({ text }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 }}>
      <View style={{ width: 3, height: 14, borderRadius: 2, backgroundColor: C.amber }} />
      <Text style={{ color: C.amber, fontSize: 12, fontWeight: "700", letterSpacing: 2, textTransform: "uppercase" }}>{text}</Text>
    </View>
  );
}

function H2({ children, style }) {
  return <Text style={[{ color: C.white, fontSize: 40, fontWeight: "900", letterSpacing: -1, lineHeight: 48 }, style]}>{children}</Text>;
}

function MockIssue({ icon, label, category, sev, cost }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8, backgroundColor: "rgba(255,255,255,0.03)", borderRadius: 12, padding: 10, borderWidth: 1, borderColor: C.border }}>
      <View style={{ width: 32, height: 32, borderRadius: 9, backgroundColor: SEV[sev].bg, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ fontSize: 14 }}>{icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: C.white, fontSize: 12, fontWeight: "600" }} numberOfLines={1}>{label}</Text>
        <Text style={{ color: C.muted, fontSize: 11, marginTop: 1 }}>{category} · <Text style={{ color: SEV[sev].col, fontWeight: "700" }}>{sev.toUpperCase()}</Text></Text>
      </View>
      <Text style={{ color: C.amber, fontSize: 13, fontWeight: "700" }}>${cost.toLocaleString()}</Text>
    </View>
  );
}

function FeatureCard({ icon, title, desc, accent }) {
  return (
    <View style={{ flex: 1, minWidth: 260, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 24, padding: 28, overflow: "hidden", position: "relative" }}>
      <View style={{ position: "absolute", top: -30, right: -30, width: 100, height: 100, borderRadius: 50, backgroundColor: accent ?? C.amber, opacity: 0.07 }} />
      <LinearGradient colors={[`${accent ?? C.amber}30`, `${accent ?? C.amber}08`]}
        style={{ width: 52, height: 52, borderRadius: 16, alignItems: "center", justifyContent: "center", marginBottom: 18, borderWidth: 1, borderColor: `${accent ?? C.amber}30` }}>
        <Text style={{ fontSize: 24 }}>{icon}</Text>
      </LinearGradient>
      <Text style={{ color: C.white, fontSize: 16, fontWeight: "700", marginBottom: 8 }}>{title}</Text>
      <Text style={{ color: C.muted, fontSize: 14, lineHeight: 22 }}>{desc}</Text>
    </View>
  );
}

function StatCard({ value, label, icon }) {
  return (
    <View style={{ flex: 1, minWidth: 150, alignItems: "center", backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 20, paddingVertical: 28, paddingHorizontal: 20 }}>
      <Text style={{ fontSize: 28, marginBottom: 8 }}>{icon}</Text>
      <Text style={{ color: C.amber, fontSize: 34, fontWeight: "900", letterSpacing: -1 }}>{value}</Text>
      <Text style={{ color: C.muted, fontSize: 13, textAlign: "center", marginTop: 4 }}>{label}</Text>
    </View>
  );
}

function Step({ num, title, desc, last }) {
  return (
    <View style={{ flexDirection: "row", gap: 20, marginBottom: last ? 0 : 40 }}>
      <View style={{ alignItems: "center" }}>
        <LinearGradient colors={[C.amber, C.amber2]}
          style={{ width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center", shadowColor: C.amber, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12 }}>
          <Text style={{ color: C.white, fontWeight: "900", fontSize: 16 }}>{num}</Text>
        </LinearGradient>
        {!last && <View style={{ width: 2, flex: 1, backgroundColor: "rgba(255,255,255,0.07)", marginTop: 10, minHeight: 32 }} />}
      </View>
      <View style={{ flex: 1, paddingTop: 10, paddingBottom: last ? 0 : 12 }}>
        <Text style={{ color: C.white, fontSize: 18, fontWeight: "700", marginBottom: 6 }}>{title}</Text>
        <Text style={{ color: C.muted, fontSize: 15, lineHeight: 24 }}>{desc}</Text>
      </View>
    </View>
  );
}

function StoreBtn({ label, sub, name, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}
      style={{ flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.14)", borderRadius: 18, paddingHorizontal: 24, paddingVertical: 15, minWidth: 190 }}>
      <Text style={{ fontSize: 28 }}>{label}</Text>
      <View>
        <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: "600" }}>{sub}</Text>
        <Text style={{ color: C.white, fontSize: 16, fontWeight: "700" }}>{name}</Text>
      </View>
    </TouchableOpacity>
  );
}

// ── Landing page ──────────────────────────────────────────────────────────────
export default function LandingPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.darkest }} showsVerticalScrollIndicator={false}>

      {/* ── STICKY NAV ── */}
      <View style={{
        position: "sticky", top: 0, zIndex: 100,
        flexDirection: "row", alignItems: "center", justifyContent: "space-between",
        paddingHorizontal: 36, paddingTop: insets.top + 16, paddingBottom: 16,
        backgroundColor: "rgba(12,15,23,0.88)",
        borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)",
        backdropFilter: "blur(20px)",
      }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <LinearGradient colors={[C.amber, C.amber2]}
            style={{ width: 38, height: 38, borderRadius: 11, alignItems: "center", justifyContent: "center", shadowColor: C.amber, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 10 }}>
            <Text style={{ fontSize: 19 }}>🔍</Text>
          </LinearGradient>
          <Text style={{ color: C.white, fontSize: 19, fontWeight: "900", letterSpacing: -0.3 }}>FixFromPix</Text>
        </View>
        <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
          <TouchableOpacity onPress={() => router.push("/(auth)/login")} activeOpacity={0.7}>
            <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, fontWeight: "600" }}>Sign in</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push("/(auth)/signup")} activeOpacity={0.85}>
            <LinearGradient colors={[C.amber, C.amber2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={{ borderRadius: 13, paddingHorizontal: 20, paddingVertical: 10, shadowColor: C.amber, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10 }}>
              <Text style={{ color: C.white, fontWeight: "700", fontSize: 14 }}>Get Started Free</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── HERO ── */}
      <View style={{ backgroundColor: C.darkest, alignItems: "center", paddingHorizontal: 24, paddingTop: 100, paddingBottom: 80, overflow: "hidden", position: "relative" }}>
        <GlowDot top={-80} left="30%" opacity={0.15} size={400} />
        <GlowDot top={200} right="-5%" color="#7C3AED" opacity={0.08} size={300} />

        {/* Badge */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "rgba(255,161,43,0.1)", borderWidth: 1, borderColor: "rgba(255,161,43,0.25)", borderRadius: 100, paddingHorizontal: 16, paddingVertical: 8, marginBottom: 32 }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#10B981" }} />
          <Text style={{ color: C.amber, fontSize: 13, fontWeight: "600" }}>AI-Powered · Free to Download</Text>
        </View>

        {/* Headline */}
        <Text style={{ color: C.white, fontSize: 68, fontWeight: "900", textAlign: "center", lineHeight: 72, letterSpacing: -2.5, marginBottom: 12, maxWidth: 800 }}>
          Snap a photo.
        </Text>
        <Text style={{ fontSize: 68, fontWeight: "900", textAlign: "center", lineHeight: 72, letterSpacing: -2.5, marginBottom: 28, maxWidth: 800 }}>
          <Text style={{ color: C.amber }}>Know the repair cost.</Text>
        </Text>
        <Text style={{ color: C.muted, fontSize: 19, textAlign: "center", lineHeight: 30, maxWidth: 520, marginBottom: 52 }}>
          Walk any property, photograph each issue, and FixFromPix uses AI to identify every repair and build a full estimate — in minutes, not hours.
        </Text>

        {/* CTA Buttons */}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 14, justifyContent: "center", marginBottom: 72 }}>
          <TouchableOpacity onPress={() => router.push("/(auth)/signup")} activeOpacity={0.85}>
            <LinearGradient colors={[C.amber, C.amber2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={{ borderRadius: 18, paddingHorizontal: 32, paddingVertical: 17, shadowColor: C.amber, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.45, shadowRadius: 20 }}>
              <Text style={{ color: C.white, fontWeight: "800", fontSize: 16 }}>Start Free — No Card Needed</Text>
            </LinearGradient>
          </TouchableOpacity>
          <StoreBtn label="🍎" sub="Download on the" name="App Store" onPress={() => {}} />
          <StoreBtn label="▶️" sub="Get it on" name="Google Play" onPress={() => {}} />
        </View>

        {/* App Mockup Card */}
        <View style={{ width: "100%", maxWidth: 400, position: "relative" }}>
          {/* Glow behind card */}
          <View style={{ position: "absolute", bottom: -20, left: "10%", right: "10%", height: 60, backgroundColor: C.amber, opacity: 0.15, borderRadius: 40, shadowColor: C.amber, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 40 }} />
          <View style={{ backgroundColor: "rgba(26,31,46,0.9)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderRadius: 32, padding: 24, shadowColor: "#000", shadowOffset: { width: 0, height: 32 }, shadowOpacity: 0.6, shadowRadius: 48 }}>
            {/* Mockup top bar */}
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
              <View>
                <Text style={{ color: C.muted, fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 1 }}>Project</Text>
                <Text style={{ color: C.white, fontSize: 17, fontWeight: "800" }}>123 Main Street</Text>
              </View>
              <LinearGradient colors={["rgba(255,161,43,0.2)", "rgba(255,161,43,0.08)"]}
                style={{ borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: "rgba(255,161,43,0.25)" }}>
                <Text style={{ color: C.amber, fontSize: 12, fontWeight: "700" }}>3 Issues</Text>
              </LinearGradient>
            </View>
            {/* Photo placeholder */}
            <LinearGradient colors={["#252C3D", "#1A1F2E"]}
              style={{ height: 150, borderRadius: 20, alignItems: "center", justifyContent: "center", marginBottom: 18, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)" }}>
              <Text style={{ fontSize: 42 }}>📸</Text>
              <Text style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, marginTop: 6 }}>AI is analyzing…</Text>
            </LinearGradient>
            {/* Issues */}
            <MockIssue icon="🏠" label="Roof shingles cracked near chimney" category="Roofing" sev="high" cost={3500} />
            <MockIssue icon="🔧" label="Water stain on ceiling" category="Plumbing" sev="medium" cost={800} />
            <MockIssue icon="🪵" label="Cracked floor tiles near sink" category="Flooring" sev="low" cost={300} />
            {/* Total bar */}
            <LinearGradient colors={["#252C3D", C.dark]} style={{ borderRadius: 16, padding: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)" }}>
              <View>
                <Text style={{ color: C.muted, fontSize: 10, fontWeight: "700", letterSpacing: 1.5, textTransform: "uppercase" }}>Running Estimate</Text>
                <Text style={{ color: C.amber, fontSize: 30, fontWeight: "900", letterSpacing: -0.5, marginTop: 2 }}>$4,600</Text>
              </View>
              <View style={{ gap: 5 }}>
                {[["high","#EF4444","1 high"],["medium","#F59E0B","1 med"],["low","#10B981","1 low"]].map(([k,col,lbl]) => (
                  <View key={k} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: col }} />
                    <Text style={{ color: C.muted, fontSize: 11 }}>{lbl}</Text>
                  </View>
                ))}
              </View>
            </LinearGradient>
          </View>
        </View>
      </View>

      {/* ── STATS ── */}
      <View style={{ backgroundColor: "#171C27", paddingHorizontal: 32, paddingVertical: 60 }}>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 14, justifyContent: "center" }}>
          <StatCard value="30s" label="Average analysis time per photo" icon="⚡" />
          <StatCard value="10+" label="Repair categories detected" icon="🔍" />
          <StatCard value="Free" label="Always free to download" icon="🎁" />
          <StatCard value="100%" label="AI-powered, no guesswork" icon="🤖" />
        </View>
      </View>

      {/* ── FEATURES ── */}
      <View style={{ backgroundColor: C.darkest, paddingHorizontal: 32, paddingVertical: 80, overflow: "hidden", position: "relative" }}>
        <GlowDot top={100} right={-50} color="#7C3AED" opacity={0.07} size={350} />
        <SectionLabel text="Features" />
        <H2 style={{ marginBottom: 12 }}>Everything you need{"\n"}to scope a property fast</H2>
        <Text style={{ color: C.muted, fontSize: 16, lineHeight: 26, marginBottom: 48, maxWidth: 500 }}>Built for professionals who need accurate repair estimates without the guesswork.</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 16 }}>
          <FeatureCard icon="🤖" title="AI Repair Detection" desc="Point your camera at any issue. The AI identifies every repair item — roof, plumbing, electrical, HVAC, flooring, and more." accent="#7C3AED" />
          <FeatureCard icon="💰" title="Instant Cost Estimates" desc="Each detected issue comes with a realistic contractor cost estimate, automatically tallied into a running total." accent={C.amber} />
          <FeatureCard icon="📷" title="Photo-Linked Reports" desc="Every repair item is linked back to the exact photo it came from — visual, clear, and easy to share." accent="#0EA5E9" />
          <FeatureCard icon="🏗️" title="Severity Triage" desc="Issues are automatically ranked high, medium, or low — so you know exactly where to spend money first." accent="#EF4444" />
          <FeatureCard icon="👷" title="Your Contractor Rates" desc="Add your own contractors and their rates. FixFromPix uses your real numbers, not generic estimates. Coming soon." accent="#10B981" />
          <FeatureCard icon="📍" title="Multi-Property Projects" desc="Manage dozens of properties at once. Every inspection is saved, searchable, and synced across devices." accent="#F59E0B" />
        </View>
      </View>

      {/* ── HOW IT WORKS ── */}
      <View style={{ backgroundColor: "#171C27", paddingHorizontal: 32, paddingVertical: 80 }}>
        <SectionLabel text="How it works" />
        <H2 style={{ marginBottom: 48 }}>From walkthrough to{"\n"}estimate in minutes</H2>
        <View style={{ maxWidth: 600 }}>
          <Step num="1" title="Create a project" desc="Add a property address and give it a name. Your workspace is ready in seconds." />
          <Step num="2" title="Walk the property and snap photos" desc="Photograph each area of concern — inside and out. The AI analyzes every shot in real time." />
          <Step num="3" title="Review your AI-generated estimate" desc="See a full list of repairs ranked by severity, each with a cost estimate and its source photo." />
          <Step num="4" title="Make your decision" last desc="Use the report to negotiate a deal, plan your rehab budget, or hand off to your contractor — from your phone." />
        </View>
      </View>

      {/* ── WHO IT'S FOR ── */}
      <View style={{ backgroundColor: C.darkest, paddingHorizontal: 32, paddingVertical: 80, overflow: "hidden", position: "relative" }}>
        <GlowDot top={50} left={-50} opacity={0.1} size={300} />
        <SectionLabel text="Who it's for" />
        <H2 style={{ marginBottom: 48 }}>Built for anyone who needs{"\n"}to understand repair costs</H2>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 14 }}>
          {[
            { icon: "🏘️", title: "Real Estate Investors", desc: "Scope properties fast and make confident offers backed by real numbers — not guesses.", col: "#7C3AED" },
            { icon: "🔨", title: "Contractors", desc: "Generate detailed scopes of work from a quick photo walkthrough in the field.", col: C.amber },
            { icon: "🏠", title: "Landlords", desc: "Document unit conditions and get instant repair estimates between tenants.", col: "#0EA5E9" },
            { icon: "🏡", title: "Homeowners", desc: "Know what your home actually needs — and what it should cost — before calling anyone.", col: "#10B981" },
          ].map((w) => (
            <View key={w.title} style={{ flex: 1, minWidth: 210, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 22, padding: 28, overflow: "hidden", position: "relative" }}>
              <View style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: 40, backgroundColor: w.col, opacity: 0.08 }} />
              <Text style={{ fontSize: 36, marginBottom: 14 }}>{w.icon}</Text>
              <Text style={{ color: C.white, fontSize: 16, fontWeight: "700", marginBottom: 8 }}>{w.title}</Text>
              <Text style={{ color: C.muted, fontSize: 14, lineHeight: 22 }}>{w.desc}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ── FINAL CTA ── */}
      <View style={{ backgroundColor: "#171C27", alignItems: "center", paddingHorizontal: 24, paddingVertical: 90, overflow: "hidden", position: "relative" }}>
        <GlowDot top={-60} left="40%" opacity={0.14} size={400} />
        <View style={{ backgroundColor: "rgba(255,161,43,0.08)", borderWidth: 1, borderColor: "rgba(255,161,43,0.2)", borderRadius: 28, paddingHorizontal: 40, paddingVertical: 56, alignItems: "center", width: "100%", maxWidth: 680 }}>
          <Text style={{ fontSize: 42 }}>🔍</Text>
          <Text style={{ color: C.white, fontSize: 40, fontWeight: "900", textAlign: "center", letterSpacing: -1, lineHeight: 48, marginTop: 20, marginBottom: 14 }}>
            Ready to scope smarter?
          </Text>
          <Text style={{ color: C.muted, fontSize: 17, textAlign: "center", lineHeight: 28, marginBottom: 40, maxWidth: 420 }}>
            Start for free. No credit card, no setup fees. Just snap and estimate.
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 14, justifyContent: "center", marginBottom: 28 }}>
            <StoreBtn label="🍎" sub="Download on the" name="App Store" onPress={() => {}} />
            <StoreBtn label="▶️" sub="Get it on" name="Google Play" onPress={() => {}} />
          </View>
          <TouchableOpacity onPress={() => router.push("/(auth)/login")} activeOpacity={0.7}>
            <Text style={{ color: C.amber, fontSize: 15, fontWeight: "600" }}>Already have an account? Sign in →</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── FOOTER ── */}
      <View style={{ backgroundColor: C.darkest, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.05)", flexDirection: "row", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", paddingHorizontal: 36, paddingVertical: 28, paddingBottom: insets.bottom + 28, gap: 16 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <LinearGradient colors={[C.amber, C.amber2]} style={{ width: 30, height: 30, borderRadius: 9, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ fontSize: 15 }}>🔍</Text>
          </LinearGradient>
          <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 15, fontWeight: "700" }}>FixFromPix</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
          <TouchableOpacity onPress={() => router.push("/privacy")}>
            <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, fontWeight: "500" }}>Privacy Policy</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push("/terms")}>
            <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, fontWeight: "500" }}>Terms of Service</Text>
          </TouchableOpacity>
          <Text style={{ color: "rgba(255,255,255,0.2)", fontSize: 13 }}>© 2026 FixFromPix</Text>
        </View>
      </View>

    </ScrollView>
  );
}

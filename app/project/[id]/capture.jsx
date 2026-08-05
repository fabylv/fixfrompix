import { CameraView, useCameraPermissions } from "expo-camera";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import { useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  Alert, Image, Platform, ScrollView,
  Text, TouchableOpacity, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import BottomNav from "../../../components/BottomNav";
import HeaderLogo from "../../../components/HeaderLogo";
import { analyzePhoto } from "../../../lib/ai/analyzePhoto";
import { createIssues, updateIssue } from "../../../lib/api/issues";
import { deletePhoto, uploadPhoto } from "../../../lib/api/photos";
import { shadows } from "../../../lib/shadow";

// ─── Constants ────────────────────────────────────────────────────────────────
const SEV_COLOR = { high: "#EF4444", medium: "#F59E0B", low: "#10B981" };
const SEV_BG    = { high: "rgba(239,68,68,0.12)", medium: "rgba(245,158,11,0.12)", low: "rgba(16,185,129,0.12)" };
const CAT_ICON  = { Roofing:"🏠", Plumbing:"🔧", Electrical:"⚡", HVAC:"❄️", Structural:"🏗️", Flooring:"🪵", Painting:"🎨", Other:"📋" };
const CONFIDENCE_CLOSER = 0.6; // below this => suggest closer photo

// ─── Brightness check (web only — native relies on AI quality check) ──────────
async function checkBrightnessWeb(uri) {
  return new Promise((resolve) => {
    try {
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const scale  = Math.min(1, 100 / Math.max(img.width, img.height));
        canvas.width  = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        let total = 0;
        for (let i = 0; i < data.length; i += 4) {
          total += (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
        }
        const avg = total / (data.length / 4);
        resolve(avg); // 0–255; < 40 = very dark
      };
      img.onerror = () => resolve(128); // assume fine
      img.src = uri;
    } catch {
      resolve(128);
    }
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function GuidanceOverlay({ followUpLabel }) {
  return (
    <View style={{ position:"absolute", inset:0, pointerEvents:"none" }}>
      {/* Corner brackets */}
      {[
        { top:40, left:20 },
        { top:40, right:20 },
        { bottom:120, left:20 },
        { bottom:120, right:20 },
      ].map((pos, i) => (
        <View key={i} style={{
          position:"absolute", ...pos,
          width:28, height:28,
          borderColor:"rgba(245,158,11,0.7)",
          borderTopWidth: pos.top !== undefined ? 3 : 0,
          borderBottomWidth: pos.bottom !== undefined ? 3 : 0,
          borderLeftWidth: pos.left !== undefined ? 3 : 0,
          borderRightWidth: pos.right !== undefined ? 3 : 0,
        }} />
      ))}
      {/* Label */}
      {followUpLabel ? (
        <View style={{ position:"absolute", top:16, left:16, right:16, backgroundColor:"rgba(245,158,11,0.9)", borderRadius:12, paddingHorizontal:14, paddingVertical:8 }}>
          <Text style={{ color:"#1A1F2E", fontSize:12, fontWeight:"700", textAlign:"center" }}>📸 {followUpLabel}</Text>
        </View>
      ) : (
        <View style={{ position:"absolute", top:16, left:16, right:16, backgroundColor:"rgba(0,0,0,0.45)", borderRadius:12, paddingHorizontal:14, paddingVertical:8 }}>
          <Text style={{ color:"rgba(255,255,255,0.85)", fontSize:12, textAlign:"center" }}>
            💡 Wide shot — capture the full room or area
          </Text>
        </View>
      )}
    </View>
  );
}

function PhotoCard({ photo, onRetake, onDelete, onRetryAnalysis }) {
  const { status, uri, result, uploadFailed } = photo;
  const analyzing = status === "analyzing";
  const isError   = status === "error";
  const isPoor    = result?.quality === "poor";
  const isGood    = result?.quality === "good";
  const issues    = result?.issues ?? [];

  return (
    <View className="bg-white rounded-2xl overflow-hidden mb-3" style={shadows.dark}>
      <View style={{ position:"relative" }}>
        <Image source={{ uri }} style={{ width:"100%", height:180 }} resizeMode="cover" />

        {!analyzing && (
          <TouchableOpacity
            onPress={() => onDelete(photo.id)}
            hitSlop={{ top:8, bottom:8, left:8, right:8 }}
            style={{ position:"absolute", top:8, left:8, zIndex:10, width:28, height:28, borderRadius:14, backgroundColor:"rgba(0,0,0,0.55)", alignItems:"center", justifyContent:"center" }}>
            <Text style={{ color:"#fff", fontSize:14, fontWeight:"700", lineHeight:16 }}>✕</Text>
          </TouchableOpacity>
        )}

        {uploadFailed && (
          <View style={{ position:"absolute", top:8, right:8, backgroundColor:"rgba(239,68,68,0.9)", borderRadius:10, paddingHorizontal:8, paddingVertical:4 }}>
            <Text style={{ color:"#fff", fontSize:10, fontWeight:"700" }}>⚠ Upload pending</Text>
          </View>
        )}

        {analyzing && (
          <View style={{ position:"absolute", inset:0, backgroundColor:"rgba(26,31,46,0.7)", alignItems:"center", justifyContent:"center", gap:8 }}>
            <Text style={{ fontSize:32 }}>🔍</Text>
            <Text style={{ color:"#F59E0B", fontWeight:"700", fontSize:14 }}>Analyzing photo…</Text>
            <Text style={{ color:"rgba(255,255,255,0.6)", fontSize:12 }}>AI is detecting repair issues</Text>
          </View>
        )}

        {isError && (
          <View style={{ position:"absolute", inset:0, backgroundColor:"rgba(26,31,46,0.85)", alignItems:"center", justifyContent:"center", gap:8 }}>
            <Text style={{ fontSize:32 }}>❌</Text>
            <Text style={{ color:"#EF4444", fontWeight:"700", fontSize:14 }}>Analysis failed</Text>
            <TouchableOpacity onPress={() => onRetryAnalysis(photo.id)}
              style={{ backgroundColor:"#EF4444", borderRadius:10, paddingHorizontal:16, paddingVertical:7, marginTop:4 }}>
              <Text style={{ color:"#fff", fontWeight:"700", fontSize:12 }}>↩ Retry analysis</Text>
            </TouchableOpacity>
          </View>
        )}

        {isPoor && (
          <View style={{ position:"absolute", bottom:0, left:0, right:0, backgroundColor:"rgba(239,68,68,0.92)", padding:10, flexDirection:"row", alignItems:"center", gap:8 }}>
            <Text style={{ fontSize:16 }}>⚠️</Text>
            <Text style={{ color:"#fff", fontSize:12, fontWeight:"600", flex:1 }}>{result.guidance}</Text>
          </View>
        )}

        {isGood && issues.length > 0 && (
          <View style={{ position:"absolute", top:10, right:10, backgroundColor:"rgba(16,185,129,0.9)", borderRadius:10, paddingHorizontal:10, paddingVertical:4 }}>
            <Text style={{ color:"#fff", fontSize:11, fontWeight:"700" }}>✓ {issues.length} issue{issues.length !== 1 ? "s" : ""} found</Text>
          </View>
        )}
      </View>

      {isPoor && (
        <TouchableOpacity onPress={() => onRetake(photo.id)}
          style={{ margin:12, marginTop:4, backgroundColor:"#EF4444", borderRadius:12, paddingVertical:10, alignItems:"center" }}>
          <Text style={{ color:"#fff", fontWeight:"700", fontSize:13 }}>📷 Retake Photo</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function IssueRow({ issue, onRequestCloserPhoto }) {
  const canCloser = issue.needsCloserLook && issue.followUpStatus === "none";
  const followingUp = issue.followUpStatus === "pending";
  const refined = issue.followUpStatus === "done";

  return (
    <View style={{ flexDirection:"row", alignItems:"flex-start", gap:10, paddingVertical:8, borderBottomWidth:1, borderBottomColor:"rgba(255,255,255,0.06)" }}>
      <View style={{ width:28, height:28, borderRadius:8, backgroundColor:SEV_BG[issue.severity], alignItems:"center", justifyContent:"center", flexShrink:0 }}>
        <Text style={{ fontSize:13 }}>{CAT_ICON[issue.category] ?? "📋"}</Text>
      </View>
      <View style={{ flex:1, gap:4 }}>
        <Text style={{ fontSize:13, fontWeight:"600", color:"#fff" }}>{issue.description}</Text>
        <View style={{ flexDirection:"row", flexWrap:"wrap", alignItems:"center", gap:6 }}>
          <View style={{ paddingHorizontal:7, paddingVertical:2, borderRadius:6, backgroundColor:SEV_BG[issue.severity] }}>
            <Text style={{ fontSize:10, fontWeight:"700", color:SEV_COLOR[issue.severity], textTransform:"uppercase" }}>{issue.severity}</Text>
          </View>
          <Text style={{ fontSize:12, color:"#94A3B8" }}>${(issue.estimated_cost ?? 0).toLocaleString()}</Text>
          {refined && (
            <View style={{ paddingHorizontal:7, paddingVertical:2, borderRadius:6, backgroundColor:"rgba(16,185,129,0.15)" }}>
              <Text style={{ fontSize:10, fontWeight:"700", color:"#10B981" }}>✓ Refined</Text>
            </View>
          )}
        </View>
        {canCloser && (
          <TouchableOpacity onPress={() => onRequestCloserPhoto(issue)}
            style={{ flexDirection:"row", alignItems:"center", gap:5, marginTop:2, alignSelf:"flex-start", backgroundColor:"rgba(245,158,11,0.12)", borderRadius:8, paddingHorizontal:10, paddingVertical:5, borderWidth:1, borderColor:"rgba(245,158,11,0.3)" }}>
            <Text style={{ fontSize:11 }}>📸</Text>
            <Text style={{ fontSize:11, color:"#F59E0B", fontWeight:"700" }}>Closer photo recommended</Text>
          </TouchableOpacity>
        )}
        {followingUp && (
          <View style={{ flexDirection:"row", alignItems:"center", gap:5, marginTop:2 }}>
            <Text style={{ fontSize:11, color:"rgba(245,158,11,0.6)" }}>📸 Follow-up analyzing…</Text>
          </View>
        )}
      </View>
    </View>
  );
}

function IssuePanel({ allIssues, onRequestCloserPhoto }) {
  if (!allIssues.length) return null;
  const total = allIssues.reduce((s, i) => s + (i.estimated_cost ?? 0), 0);
  const closerCount = allIssues.filter((i) => i.needsCloserLook && i.followUpStatus === "none").length;

  return (
    <View style={{ marginHorizontal:16, marginBottom:12, backgroundColor:"rgba(26,31,46,0.95)", borderRadius:20, overflow:"hidden", borderWidth:1, borderColor:"rgba(255,255,255,0.08)" }}>
      {/* Running estimate header */}
      <LinearGradient colors={["#1A1F2E","#252C3D"]} style={{ padding:16, flexDirection:"row", alignItems:"center" }}>
        <View style={{ flex:1 }}>
          <Text style={{ color:"rgba(255,255,255,0.5)", fontSize:11, fontWeight:"700", textTransform:"uppercase", letterSpacing:1 }}>Running Estimate</Text>
          <Text style={{ color:"#F59E0B", fontSize:26, fontWeight:"800", marginTop:2 }}>${total.toLocaleString()}</Text>
          <Text style={{ color:"rgba(255,255,255,0.4)", fontSize:12, marginTop:2 }}>{allIssues.length} issue{allIssues.length !== 1 ? "s" : ""} detected</Text>
        </View>
        <View style={{ gap:5 }}>
          {["high","medium","low"].map((s) => {
            const n = allIssues.filter((i) => i.severity === s).length;
            if (!n) return null;
            return (
              <View key={s} style={{ flexDirection:"row", alignItems:"center", gap:6 }}>
                <View style={{ width:8, height:8, borderRadius:4, backgroundColor:SEV_COLOR[s] }} />
                <Text style={{ color:"rgba(255,255,255,0.6)", fontSize:12 }}>{n} {s}</Text>
              </View>
            );
          })}
        </View>
      </LinearGradient>

      {/* Closer photo nudge */}
      {closerCount > 0 && (
        <View style={{ paddingHorizontal:16, paddingVertical:10, backgroundColor:"rgba(245,158,11,0.08)", borderBottomWidth:1, borderBottomColor:"rgba(245,158,11,0.15)" }}>
          <Text style={{ color:"#F59E0B", fontSize:12, fontWeight:"600" }}>
            📸 {closerCount} issue{closerCount !== 1 ? "s" : ""} could benefit from a closer photo
          </Text>
        </View>
      )}

      {/* Issues list */}
      <View style={{ paddingHorizontal:16, paddingBottom:4 }}>
        {allIssues.map((issue) => (
          <IssueRow key={issue.localId} issue={issue} onRequestCloserPhoto={onRequestCloserPhoto} />
        ))}
      </View>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function CaptureScreen() {
  const insets  = useSafeAreaInsets();
  const { id: projectId } = useLocalSearchParams();
  const router  = useRouter();
  const queryClient = useQueryClient();

  // Camera
  const cameraRef = useRef(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraReady, setCameraReady] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);

  // Follow-up mode
  const [followUpTarget, setFollowUpTarget] = useState(null); // { issueLocalId, label }

  // Photos & issues
  const [photos, setPhotos]       = useState([]);
  const [allIssues, setAllIssues] = useState([]);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const analyzed = photos.filter((p) => p.status === "done").length;
  const analyzing = photos.filter((p) => p.status === "analyzing").length;
  const issueCount = allIssues.length;

  // ── Quality check ──────────────────────────────────────────────────────────
  async function runQualityCheck(uri) {
    if (Platform.OS !== "web") return "ok"; // AI handles quality on native
    try {
      const brightness = await checkBrightnessWeb(uri);
      if (brightness < 40) return "dark";
    } catch { /* ignore */ }
    return "ok";
  }

  // ── Capture (native live camera) ───────────────────────────────────────────
  async function handleShutter() {
    if (!cameraReady || isCapturing || !cameraRef.current) return;
    setIsCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.85, skipProcessing: false });
      await handleCapturedAsset({ uri: photo.uri, mimeType: "image/jpeg", fileName: `capture-${Date.now()}.jpg` });
    } catch (e) {
      Alert.alert("Error", e?.message ?? "Could not capture photo.");
    } finally {
      setIsCapturing(false);
    }
  }

  // ── Capture (web fallback) ─────────────────────────────────────────────────
  function handleWebCapture() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.capture = "environment";
    input.style.cssText = "position:fixed;top:-999px;left:-999px;opacity:0;";
    document.body.appendChild(input);
    input.onchange = async (e) => {
      document.body.removeChild(input);
      const file = e.target.files?.[0];
      if (!file) return;
      const uri = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (ev) => resolve(ev.target.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      await handleCapturedAsset({ uri, mimeType: file.type, fileName: file.name });
    };
    input.click();
  }

  // ── Gallery picker ─────────────────────────────────────────────────────────
  async function handleGallery() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    });
    if (result.canceled || !result.assets?.length) return;
    for (const asset of result.assets) {
      await handleCapturedAsset(asset);
    }
  }

  // ── After capture: quality check → process ────────────────────────────────
  async function handleCapturedAsset(asset) {
    const quality = await runQualityCheck(asset.uri);
    if (quality === "dark") {
      Alert.alert(
        "Poor lighting",
        "This photo looks very dark. Retake for better results?",
        [
          { text: "Retake", style: "cancel" },
          { text: "Use anyway", onPress: () => processAsset(asset) },
        ]
      );
      return;
    }
    processAsset(asset); // fire-and-forget — non-blocking
  }

  // ── Core: upload + analyze ─────────────────────────────────────────────────
  async function processAsset(asset, opts = {}) {
    const { refineIssueLocalId = null } = opts;
    const localId = `photo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    // If this is a follow-up, mark the original issue as "pending"
    if (refineIssueLocalId) {
      setAllIssues((prev) => prev.map((i) =>
        i.localId === refineIssueLocalId ? { ...i, followUpStatus: "pending" } : i
      ));
      setFollowUpTarget(null);
    }

    setPhotos((p) => [{ id: localId, uri: asset.uri, status: "analyzing", result: null, uploadFailed: false }, ...p]);

    let uploadedPhotoId  = null;
    let uploadedPhotoUrl = null;

    // 1. Upload (non-blocking attempt)
    try {
      const uploaded = await uploadPhoto(projectId, {
        uri: asset.uri,
        mimeType: asset.mimeType ?? "image/jpeg",
        fileName: asset.fileName ?? `${localId}.jpg`,
      });
      if (uploaded?.id) {
        uploadedPhotoId  = uploaded.id;
        uploadedPhotoUrl = uploaded.public_url;
        setPhotos((p) => p.map((x) =>
          x.id === localId ? { ...x, dbId: uploaded.id, storagePath: uploaded.storage_path } : x
        ));
      }
    } catch (uploadErr) {
      console.warn("Upload failed:", uploadErr.message);
      setPhotos((p) => p.map((x) =>
        x.id === localId ? { ...x, uploadFailed: true } : x
      ));
      // Don't abort — still try analysis with local URI
    }

    // 2. AI analysis
    try {
      const result = await analyzePhoto({
        photoUrl: uploadedPhotoUrl,
        uri: asset.uri,
        mimeType: asset.mimeType ?? "image/jpeg",
      });

      // 3. Handle follow-up refinement
      if (refineIssueLocalId) {
        if (result.quality === "good" && result.issues?.length) {
          const refined = result.issues[0]; // use the first issue from closer shot
          setAllIssues((prev) => prev.map((i) => {
            if (i.localId !== refineIssueLocalId) return i;
            const updated = {
              ...i,
              severity: refined.severity ?? i.severity,
              estimated_cost: refined.estimated_cost ?? i.estimated_cost,
              confidence: refined.confidence ?? i.confidence,
              followUpStatus: "done",
              needsCloserLook: false,
            };
            // Persist to DB if we have the issue's DB id
            if (i.dbId) {
              updateIssue(i.dbId, {
                severity: updated.severity,
                estimated_cost: updated.estimated_cost,
                confidence: updated.confidence,
              }).catch((e) => console.warn("Issue update failed:", e.message));
            }
            return updated;
          }));
        } else {
          // Follow-up didn't help — clear pending
          setAllIssues((prev) => prev.map((i) =>
            i.localId === refineIssueLocalId ? { ...i, followUpStatus: "none" } : i
          ));
        }
        setPhotos((p) => p.map((x) => x.id === localId ? { ...x, status: "done", result } : x));
        return;
      }

      // 4. New issues from a regular shot
      if (result.quality === "good" && result.issues?.length) {
        let savedIssues = [];
        try {
          savedIssues = await createIssues(result.issues.map((issue) => ({
            project_id: projectId,
            photo_id: uploadedPhotoId,
            description: issue.description,
            category: issue.category,
            severity: issue.severity,
            estimated_cost: issue.estimated_cost ?? null,
            confidence: issue.confidence ?? null,
          })));
        } catch (issueErr) {
          console.warn("Issue save failed:", issueErr.message);
        }

        const newIssues = result.issues.map((issue, idx) => ({
          localId: `issue-${localId}-${idx}`,
          photoLocalId: localId,
          dbId: savedIssues?.[idx]?.id ?? null,
          description: issue.description,
          category: issue.category,
          severity: issue.severity,
          estimated_cost: issue.estimated_cost ?? 0,
          confidence: issue.confidence ?? 1,
          needsCloserLook: issue.needs_closer_look === true || (issue.confidence ?? 1) < CONFIDENCE_CLOSER,
          closerPhotoNote: issue.closer_photo_note ?? null,
          followUpStatus: "none",
        }));
        setAllIssues((prev) => [...prev, ...newIssues]);
      }

      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      queryClient.invalidateQueries({ queryKey: ["photos", projectId] });

      setPhotos((p) => p.map((x) => x.id === localId ? { ...x, status: "done", result } : x));
    } catch (e) {
      console.warn("processAsset error:", e.message);
      setPhotos((p) => p.map((x) => x.id === localId ? { ...x, status: "error", _asset: asset, result: null } : x));
      if (refineIssueLocalId) {
        setAllIssues((prev) => prev.map((i) =>
          i.localId === refineIssueLocalId ? { ...i, followUpStatus: "none" } : i
        ));
      }
    }
  }

  // ── Retry analysis (failed photo) ─────────────────────────────────────────
  async function handleRetryAnalysis(photoId) {
    const photo = photos.find((x) => x.id === photoId);
    if (!photo?._asset) return;
    setPhotos((p) => p.map((x) => x.id === photoId ? { ...x, status: "analyzing", result: null } : x));
    try {
      const result = await analyzePhoto({ uri: photo._asset.uri, mimeType: photo._asset.mimeType ?? "image/jpeg" });
      setPhotos((p) => p.map((x) => x.id === photoId ? { ...x, status: "done", result } : x));
      if (result.quality === "good" && result.issues?.length) {
        const newIssues = result.issues.map((issue, idx) => ({
          localId: `issue-${photoId}-retry-${idx}`,
          photoLocalId: photoId,
          dbId: null,
          description: issue.description,
          category: issue.category,
          severity: issue.severity,
          estimated_cost: issue.estimated_cost ?? 0,
          confidence: issue.confidence ?? 1,
          needsCloserLook: issue.needs_closer_look === true || (issue.confidence ?? 1) < CONFIDENCE_CLOSER,
          closerPhotoNote: issue.closer_photo_note ?? null,
          followUpStatus: "none",
        }));
        setAllIssues((prev) => [...prev, ...newIssues]);
      }
    } catch (e) {
      setPhotos((p) => p.map((x) => x.id === photoId ? { ...x, status: "error" } : x));
    }
  }

  // ── Delete photo ──────────────────────────────────────────────────────────
  async function handleDelete(photoId) {
    const photo = photos.find((x) => x.id === photoId);
    if (photo?.dbId) {
      try {
        await deletePhoto({ id: photo.dbId, storage_path: photo.storagePath });
        queryClient.invalidateQueries({ queryKey: ["projects"] });
        queryClient.invalidateQueries({ queryKey: ["project", projectId] });
        queryClient.invalidateQueries({ queryKey: ["photos", projectId] });
      } catch (e) {
        console.warn("Storage delete failed:", e.message);
      }
    }
    setPhotos((p) => p.filter((x) => x.id !== photoId));
    setAllIssues((prev) => prev.filter((i) => i.photoLocalId !== photoId));
  }

  function handleRetake(photoId) {
    setPhotos((p) => p.filter((x) => x.id !== photoId));
    setAllIssues((prev) => prev.filter((i) => i.photoLocalId !== photoId));
  }

  // ── Closer photo request ──────────────────────────────────────────────────
  function handleRequestCloserPhoto(issue) {
    const label = issue.closerPhotoNote
      ? issue.closerPhotoNote
      : `Closer photo: ${issue.description.slice(0, 50)}`;
    setFollowUpTarget({ issueLocalId: issue.localId, label });
  }

  function handleShutterOrWeb() {
    if (Platform.OS === "web") {
      handleWebCapture();
      return;
    }
    handleShutter();
  }

  // ── Capture button handler (respects follow-up mode) ──────────────────────
  function handleCapturePress() {
    if (Platform.OS === "web") {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.capture = "environment";
      input.style.cssText = "position:fixed;top:-999px;left:-999px;opacity:0;";
      document.body.appendChild(input);
      input.onchange = async (e) => {
        document.body.removeChild(input);
        const file = e.target.files?.[0];
        if (!file) return;
        const uri = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (ev) => resolve(ev.target.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        const asset = { uri, mimeType: file.type, fileName: file.name };
        const quality = await runQualityCheck(uri);
        if (quality === "dark") {
          Alert.alert("Poor lighting", "This photo looks very dark. Retake for better results?", [
            { text: "Retake", style: "cancel" },
            { text: "Use anyway", onPress: () => processAsset(asset, { refineIssueLocalId: followUpTarget?.issueLocalId ?? null }) },
          ]);
          return;
        }
        processAsset(asset, { refineIssueLocalId: followUpTarget?.issueLocalId ?? null });
      };
      input.click();
      return;
    }
    handleShutter();
  }

  // ─── Permission request (native only) ────────────────────────────────────
  async function ensurePermission() {
    if (!permission?.granted) {
      const result = await requestPermission();
      return result.granted;
    }
    return true;
  }

  const needsPermission = Platform.OS !== "web" && !permission?.granted;

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <View style={{ flex:1, backgroundColor:"#12161F" }}>
      {/* Header */}
      <LinearGradient colors={["#1A1F2E","#12161F"]}
        style={{ paddingTop:insets.top + 12, paddingHorizontal:20, paddingBottom:16 }}>
        <View style={{ flexDirection:"row", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
          <TouchableOpacity onPress={() => router.replace(`/project/${projectId}`)}>
            <Text style={{ color:"#F59E0B", fontSize:14, fontWeight:"600" }}>← Back to Report</Text>
          </TouchableOpacity>
          <HeaderLogo />
        </View>
        <Text style={{ color:"#fff", fontSize:22, fontWeight:"800" }}>
          {followUpTarget ? "Follow-up Shot" : "Capture Photos"}
        </Text>
        <Text style={{ color: analyzing > 0 ? "#F59E0B" : "rgba(255,255,255,0.4)", fontSize:13, marginTop:3 }}>
          {analyzing > 0
            ? `🔍 Analyzing ${analyzing} photo${analyzing !== 1 ? "s" : ""}…`
            : analyzed > 0
              ? `${analyzed} photo${analyzed !== 1 ? "s" : ""} · ${issueCount} issue${issueCount !== 1 ? "s" : ""} found`
              : "Walk the property and photograph each area"}
        </Text>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom:100 }}>

        {/* ── Live camera (native) ── */}
        {Platform.OS !== "web" && (
          <View style={{ marginHorizontal:16, marginTop:12, marginBottom:12, borderRadius:20, overflow:"hidden", height:260 }}>
            {needsPermission ? (
              <TouchableOpacity onPress={ensurePermission}
                style={{ flex:1, backgroundColor:"rgba(255,255,255,0.06)", alignItems:"center", justifyContent:"center", gap:10, height:260 }}>
                <Text style={{ fontSize:36 }}>📷</Text>
                <Text style={{ color:"#fff", fontWeight:"700" }}>Allow Camera Access</Text>
                <Text style={{ color:"rgba(255,255,255,0.4)", fontSize:12 }}>Tap to grant permission</Text>
              </TouchableOpacity>
            ) : (
              <View style={{ flex:1, height:260 }}>
                <CameraView
                  ref={cameraRef}
                  style={{ flex:1 }}
                  facing="back"
                  onCameraReady={() => setCameraReady(true)}
                />
                <GuidanceOverlay followUpLabel={followUpTarget?.label ?? null} />
                {/* Shutter button */}
                <TouchableOpacity
                  onPress={handleShutter}
                  disabled={!cameraReady || isCapturing}
                  style={{
                    position:"absolute", bottom:16, alignSelf:"center",
                    width:62, height:62, borderRadius:31,
                    backgroundColor: isCapturing ? "rgba(245,158,11,0.5)" : "#F59E0B",
                    borderWidth:3, borderColor:"#fff",
                    alignItems:"center", justifyContent:"center",
                    opacity: cameraReady ? 1 : 0.4,
                  }}>
                  <Text style={{ fontSize:22 }}>📷</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* ── Web capture / gallery buttons ── */}
        {Platform.OS === "web" && (
          <View style={{ flexDirection:"row", gap:12, paddingHorizontal:16, paddingTop:12, paddingBottom:4 }}>
            <TouchableOpacity onPress={handleCapturePress} activeOpacity={0.85} style={{ flex:1 }}>
              <LinearGradient colors={["#F59E0B","#D97706"]} start={{x:0,y:0}} end={{x:1,y:0}}
                style={{ borderRadius:18, paddingVertical:16, alignItems:"center", flexDirection:"row", justifyContent:"center", gap:8 }}>
                <Text style={{ fontSize:18 }}>📷</Text>
                <Text style={{ color:"#fff", fontWeight:"700", fontSize:14 }}>
                  {followUpTarget ? "Take Follow-up" : "Camera"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
            {!followUpTarget && (
              <TouchableOpacity onPress={handleGallery} activeOpacity={0.85}
                style={{ flex:1, backgroundColor:"rgba(255,255,255,0.08)", borderRadius:18, paddingVertical:16, alignItems:"center", flexDirection:"row", justifyContent:"center", gap:8, borderWidth:1, borderColor:"rgba(255,255,255,0.15)" }}>
                <Text style={{ fontSize:18 }}>🖼️</Text>
                <Text style={{ color:"#fff", fontWeight:"700", fontSize:14 }}>Gallery</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* ── Follow-up dismiss option ── */}
        {followUpTarget && (
          <View style={{ marginHorizontal:16, marginBottom:8, backgroundColor:"rgba(245,158,11,0.08)", borderRadius:14, padding:12, borderWidth:1, borderColor:"rgba(245,158,11,0.2)", flexDirection:"row", alignItems:"center", gap:10 }}>
            <Text style={{ flex:1, color:"#F59E0B", fontSize:12, fontWeight:"600" }}>
              📸 {followUpTarget.label}
            </Text>
            <TouchableOpacity onPress={() => setFollowUpTarget(null)}>
              <Text style={{ color:"rgba(255,255,255,0.4)", fontSize:12 }}>Skip</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Gallery button (native, below camera) ── */}
        {Platform.OS !== "web" && !followUpTarget && (
          <TouchableOpacity onPress={handleGallery} activeOpacity={0.85}
            style={{ marginHorizontal:16, marginBottom:12, backgroundColor:"rgba(255,255,255,0.06)", borderRadius:14, paddingVertical:12, alignItems:"center", flexDirection:"row", justifyContent:"center", gap:8, borderWidth:1, borderColor:"rgba(255,255,255,0.1)" }}>
            <Text style={{ fontSize:16 }}>🖼️</Text>
            <Text style={{ color:"rgba(255,255,255,0.7)", fontWeight:"600", fontSize:13 }}>Choose from Gallery</Text>
          </TouchableOpacity>
        )}

        {/* ── Issues panel ── */}
        <IssuePanel allIssues={allIssues} onRequestCloserPhoto={handleRequestCloserPhoto} />

        {/* ── Photo cards ── */}
        <View style={{ paddingHorizontal:16 }}>
          {photos.length === 0 ? (
            <View style={{ alignItems:"center", paddingTop:32, paddingBottom:60 }}>
              <View style={{ width:96, height:96, borderRadius:28, backgroundColor:"rgba(255,255,255,0.06)", borderWidth:1, borderColor:"rgba(255,255,255,0.1)", alignItems:"center", justifyContent:"center", marginBottom:16 }}>
                <Text style={{ fontSize:44 }}>📸</Text>
              </View>
              <Text style={{ color:"#fff", fontSize:17, fontWeight:"700" }}>No photos yet</Text>
              <Text style={{ color:"rgba(255,255,255,0.4)", fontSize:13, textAlign:"center", marginTop:6, paddingHorizontal:40, lineHeight:20 }}>
                Take a wide shot of each room or area. AI builds your estimate automatically.
              </Text>
            </View>
          ) : (
            photos.map((photo) => (
              <PhotoCard
                key={photo.id}
                photo={photo}
                onRetake={handleRetake}
                onDelete={handleDelete}
                onRetryAnalysis={handleRetryAnalysis}
              />
            ))
          )}
        </View>
      </ScrollView>

      <BottomNav />
    </View>
  );
}

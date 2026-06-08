import React, { useCallback, useEffect, useRef, useState } from "react";
import { useStrudel, DEFAULT_PATTERN } from "../hooks/useStrudel";
import { useLocalPresets } from "../hooks/useLocalPresets";
import { Layout } from "./Layout";
import { Header, type RecordingMode } from "./Header";
import { StrudelEditor } from "./StrudelEditor";
import { PresetsDialog } from "./PresetsDialog";
import {
  SettingsDrawer,
  type ColorScheme,
  type EditorColorPreset,
  type VizMode,
} from "./SettingsDrawer";
import { ParticleField } from "../visualizations/ParticleField";
import { SpectrumAnalyzer } from "../visualizations/SpectrumAnalyzer";
import { FractalField } from "../visualizations/FractalField";
import { buildMidiFromCode } from "../utils/midiExport";
import { convertWebmToMp3, type Mp3QualityPreset } from "../utils/mp3Export";

const EDITOR_COLOR_PRESET_KEY = "strudel:editor-color-preset:v1";
const COLOR_SCHEME_KEY = "strudel:color-scheme:v1";
const VIZ_MODE_KEY = "strudel:viz-mode:v1";
const EDITOR_OPACITY_KEY = "strudel:editor-opacity:v1";
const MP3_QUALITY_KEY = "strudel:mp3-quality:v1";

function isColorScheme(value: string): value is ColorScheme {
  return (
    value === "neon" ||
    value === "pastel" ||
    value === "fire" ||
    value === "ocean"
  );
}

function isVizMode(value: string): value is VizMode {
  return (
    value === "particles" ||
    value === "spectrum" ||
    value === "lissajous" ||
    value === "julia" ||
    value === "both"
  );
}

function isMp3Quality(value: string): value is Mp3QualityPreset {
  return value === "fast" || value === "good" || value === "best";
}

function parseOpacity(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  if (parsed < 0 || parsed > 1) return null;
  return parsed;
}

function isEditorColorPreset(value: string): value is EditorColorPreset {
  return (
    value === "neon" || value === "amber" || value === "ice" || value === "mono"
  );
}

export const AudioVisualizer: React.FC = () => {
  const {
    audioData,
    play,
    stop,
    status,
    error,
    loadMsg,
    activeNote,
    activeNotes,
    activeLiterals,
    activeControls,
    nPulse,
    getRecordingStream,
  } = useStrudel();
  const {
    presets,
    saveAsNew,
    overwrite,
    rename,
    remove,
    getById,
    loadDraft,
    saveDraft,
  } = useLocalPresets();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [presetsOpen, setPresetsOpen] = useState(false);
  const [colorScheme, setColorScheme] = useState<ColorScheme>(() => {
    const saved = localStorage.getItem(COLOR_SCHEME_KEY);
    return saved && isColorScheme(saved) ? saved : "neon";
  });
  const [vizMode, setVizMode] = useState<VizMode>(() => {
    const saved = localStorage.getItem(VIZ_MODE_KEY);
    return saved && isVizMode(saved) ? saved : "particles";
  });
  const [editorOpacity, setEditorOpacity] = useState(() => {
    return parseOpacity(localStorage.getItem(EDITOR_OPACITY_KEY)) ?? 0.45;
  });
  const [editorColorPreset, setEditorColorPreset] = useState<EditorColorPreset>(
    () => {
      const saved = localStorage.getItem(EDITOR_COLOR_PRESET_KEY);
      return saved && isEditorColorPreset(saved) ? saved : "neon";
    },
  );
  const [splashDone, setSplashDone] = useState(false);
  const [code, setCode] = useState(DEFAULT_PATTERN);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 900 : false,
  );
  const [mobileHeaderExpanded, setMobileHeaderExpanded] = useState(false);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordingMode, setRecordingMode] = useState<RecordingMode>("audio");
  const [mp3Quality, setMp3Quality] = useState<Mp3QualityPreset>(() => {
    const saved = localStorage.getItem(MP3_QUALITY_KEY);
    return saved && isMp3Quality(saved) ? saved : "good";
  });
  const [isExportingMp3, setIsExportingMp3] = useState(false);
  const [mp3Progress, setMp3Progress] = useState(0);
  const [mp3Status, setMp3Status] = useState("");
  const [mp3Speed, setMp3Speed] = useState("");
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const displayStreamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);

  const recordingLabel = `${String(Math.floor(recordingSeconds / 60)).padStart(2, "0")}:${String(recordingSeconds % 60).padStart(2, "0")}`;

  const onCodeChange = useCallback((c: string) => {
    setCode(c);
  }, []);

  const handleSplashClick = useCallback(() => {
    setSplashDone(true);
    play(code);
  }, [play, code]);

  const pickAudioMimeType = useCallback((): string | undefined => {
    if (typeof MediaRecorder === "undefined") return undefined;
    const candidates = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/ogg;codecs=opus",
      "audio/ogg",
    ];
    return candidates.find((c) => MediaRecorder.isTypeSupported(c));
  }, []);

  const stopAudioRecording = useCallback(() => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    } else {
      setIsRecording(false);
    }
    if (displayStreamRef.current) {
      displayStreamRef.current.getTracks().forEach((t) => t.stop());
      displayStreamRef.current = null;
    }
  }, []);

  const startAudioRecording = useCallback(async () => {
    try {
      if (status !== "playing") return;
      if (isRecording) return;
      if (isExportingMp3) return;
      if (typeof MediaRecorder === "undefined") {
        window.alert("MediaRecorder is not supported in this browser.");
        return;
      }

      const stream = await getRecordingStream();
      const mimeType = pickAudioMimeType();
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onerror = () => {
        setIsRecording(false);
        if (timerRef.current) {
          window.clearInterval(timerRef.current);
          timerRef.current = null;
        }
      };
      recorder.onstop = async () => {
        const blobType = recorder.mimeType || mimeType || "audio/webm";
        setIsRecording(false);
        setRecordingSeconds(0);

        const blob = new Blob(chunksRef.current, { type: blobType });
        const ts = new Date().toISOString().replace(/[:.]/g, "-");

        try {
          setIsExportingMp3(true);
          setMp3Progress(0);
          setMp3Status("Preparing MP3 export...");

          const mp3Blob = await convertWebmToMp3(blob, {
            quality: mp3Quality,
            onProgress: (p) => setMp3Progress(p),
            onStatus: (s) => setMp3Status(s),
            onSpeed: (speed) => setMp3Speed(speed),
          });

          const url = URL.createObjectURL(mp3Blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `strudel-recording-${ts}.mp3`;
          a.click();
          setTimeout(() => URL.revokeObjectURL(url), 1000);
        } catch (e: any) {
          const ext = blobType.includes("ogg") ? "ogg" : "webm";
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `strudel-recording-${ts}.${ext}`;
          a.click();
          setTimeout(() => URL.revokeObjectURL(url), 1000);
          window.alert(
            `MP3 conversion failed, downloaded original ${ext.toUpperCase()} instead. ${e?.message ?? ""}`,
          );
        } finally {
          setIsExportingMp3(false);
          setMp3Status("");
          setMp3Progress(0);
          setMp3Speed("");
        }
      };

      recorderRef.current = recorder;
      recorder.start(250);
      setRecordingSeconds(0);
      setIsRecording(true);
      timerRef.current = window.setInterval(() => {
        setRecordingSeconds((s) => s + 1);
      }, 1000);
    } catch (e: any) {
      window.alert(e?.message ?? "Failed to start recording.");
    }
  }, [
    getRecordingStream,
    isExportingMp3,
    isRecording,
    mp3Quality,
    pickAudioMimeType,
    status,
  ]);

  const startVideoRecording = useCallback(async () => {
    try {
      if (status !== "playing") return;
      if (isRecording) return;
      if (!navigator.mediaDevices?.getDisplayMedia) {
        window.alert("Display capture is not supported in this browser.");
        return;
      }
      if (typeof MediaRecorder === "undefined") {
        window.alert("MediaRecorder is not supported in this browser.");
        return;
      }

      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 60 },
        audio: false,
      });
      displayStreamRef.current = displayStream;

      const audioStream = await getRecordingStream();
      const combined = new MediaStream();
      displayStream.getVideoTracks().forEach((t) => combined.addTrack(t));
      audioStream.getAudioTracks().forEach((t) => combined.addTrack(t));

      const candidates = [
        "video/webm;codecs=vp9,opus",
        "video/webm;codecs=vp8,opus",
        "video/webm",
      ];
      const mimeType = candidates.find((c) => MediaRecorder.isTypeSupported(c));
      const recorder = mimeType
        ? new MediaRecorder(combined, { mimeType })
        : new MediaRecorder(combined);

      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "video/webm",
        });
        const ts = new Date().toISOString().replace(/[:.]/g, "-");
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `strudel-video-${ts}.webm`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        displayStream.getTracks().forEach((t) => t.stop());
        displayStreamRef.current = null;
        setIsRecording(false);
        setRecordingSeconds(0);
      };
      recorder.onerror = () => {
        setIsRecording(false);
        displayStream.getTracks().forEach((t) => t.stop());
        displayStreamRef.current = null;
      };

      recorderRef.current = recorder;
      recorder.start(250);
      setRecordingSeconds(0);
      setIsRecording(true);
      timerRef.current = window.setInterval(() => {
        setRecordingSeconds((s) => s + 1);
      }, 1000);
    } catch {
      if (displayStreamRef.current) {
        displayStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      displayStreamRef.current = null;
    }
  }, [getRecordingStream, isRecording, status]);

  const exportMidi = useCallback(() => {
    const blob = buildMidiFromCode(code);
    const ts = new Date().toISOString().replace(/[:.]/g, "-");
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `strudel-pattern-${ts}.mid`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, [code]);

  const startRecording = useCallback(() => {
    if (isExportingMp3) return;
    if (recordingMode === "audio") {
      startAudioRecording();
      return;
    }
    if (recordingMode === "video") {
      startVideoRecording();
      return;
    }
    exportMidi();
  }, [
    exportMidi,
    isExportingMp3,
    recordingMode,
    startAudioRecording,
    startVideoRecording,
  ]);

  // Preload modules in the background while idle so first play is instant
  useEffect(() => {
    import("@strudel/core");
    import("@strudel/mini");
    import("@strudel/tonal");
    import("@strudel/webaudio");
    import("@strudel/transpiler");
  }, []);

  useEffect(() => {
    const savedDraft = loadDraft();
    if (savedDraft) setCode(savedDraft);
  }, [loadDraft]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      saveDraft(code);
    }, 900);
    return () => window.clearTimeout(t);
  }, [code, saveDraft]);

  useEffect(() => {
    localStorage.setItem(EDITOR_COLOR_PRESET_KEY, editorColorPreset);
  }, [editorColorPreset]);

  useEffect(() => {
    localStorage.setItem(COLOR_SCHEME_KEY, colorScheme);
  }, [colorScheme]);

  useEffect(() => {
    localStorage.setItem(VIZ_MODE_KEY, vizMode);
  }, [vizMode]);

  useEffect(() => {
    localStorage.setItem(EDITOR_OPACITY_KEY, String(editorOpacity));
  }, [editorOpacity]);

  useEffect(() => {
    localStorage.setItem(MP3_QUALITY_KEY, mp3Quality);
  }, [mp3Quality]);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 900);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        setPresetsOpen(true);
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "o") {
        e.preventDefault();
        setPresetsOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
      if (recorderRef.current && recorderRef.current.state !== "inactive") {
        recorderRef.current.stop();
      }
      if (displayStreamRef.current) {
        displayStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (status !== "playing" && isRecording) {
      stopAudioRecording();
    }
  }, [isRecording, status, stopAudioRecording]);

  const background = (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {(vizMode === "particles" || vizMode === "both") && (
        <div style={{ position: "absolute", inset: 0 }}>
          <ParticleField audioData={audioData} colorScheme={colorScheme} />
        </div>
      )}
      {(vizMode === "spectrum" || vizMode === "both") && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: vizMode === "both" ? 0.4 : 1,
          }}
        >
          <SpectrumAnalyzer
            audioData={audioData}
            colorScheme={colorScheme}
            barCount={96}
            showWaveform
          />
        </div>
      )}
      {vizMode === "lissajous" && (
        <div style={{ position: "absolute", inset: 0 }}>
          <FractalField
            audioData={audioData}
            colorScheme={colorScheme}
            mode="lissajous"
          />
        </div>
      )}
      {vizMode === "julia" && (
        <div style={{ position: "absolute", inset: 0 }}>
          <FractalField
            audioData={audioData}
            colorScheme={colorScheme}
            mode="julia"
          />
        </div>
      )}
    </div>
  );

  return (
    <Layout backgroundVisualizer={background}>
      {/* header */}
      <Header
        status={status}
        isMobile={isMobile}
        onMobileAdvancedOpenChange={setMobileHeaderExpanded}
        onSettingsOpen={() => setDrawerOpen(true)}
        onPresetsOpen={() => setPresetsOpen(true)}
        onPlay={() => play(code)}
        onStop={stop}
        isRecording={isRecording}
        recordingLabel={recordingLabel}
        recordingMode={recordingMode}
        onRecordingMode={setRecordingMode}
        mp3Quality={mp3Quality}
        onMp3Quality={setMp3Quality}
        isExportingMp3={isExportingMp3}
        onRecordStart={startRecording}
        onRecordStop={stopAudioRecording}
      />

      {isExportingMp3 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 80,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(2,4,8,0.72)",
            backdropFilter: "blur(6px)",
          }}
        >
          <div
            style={{
              width: "min(420px, 86vw)",
              background: "rgba(7,12,20,0.92)",
              border: "1px solid rgba(0,255,136,0.28)",
              borderRadius: 12,
              padding: 16,
              boxShadow: "0 0 30px rgba(0,255,136,0.18)",
            }}
          >
            <div
              style={{
                fontFamily: '"JetBrains Mono",monospace',
                fontSize: 12,
                letterSpacing: 1,
                color: "#00ff88",
                marginBottom: 8,
                textTransform: "uppercase",
              }}
            >
              Exporting MP3
            </div>
            <div
              style={{
                color: "#6cd4b8",
                fontSize: 11,
                marginBottom: 6,
                fontFamily: '"JetBrains Mono",monospace',
                textTransform: "uppercase",
                letterSpacing: 1,
              }}
            >
              quality: {mp3Quality}
            </div>
            <div
              style={{
                color: "#9bb3a3",
                fontSize: 12,
                marginBottom: 10,
                fontFamily: '"JetBrains Mono",monospace',
              }}
            >
              {mp3Status || "Converting..."}
            </div>
            <div
              style={{
                width: "100%",
                height: 8,
                borderRadius: 999,
                background: "rgba(255,255,255,0.08)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${Math.max(4, Math.round(mp3Progress * 100))}%`,
                  height: "100%",
                  background: "linear-gradient(90deg,#00ff88,#00d7ff)",
                  boxShadow: "0 0 12px rgba(0,255,136,0.35)",
                  transition: "width 0.18s ease",
                }}
              />
            </div>
            <div
              style={{
                marginTop: 8,
                textAlign: "right",
                color: "#8db9a9",
                fontFamily: '"JetBrains Mono",monospace',
                fontSize: 11,
              }}
            >
              {Math.round(mp3Progress * 100)}%{mp3Speed ? ` • ${mp3Speed}` : ""}
            </div>
          </div>
        </div>
      )}

      {/* main content below header */}
      <div
        style={{
          position: "absolute",
          top: isMobile ? (mobileHeaderExpanded ? 142 : 96) : 48,
          left: 0,
          right: 0,
          bottom: 0,
          padding: isMobile ? 10 : 24,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 760,
            height: isMobile ? "calc(100vh - 124px)" : "70vh",
          }}
        >
          <StrudelEditor
            code={code}
            play={play}
            stop={stop}
            status={status}
            error={error}
            loadMsg={loadMsg}
            opacity={editorOpacity}
            colorPreset={editorColorPreset}
            activeNote={activeNote}
            activeNotes={activeNotes}
            activeLiterals={activeLiterals}
            activeControls={activeControls}
            nPulse={nPulse}
            onCodeChange={onCodeChange}
          />
        </div>
      </div>

      {/* settings drawer */}
      <SettingsDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        colorScheme={colorScheme}
        onColorScheme={setColorScheme}
        vizMode={vizMode}
        onVizMode={setVizMode}
        editorOpacity={editorOpacity}
        onEditorOpacity={setEditorOpacity}
        editorColorPreset={editorColorPreset}
        onEditorColorPreset={setEditorColorPreset}
        audioData={audioData}
      />

      <PresetsDialog
        open={presetsOpen}
        onClose={() => setPresetsOpen(false)}
        currentCode={code}
        presets={presets}
        onSaveAsNew={(name, value) => saveAsNew(name, value)}
        onOverwrite={(id, value, name) => overwrite(id, value, name)}
        onRename={rename}
        onDelete={remove}
        onLoad={(id) => {
          const preset = getById(id);
          if (preset) {
            setCode(preset.code);
            setPresetsOpen(false);
          }
        }}
      />

      {/* splash — covers everything until first click */}
      {!splashDone && (
        <div
          onClick={handleSplashClick}
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 60,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(5,5,12,0.88)",
            backdropFilter: "blur(10px)",
            cursor: "pointer",
            gap: 24,
          }}
        >
          {/* animated ring */}
          <div style={{ position: "relative", width: 80, height: 80 }}>
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                border: "1px solid rgba(0,255,136,0.15)",
                animation: "pulse 2s ease-in-out infinite",
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 8,
                borderRadius: "50%",
                border: "2px solid transparent",
                borderTopColor: "#00ff88",
                animation: "spin 1.2s linear infinite",
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 28,
              }}
            >
              ▶
            </div>
          </div>

          <div style={{ textAlign: "center" }}>
            <p
              style={{
                fontFamily: '"JetBrains Mono",monospace',
                fontSize: 22,
                fontWeight: 700,
                color: "#00ff88",
                letterSpacing: 3,
                textTransform: "uppercase",
                marginBottom: 8,
                textShadow: "0 0 20px rgba(0,255,136,0.6)",
              }}
            >
              STRUDEL STUDIO
            </p>
            <p
              style={{
                fontSize: 13,
                color: "#555",
                fontFamily: '"JetBrains Mono",monospace',
              }}
            >
              click anywhere to start
            </p>
          </div>

          <style>{`
            @keyframes spin { to { transform: rotate(360deg); } }
          `}</style>
        </div>
      )}
    </Layout>
  );
};

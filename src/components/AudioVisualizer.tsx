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
  type VizMode,
} from "./SettingsDrawer";
import { ParticleField } from "../visualizations/ParticleField";
import { SpectrumAnalyzer } from "../visualizations/SpectrumAnalyzer";
import { FractalField } from "../visualizations/FractalField";
import { buildMidiFromCode } from "../utils/midiExport";

export const AudioVisualizer: React.FC = () => {
  const {
    audioData,
    play,
    stop,
    status,
    error,
    loadMsg,
    activeNote,
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
  const [colorScheme, setColorScheme] = useState<ColorScheme>("neon");
  const [vizMode, setVizMode] = useState<VizMode>("particles");
  const [editorOpacity, setEditorOpacity] = useState(0.45);
  const [splashDone, setSplashDone] = useState(false);
  const [code, setCode] = useState(DEFAULT_PATTERN);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordingMode, setRecordingMode] = useState<RecordingMode>("audio");
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
      recorder.onstop = () => {
        const blobType = recorder.mimeType || mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type: blobType });
        const ext = blobType.includes("ogg") ? "ogg" : "webm";
        const ts = new Date().toISOString().replace(/[:.]/g, "-");
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `strudel-recording-${ts}.${ext}`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        setIsRecording(false);
        setRecordingSeconds(0);
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
  }, [getRecordingStream, isRecording, pickAudioMimeType, status]);

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
    if (recordingMode === "audio") {
      startAudioRecording();
      return;
    }
    if (recordingMode === "video") {
      startVideoRecording();
      return;
    }
    exportMidi();
  }, [exportMidi, recordingMode, startAudioRecording, startVideoRecording]);

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
        onSettingsOpen={() => setDrawerOpen(true)}
        onPresetsOpen={() => setPresetsOpen(true)}
        onPlay={() => play(code)}
        onStop={stop}
        isRecording={isRecording}
        recordingLabel={recordingLabel}
        recordingMode={recordingMode}
        onRecordingMode={setRecordingMode}
        onRecordStart={startRecording}
        onRecordStop={stopAudioRecording}
      />

      {/* main content below header */}
      <div
        style={{
          position: "absolute",
          top: 48,
          left: 0,
          right: 0,
          bottom: 0,
          padding: 24,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ width: "100%", maxWidth: 760, height: "70vh" }}>
          <StrudelEditor
            code={code}
            play={play}
            stop={stop}
            status={status}
            error={error}
            loadMsg={loadMsg}
            opacity={editorOpacity}
            activeNote={activeNote}
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

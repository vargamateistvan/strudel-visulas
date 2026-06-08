import React, { useCallback, useEffect, useRef, useState } from "react";
import { useStrudel, DEFAULT_PATTERN } from "../hooks/useStrudel";
import { Layout } from "./Layout";
import { Header } from "./Header";
import { StrudelEditor } from "./StrudelEditor";
import {
  SettingsDrawer,
  type ColorScheme,
  type VizMode,
} from "./SettingsDrawer";
import { ParticleField } from "../visualizations/ParticleField";
import { SpectrumAnalyzer } from "../visualizations/SpectrumAnalyzer";
import { FractalField } from "../visualizations/FractalField";

export const AudioVisualizer: React.FC = () => {
  const { audioData, play, stop, status, error, loadMsg } = useStrudel();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [colorScheme, setColorScheme] = useState<ColorScheme>("neon");
  const [vizMode, setVizMode] = useState<VizMode>("particles");
  const [editorOpacity, setEditorOpacity] = useState(0.45);
  const [splashDone, setSplashDone] = useState(false);

  // Current code lives in a ref so the splash handler can access latest value
  const codeRef = useRef(DEFAULT_PATTERN);
  const setCode = useCallback((c: string) => {
    codeRef.current = c;
  }, []);

  const handleSplashClick = useCallback(() => {
    setSplashDone(true);
    play(codeRef.current);
  }, [play]);

  // Preload modules in the background while idle so first play is instant
  useEffect(() => {
    import("@strudel/core");
    import("@strudel/mini");
    import("@strudel/tonal");
    import("@strudel/webaudio");
    import("@strudel/transpiler");
  }, []);

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
        onPlay={() => play(codeRef.current)}
        onStop={stop}
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
            play={play}
            stop={stop}
            status={status}
            error={error}
            loadMsg={loadMsg}
            opacity={editorOpacity}
            onCodeChange={setCode}
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
                fontFamily: "monospace",
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
            <p style={{ fontSize: 13, color: "#555", fontFamily: "monospace" }}>
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

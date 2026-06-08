import React, { ReactNode } from "react";

interface LayoutProps {
  backgroundVisualizer: ReactNode;
  children: ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({
  backgroundVisualizer,
  children,
}) => (
  <div
    style={{
      position: "relative",
      width: "100vw",
      height: "100vh",
      overflow: "hidden",
      background: "#050508",
    }}
  >
    {/* full-screen background */}
    <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
      {backgroundVisualizer}
    </div>

    {/* radial vignette */}
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 5,
        pointerEvents: "none",
        background:
          "radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.6) 100%)",
      }}
    />

    {/* foreground slot (header + editor) */}
    <div style={{ position: "absolute", inset: 0, zIndex: 20 }}>{children}</div>
  </div>
);

import React from "react";

type HeaderIconButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
  size?: number;
};

export function HeaderIconButton({
  active,
  size = 16,
  style,
  children,
  ...props
}: HeaderIconButtonProps) {
  return (
    <button
      {...props}
      style={{
        width: 40,
        height: 40,
        padding: 0,
        borderRadius: 6,
        border: active ? "1px solid rgba(0,255,136,0.3)" : "1px solid rgba(255,255,255,0.05)",
        background: active ? "rgba(0,255,136,0.12)" : "rgba(255,255,255,0.02)",
        color: active ? "#00ff88" : "#a9b2be",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: props.disabled ? "default" : "pointer",
        transition:
          "border-color 160ms ease, background 160ms ease, color 160ms ease, box-shadow 160ms ease, transform 120ms ease",
        ...(style ?? {}),
      }}
    >
      <span
        style={{
          width: size,
          height: size,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {children}
      </span>
    </button>
  );
}

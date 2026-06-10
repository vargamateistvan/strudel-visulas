import React from "react";

type HeaderIconButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
  size?: number;
  buttonSize?: number;
};

export function HeaderIconButton({
  active,
  size = 16,
  buttonSize = 40,
  style,
  children,
  ...props
}: HeaderIconButtonProps) {
  const isDisabled = Boolean(props.disabled);

  return (
    <button
      {...props}
      style={{
        width: buttonSize,
        height: buttonSize,
        padding: 0,
        borderRadius: 6,
        border: active
          ? "1px solid rgba(0,255,136,0.24)"
          : "1px solid rgba(255,255,255,0.05)",
        background: active ? "rgba(0,255,136,0.08)" : "rgba(255,255,255,0.02)",
        color: active ? "#00ff88" : "#8da1af",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: isDisabled ? "default" : "pointer",
        opacity: isDisabled ? 0.6 : 1,
        transition: "all 0.2s",
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

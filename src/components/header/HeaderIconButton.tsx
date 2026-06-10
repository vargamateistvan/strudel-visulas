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
        borderRadius: 8,
        border: active
          ? "1px solid var(--border-accent)"
          : "1px solid var(--border-faint)",
        background: active ? "var(--surface-active)" : "var(--surface-1)",
        color: active ? "var(--primary)" : "var(--text-soft)",
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

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { HeaderIconButton } from "./HeaderIconButton";

describe("HeaderIconButton", () => {
  it("renders children and calls click handler", () => {
    const onClick = vi.fn();

    render(<HeaderIconButton onClick={onClick}>X</HeaderIconButton>);

    const button = screen.getByRole("button");
    fireEvent.click(button);

    expect(screen.getByText("X")).toBeInTheDocument();
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("applies active styles", () => {
    render(<HeaderIconButton active>Y</HeaderIconButton>);

    const button = screen.getByRole("button");
    expect(button).toHaveStyle({ color: "var(--primary)" });
  });
});

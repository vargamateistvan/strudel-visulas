import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SplashOverlay } from "./SplashOverlay";

describe("SplashOverlay", () => {
  it("renders and handles click", () => {
    const onClick = vi.fn();
    render(<SplashOverlay onClick={onClick} />);

    fireEvent.click(screen.getByText(/click anywhere to start/i));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

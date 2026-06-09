import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Mp3ExportOverlay } from "./Mp3ExportOverlay";

describe("Mp3ExportOverlay", () => {
  it("renders export status information", () => {
    render(
      <Mp3ExportOverlay
        quality="good"
        status="Converting"
        progress={0.5}
        speed="1.2x"
      />,
    );

    expect(screen.getByText(/Exporting MP3/i)).toBeInTheDocument();
    expect(screen.getByText(/quality: good/i)).toBeInTheDocument();
    expect(screen.getByText(/50%/i)).toBeInTheDocument();
  });
});

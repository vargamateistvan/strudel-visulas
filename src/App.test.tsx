import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("./pages/AppPage", () => ({
  AppPage: () => <div data-testid="app-page">App Page</div>,
}));

import App from "./App";

describe("App", () => {
  it("renders the app page", () => {
    render(<App />);

    expect(screen.getByTestId("app-page")).toBeInTheDocument();
  });
});

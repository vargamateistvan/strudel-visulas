# Strudel Visulas

Strudel Visulas is an in-browser live-coding music playground built with React, TypeScript, Vite, and Strudel. It combines a Monaco-based Strudel editor, real-time audio visualizations, preset/sample workflows, recording export, and an AI Composer that can generate Strudel code from natural language prompts.

## Highlights

- Live Strudel coding with Monaco editor and custom language support.
- Audio-reactive visual modes (particles, spectrum, fractal variants, kaleido modes, and more).
- Local preset save/load plus sample workspace tools.
- MP3 export flow with quality presets.
- AI Composer with provider switching (OpenAI ChatGPT and Google Gemini), prompt presets, slash-intent commands, and generation history.

## Tech Stack

- React 19 + TypeScript
- Vite
- Strudel packages (`@strudel/core`, `@strudel/webaudio`, `@strudel/mini`, `@strudel/codemirror`, `@strudel/tonal`)
- Monaco editor
- Vitest + Testing Library

## Getting Started

### Prerequisites

- Node.js 20+
- Yarn (recommended for this repo)

### Install

```bash
yarn install
```

### Run development server

```bash
yarn dev
```

### Build

```bash
yarn build
```

### Preview production build

```bash
yarn preview
```

## Available Scripts

- `yarn dev`: Start Vite dev server.
- `yarn build`: Type-check and build for production.
- `yarn lint`: Run ESLint.
- `yarn test`: Run tests once.
- `yarn test:watch`: Run tests in watch mode.
- `yarn test:coverage`: Run tests with coverage.

## Project Structure (Key Paths)

- `src/components`: UI components and editor/visualizer composition.
- `src/components/audio`: Main workspace shell, AI composer panel, sample browser, and overlays.
- `src/components/settings`: Settings sections including AI Composer settings.
- `src/hooks`: App orchestration hooks (audio, visuals, persistence, AI composer integration).
- `src/ai`: AI prompt/skill shaping logic for Strudel code generation.
- `src/visualizations`: Visualization implementations.

## AI Composer

AI Composer is integrated into the editor workflow and is controlled via Settings.

- Toggle on/off from the Settings drawer.
- Choose provider: ChatGPT (OpenAI) or Gemini (Google).
- Set apply mode: replace current editor code or append generated code.
- Use slash commands in prompt input:
  - `/new ...`
  - `/rework ...`
  - `/variation ...`

For full architecture and implementation details, see [docs/ai-agents.md](docs/ai-agents.md).

## Notes

- API keys are handled in client-side state/localStorage according to your settings.
- If AI generation fails, the UI surfaces provider-friendly error messages and keeps history entries (including failures).

## License

No license file is currently included.

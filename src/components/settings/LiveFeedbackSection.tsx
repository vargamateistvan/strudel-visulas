import { SettingToggle } from "./SettingToggle";

type LiveFeedbackSectionProps = {
  livePulseStrip: boolean;
  onLivePulseStrip: (enabled: boolean) => void;
  livePlayingNoteHighlights: boolean;
  onLivePlayingNoteHighlights: (enabled: boolean) => void;
};

export function LiveFeedbackSection({
  livePulseStrip,
  onLivePulseStrip,
  livePlayingNoteHighlights,
  onLivePlayingNoteHighlights,
}: LiveFeedbackSectionProps) {
  return (
    <>
      <section>
        <p
          style={{
            fontSize: 10,
            color: "var(--text-dim)",
            marginBottom: 10,
            letterSpacing: 1.5,
            textTransform: "uppercase",
            fontFamily: '"JetBrains Mono",monospace',
          }}
        >
          Pulse Strip
        </p>
        <SettingToggle
          label="Pulse Strip"
          description="Show the live pulse strip in the editor."
          enabled={livePulseStrip}
          onToggle={() => onLivePulseStrip(!livePulseStrip)}
        />
      </section>

      <section>
        <p
          style={{
            fontSize: 10,
            color: "var(--text-dim)",
            marginBottom: 10,
            letterSpacing: 1.5,
            textTransform: "uppercase",
            fontFamily: '"JetBrains Mono",monospace',
          }}
        >
          Playing Note Highlight
        </p>
        <SettingToggle
          label="Playing Note Highlight"
          description="Highlight the note currently playing in the editor."
          enabled={livePlayingNoteHighlights}
          onToggle={() =>
            onLivePlayingNoteHighlights(!livePlayingNoteHighlights)
          }
        />
      </section>
    </>
  );
}

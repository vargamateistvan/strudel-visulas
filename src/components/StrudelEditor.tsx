import React, { useCallback, useEffect, useState } from 'react';
import { DEFAULT_PATTERN, type StrudelStatus } from '../hooks/useStrudel';
import { LoadingOverlay } from './LoadingOverlay';

interface StrudelEditorProps {
  play: (code: string) => Promise<void>;
  stop: () => void;
  status: StrudelStatus;
  error: string | null;
  loadMsg: string;
  opacity: number;
  onCodeChange?: (code: string) => void;
}

export const StrudelEditor: React.FC<StrudelEditorProps> = ({
  play, stop, status, error, loadMsg, opacity, onCodeChange,
}) => {
  const [code, setCode] = useState(DEFAULT_PATTERN);
  const updateCode = (c: string) => { setCode(c); onCodeChange?.(c); };
  const isPlaying  = status === 'playing';
  const isLoading       = status === 'loading';

  const handlePlay = useCallback(() => play(code), [play, code]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        isPlaying ? stop() : handlePlay();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isPlaying, handlePlay, stop]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const ta = e.currentTarget, s = ta.selectionStart, end = ta.selectionEnd;
      updateCode(code.slice(0, s) + '  ' + code.slice(end));
      requestAnimationFrame(() => { ta.selectionStart = ta.selectionEnd = s + 2; });
    }
  };

  // Derive panel alpha from opacity prop
  const bgAlpha = (opacity * 0.75).toFixed(2);

  return (
    <div style={{
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      borderRadius: 10,
      overflow: 'hidden',
      background: `rgba(5,5,12,${bgAlpha})`,
      border: '1px solid rgba(0,255,136,0.12)',
      boxShadow: '0 0 40px rgba(0,255,136,0.08), inset 0 0 30px rgba(0,0,0,0.2)',
      backdropFilter: `blur(${Math.round(opacity * 16)}px)`,
    }}>
      {/* loading overlay */}
      {isLoading && <LoadingOverlay message={loadMsg} />}

      {/* error bar */}
      {error && (
        <div style={{
          padding: '6px 14px', flexShrink: 0,
          background: 'rgba(255,51,102,0.1)',
          borderBottom: '1px solid rgba(255,51,102,0.2)',
          fontSize: 11, fontFamily: 'monospace', color: '#ff3366',
          whiteSpace: 'pre-wrap',
        }}>
          {error}
        </div>
      )}

      {/* textarea */}
      <textarea
        value={code}
        onChange={e => updateCode(e.target.value)}
        onKeyDown={onKeyDown}
        spellCheck={false}
        autoComplete="off"
        autoCorrect="off"
        style={{
          flex: 1, width: '100%',
          resize: 'none', border: 'none', outline: 'none',
          padding: '16px 18px',
          fontFamily: '"Fira Code","Cascadia Code",ui-monospace,monospace',
          fontSize: 13,
          lineHeight: 1.75,
          color: `rgba(200,255,220,${Math.max(opacity, 0.6)})`,
          background: 'transparent',
          caretColor: '#00ff88',
        }}
      />
    </div>
  );
};

import React from 'react';

interface LoadingOverlayProps {
  message: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ message }) => (
  <div style={{
    position: 'absolute',
    inset: 0,
    zIndex: 100,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(5,5,12,0.85)',
    backdropFilter: 'blur(8px)',
    gap: 20,
  }}>
    {/* Spinning ring */}
    <div style={{ position: 'relative', width: 56, height: 56 }}>
      <div style={{
        position: 'absolute', inset: 0,
        borderRadius: '50%',
        border: '2px solid rgba(0,255,136,0.1)',
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        borderRadius: '50%',
        border: '2px solid transparent',
        borderTopColor: '#00ff88',
        animation: 'spin 0.9s linear infinite',
      }} />
      <div style={{
        position: 'absolute', inset: 8,
        borderRadius: '50%',
        border: '2px solid transparent',
        borderTopColor: '#00ffff',
        animation: 'spin 1.4s linear infinite reverse',
      }} />
    </div>

    <div style={{ textAlign: 'center' }}>
      <p style={{
        fontFamily: 'monospace',
        fontSize: 12,
        color: '#00ff88',
        letterSpacing: 2,
        textTransform: 'uppercase',
        marginBottom: 6,
      }}>
        {message || 'Loading…'}
      </p>
      <p style={{ fontSize: 10, color: '#333', fontFamily: 'monospace' }}>
        strudel studio
      </p>
    </div>

    <style>{`
      @keyframes spin { to { transform: rotate(360deg); } }
    `}</style>
  </div>
);

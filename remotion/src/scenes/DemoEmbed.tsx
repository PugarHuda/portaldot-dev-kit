import React from 'react';
import {AbsoluteFill, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig, interpolate, spring} from 'remotion';

const ANNOTATIONS: Array<{
  fromSec: number;
  toSec: number;
  text: string;
  badge?: string;
  side: 'left' | 'right';
}> = [
  {fromSec: 21, toSec: 28, text: 'health check + ink! compat', badge: 'pdk doctor', side: 'right'},
  {fromSec: 28, toSec: 37, text: '"how do I get POT?" — solved', badge: 'pdk accounts', side: 'right'},
  {fromSec: 62, toSec: 72, text: 'real POT, on-chain, no mocks', badge: 'pdk send', side: 'right'},
  {fromSec: 95, toSec: 107, text: 'THE HERO — decodes a real failing tx', badge: 'pdk debug --demo', side: 'left'},
  {fromSec: 107, toSec: 115, text: 'UNIQUE — only thing that decodes raw codes', badge: 'pdk explain', side: 'left'},
  {fromSec: 115, toSec: 127, text: 'diagnose + auto-apply fix', badge: 'pdk debug --fix', side: 'left'},
];

export const DemoEmbed: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const secInVideo = frame / fps;

  const fadeIn = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const fadeOut = interpolate(frame, [4380, 4400], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', opacity: fadeIn * fadeOut}}>
      <div
        style={{
          position: 'relative',
          width: 1380,
          height: 1015,
          borderRadius: 14,
          overflow: 'hidden',
          border: '1px solid #21262d',
          boxShadow: '0 24px 60px rgba(0,0,0,0.55), 0 2px 0 rgba(255,255,255,0.04) inset',
        }}
      >
        <OffthreadVideo
          src={staticFile('live-demo-captioned.mp4')}
          muted
          style={{width: '100%', height: '100%', objectFit: 'cover', display: 'block'}}
        />
      </div>

      <div
        style={{
          position: 'absolute',
          top: 36,
          right: 56,
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 16,
          color: '#3fb950',
          letterSpacing: '0.1em',
          background: 'rgba(20,23,29,0.85)',
          padding: '8px 14px',
          borderRadius: 8,
          border: '1px solid #21262d',
        }}
      >
        🏆 pdk · 1st place
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: 36,
          left: 56,
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 14,
          color: '#7d8590',
          letterSpacing: '0.05em',
        }}
      >
        github.com/PugarHuda/portaldot-hackathon-2026-pdk-AmpunBang
      </div>

      {ANNOTATIONS.map((a, i) => {
        const startFrame = a.fromSec * fps;
        const endFrame = a.toSec * fps;
        if (frame < startFrame - 10 || frame > endFrame + 10) return null;

        const popIn = spring({
          frame: frame - startFrame,
          fps,
          config: {damping: 14},
        });
        const popOut = interpolate(frame, [endFrame - 8, endFrame], [1, 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        const opacity = popIn * popOut;

        const isLeft = a.side === 'left';
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: 220 + (i % 3) * 200,
              [isLeft ? 'left' : 'right']: 80,
              opacity,
              transform: `translateX(${(1 - popIn) * (isLeft ? -30 : 30)}px)`,
              maxWidth: 360,
              padding: '16px 20px',
              background: 'rgba(20,23,29,0.94)',
              border: '1px solid #3fb950',
              borderRadius: 12,
              fontFamily: 'Inter, sans-serif',
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            }}
          >
            {a.badge && (
              <div
                style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 16,
                  color: '#3fb950',
                  marginBottom: 6,
                  letterSpacing: '0.02em',
                }}
              >
                {a.badge}
              </div>
            )}
            <div style={{fontSize: 22, color: '#ffffff', lineHeight: 1.3}}>
              {a.text}
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

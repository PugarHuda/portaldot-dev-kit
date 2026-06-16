import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';

export const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const badgeIn = spring({frame: frame - 6, fps, config: {damping: 14}});
  const logoIn = spring({frame: frame - 20, fps, config: {damping: 16}});
  const tagIn = spring({frame: frame - 50, fps, config: {damping: 18}});

  const dotPulse = 1 + 0.08 * Math.sin(frame * 0.18);

  const fadeOut = interpolate(frame, [150, 178], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        opacity: fadeOut,
        justifyContent: 'center',
        alignItems: 'center',
        background: 'radial-gradient(circle at 50% 40%, #14171d 0%, #0a0c10 60%)',
      }}
    >
      <div
        style={{
          opacity: badgeIn,
          transform: `scale(${0.7 + 0.3 * badgeIn})`,
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 24,
          letterSpacing: '0.18em',
          color: '#3fb950',
          fontWeight: 600,
          marginBottom: 32,
          textTransform: 'uppercase',
        }}
      >
        🏆 1st place · Builder Tools · Portaldot S1
      </div>

      <div
        style={{
          opacity: logoIn,
          transform: `translateY(${(1 - logoIn) * 20}px)`,
          fontFamily: 'Inter, sans-serif',
          fontSize: 220,
          fontWeight: 800,
          letterSpacing: '-0.04em',
          color: '#ffffff',
          lineHeight: 0.95,
        }}
      >
        pdk
        <span
          style={{
            color: '#3fb950',
            display: 'inline-block',
            transform: `scale(${dotPulse})`,
            transformOrigin: 'center',
          }}
        >
          .
        </span>
      </div>

      <div
        style={{
          opacity: tagIn,
          transform: `translateY(${(1 - tagIn) * 16}px)`,
          fontFamily: 'Inter, sans-serif',
          fontSize: 36,
          color: '#c9d1d9',
          marginTop: 24,
          maxWidth: 1200,
          textAlign: 'center',
          fontWeight: 400,
        }}
      >
        Portaldot Dev Kit — turn cryptic transaction failures
        <br />
        into clear, actionable diagnoses. Live.
      </div>

      <div
        style={{
          opacity: tagIn * 0.7,
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 22,
          color: '#7d8590',
          marginTop: 56,
          letterSpacing: '0.05em',
        }}
      >
        pip install portaldot-pdk
      </div>
    </AbsoluteFill>
  );
};

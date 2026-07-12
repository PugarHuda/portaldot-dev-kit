import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';

export const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const titleIn = spring({frame: frame - 4, fps, config: {damping: 16}});
  const linksIn = spring({frame: frame - 30, fps, config: {damping: 18}});
  const askIn = spring({frame: frame - 90, fps, config: {damping: 18}});

  const fadeOut = interpolate(frame, [270, 298], [1, 0], {
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
          opacity: titleIn,
          transform: `translateY(${(1 - titleIn) * 20}px)`,
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 22,
          letterSpacing: '0.18em',
          color: '#3fb950',
          textTransform: 'uppercase',
          fontWeight: 600,
          marginBottom: 18,
        }}
      >
        🏆 Vote pdk · Portaldot Dev Kit
      </div>

      <div
        style={{
          opacity: titleIn,
          transform: `translateY(${(1 - titleIn) * 24}px)`,
          fontFamily: 'Inter, sans-serif',
          fontSize: 76,
          fontWeight: 800,
          color: '#ffffff',
          textAlign: 'center',
          letterSpacing: '-0.025em',
          lineHeight: 1.05,
          marginBottom: 40,
        }}
      >
        The standard Portaldot
        <br />
        dev toolkit<span style={{color: '#3fb950'}}>.</span>
      </div>

      <div
        style={{
          opacity: linksIn,
          transform: `translateY(${(1 - linksIn) * 16}px)`,
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 26,
          color: '#c9d1d9',
          textAlign: 'center',
          lineHeight: 1.7,
          marginBottom: 32,
        }}
      >
        <div style={{color: '#3fb950', marginBottom: 8}}>pip install portaldot-pdk</div>
        <div style={{fontSize: 22, color: '#7d8590'}}>
          portaldot-pdk.vercel.app · github.com/PugarHuda/portaldot-dev-kit
        </div>
      </div>

      <div
        style={{
          opacity: askIn,
          transform: `translateY(${(1 - askIn) * 12}px)`,
          fontFamily: 'Inter, sans-serif',
          fontSize: 24,
          color: '#7d8590',
          textAlign: 'center',
          fontStyle: 'italic',
          marginTop: 32,
        }}
      >
        14 commands · real POT gas · zero mocks · built to outlast the hackathon
      </div>
    </AbsoluteFill>
  );
};

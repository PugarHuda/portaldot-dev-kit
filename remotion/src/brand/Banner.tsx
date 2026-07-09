import React from 'react';
import {AbsoluteFill} from 'remotion';
import {loadFont} from '@remotion/google-fonts/Inter';
import {loadFont as loadMono} from '@remotion/google-fonts/JetBrainsMono';
import {Wordmark} from './Logo';

loadFont();
loadMono();

const BG = '#0a0c10';
const INK = '#ededed';
const MUTED = '#7d8590';
const ACCENT = '#3fb950';
const RULE = 'rgba(237,237,237,0.06)';

const LEFT_PAD = 260;

export const XBanner: React.FC = () => {
  return (
    <AbsoluteFill style={{backgroundColor: BG, overflow: 'hidden'}}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          paddingLeft: LEFT_PAD,
          paddingRight: 96,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Wordmark
          size={{font: 208, dot: 60, dotOffsetY: 12}}
          dotColor={ACCENT}
        />

        <div
          style={{
            width: 1,
            height: 240,
            background: RULE,
            marginLeft: 80,
            marginRight: 80,
          }}
        />

        <div
          style={{
            fontFamily: 'Inter, sans-serif',
            fontWeight: 500,
            fontSize: 44,
            color: INK,
            lineHeight: 1.15,
            letterSpacing: '-0.01em',
            maxWidth: 640,
          }}
        >
          Portaldot errors,
          <br />
          decoded.
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: 42,
          right: 96,
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 22,
          color: MUTED,
          letterSpacing: '-0.005em',
        }}
      >
        <span style={{color: ACCENT}}>$</span> pip install portaldot-pdk
      </div>
    </AbsoluteFill>
  );
};

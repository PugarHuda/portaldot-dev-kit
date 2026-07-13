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
const AMBER = '#d29922';
const RULE = 'rgba(237,237,237,0.08)';

const STATS: Array<[string, string]> = [
  ['17', 'commands · full parity'],
  ['38', 'curated fixes'],
  ['1', 'thing Python can’t sign'],
];

export const UpdateCard: React.FC = () => {
  return (
    <AbsoluteFill style={{backgroundColor: BG, overflow: 'hidden'}}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          padding: '96px 110px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
          <Wordmark size={{font: 96, dot: 28, dotOffsetY: 6}} dotColor={ACCENT} />
          <div
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 26,
              fontWeight: 600,
              color: AMBER,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              border: `1px solid ${AMBER}`,
              borderRadius: 8,
              padding: '10px 20px',
            }}
          >
            Update
          </div>
        </div>

        <div>
          <div
            style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 600,
              fontSize: 64,
              color: INK,
              lineHeight: 1.15,
              letterSpacing: '-0.01em',
              maxWidth: 1040,
              marginBottom: 28,
            }}
          >
            pdk-ts now signs Assets pallet calls on Portaldot that Python can&apos;t.
          </div>
          <div
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 24,
              color: MUTED,
              lineHeight: 1.5,
              maxWidth: 980,
            }}
          >
            Python fails at the RPC layer — <span style={{color: '#f47067'}}>&quot;bad signature&quot;</span> —
            before it even reaches a dispatch error. <span style={{color: ACCENT}}>@polkadot/api</span> signs
            the identical call fine.
          </div>
        </div>

        <div>
          <div style={{height: 1, background: RULE, marginBottom: 36}} />
          <div style={{display: 'flex', gap: 72}}>
            {STATS.map(([n, label]) => (
              <div key={label}>
                <div
                  style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontWeight: 700,
                    fontSize: 56,
                    color: ACCENT,
                    lineHeight: 1,
                  }}
                >
                  {n}
                </div>
                <div
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: 20,
                    color: MUTED,
                    marginTop: 8,
                  }}
                >
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

import React from 'react';
import {AbsoluteFill, Audio, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig, interpolate, spring} from 'remotion';

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

const GLOSSARY: Array<{
  fromSec: number;
  toSec: number;
  term: string;
  meaning: string;
}> = [
  {fromSec: 30, toSec: 36, term: 'POT', meaning: 'Portaldot’s native token — like ETH on Ethereum. Pays gas.'},
  {fromSec: 38, toSec: 44, term: 'Pallet', meaning: 'Runtime module. How Portaldot organizes features (balances, staking, etc.)'},
  {fromSec: 48, toSec: 54, term: 'SS58', meaning: 'Portaldot’s address format. Format 42 means dev chain.'},
  {fromSec: 96, toSec: 105, term: 'FailLens', meaning: 'pdk’s decoder. Reads chain runtime metadata — never goes stale.'},
  {fromSec: 108, toSec: 114, term: 'Module index / error index', meaning: 'The raw integers a Portaldot node prints when it rejects a transaction.'},
  {fromSec: 142, toSec: 146, term: 'AI panel', meaning: 'Optional. Always labelled UNVERIFIED — verified KB is the source of truth.'},
];

const CLICK_SFX_TIMES = [6, 20, 28, 38, 42, 47, 52, 62, 72, 95, 107, 115, 127, 133, 140];
const DING_SFX_TIMES = [70, 84, 86, 88, 120];
const ANNOT_WHOOSH_TIMES = ANNOTATIONS.map((a) => a.fromSec);
const GLOSSARY_WHOOSH_TIMES = GLOSSARY.map((g) => g.fromSec);

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
      {CLICK_SFX_TIMES.map((t, i) => (
        <Sequence key={`c${i}`} from={Math.round(t * fps)} durationInFrames={Math.round(0.2 * fps)}>
          <Audio src={staticFile('audio/sfx-click.mp3')} volume={0.5} />
        </Sequence>
      ))}
      {DING_SFX_TIMES.map((t, i) => (
        <Sequence key={`d${i}`} from={Math.round(t * fps)} durationInFrames={Math.round(0.4 * fps)}>
          <Audio src={staticFile('audio/sfx-ding.mp3')} volume={0.45} />
        </Sequence>
      ))}
      {ANNOT_WHOOSH_TIMES.map((t, i) => (
        <Sequence key={`w${i}`} from={Math.round(t * fps)} durationInFrames={Math.round(0.5 * fps)}>
          <Audio src={staticFile('audio/sfx-whoosh.mp3')} volume={0.32} />
        </Sequence>
      ))}
      {GLOSSARY_WHOOSH_TIMES.map((t, i) => (
        <Sequence key={`gw${i}`} from={Math.round(t * fps)} durationInFrames={Math.round(0.5 * fps)}>
          <Audio src={staticFile('audio/sfx-whoosh.mp3')} volume={0.22} />
        </Sequence>
      ))}

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

      <div
        style={{
          position: 'absolute',
          top: 36,
          left: 56,
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 14,
          color: '#7d8590',
          background: 'rgba(20,23,29,0.7)',
          padding: '6px 12px',
          borderRadius: 6,
          border: '1px solid #21262d',
        }}
      >
        🎙 with narration · 🎧 use headphones for full feel
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

      {GLOSSARY.map((g, i) => {
        const startFrame = g.fromSec * fps;
        const endFrame = g.toSec * fps;
        if (frame < startFrame - 8 || frame > endFrame + 8) return null;

        const popIn = spring({
          frame: frame - startFrame,
          fps,
          config: {damping: 16},
        });
        const popOut = interpolate(frame, [endFrame - 8, endFrame], [1, 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        const opacity = popIn * popOut;

        const isLeft = i % 2 === 0;
        return (
          <div
            key={`g${i}`}
            style={{
              position: 'absolute',
              bottom: 110,
              [isLeft ? 'left' : 'right']: 80,
              opacity,
              transform: `translateY(${(1 - popIn) * 12}px)`,
              maxWidth: 320,
              padding: '12px 16px',
              background: 'rgba(11,14,20,0.95)',
              border: '1px dashed #d29922',
              borderRadius: 10,
              fontFamily: 'Inter, sans-serif',
              boxShadow: '0 6px 18px rgba(0,0,0,0.5)',
            }}
          >
            <div
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 12,
                color: '#d29922',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                marginBottom: 4,
              }}
            >
              💡 for beginners
            </div>
            <div style={{fontSize: 18, color: '#ffffff', fontWeight: 600, marginBottom: 4}}>
              {g.term}
            </div>
            <div style={{fontSize: 16, color: '#c9d1d9', lineHeight: 1.35}}>
              {g.meaning}
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

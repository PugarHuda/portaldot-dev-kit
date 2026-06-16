import React from 'react';
import {AbsoluteFill, Audio, Sequence, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';

const TYPING_KEY_FRAMES = [
  3, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 36, 40, 44, 48, 52, 56, 60, 65, 70, 75, 80, 85,
];

const ShotTyping: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const cmd = '$ portaldot.tx.send({ value: 50000, from: alice, to: bob })';
  const reveal = Math.min(cmd.length, Math.floor(frame * 0.85));
  const visible = cmd.slice(0, reveal);
  const blink = Math.floor(frame / 8) % 2;
  const fadeOut = interpolate(frame, [78, 90], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill
      style={{
        opacity: fadeOut,
        justifyContent: 'center',
        alignItems: 'flex-start',
        paddingLeft: 220,
        background: '#0a0c10',
      }}
    >
      <div
        style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 48,
          color: '#c9d1d9',
          letterSpacing: '-0.01em',
          whiteSpace: 'pre',
        }}
      >
        {visible}
        <span style={{color: '#3fb950', opacity: blink}}>▎</span>
      </div>
    </AbsoluteFill>
  );
};

const ShotErrorReveal: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const cmdIn = interpolate(frame, [0, 4], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const errIn = spring({frame: frame - 12, fps, config: {damping: 18}});
  const moduleIn = spring({frame: frame - 36, fps, config: {damping: 16}});
  const errPulse = 1 + 0.06 * Math.sin(frame * 0.32);
  const fadeOut = interpolate(frame, [108, 120], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill
      style={{
        opacity: fadeOut,
        justifyContent: 'center',
        alignItems: 'flex-start',
        paddingLeft: 220,
        background: '#0a0c10',
      }}
    >
      <div
        style={{
          opacity: cmdIn,
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 32,
          color: '#7d8590',
          marginBottom: 32,
        }}
      >
        $ portaldot.tx.send(...)
      </div>

      <div
        style={{
          opacity: errIn,
          transform: `translateX(${(1 - errIn) * -20}px) scale(${errPulse})`,
          transformOrigin: 'left center',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 56,
          color: '#f85149',
          fontWeight: 700,
          letterSpacing: '-0.01em',
          marginBottom: 18,
        }}
      >
        ✗ ExtrinsicFailed
      </div>

      <div
        style={{
          opacity: moduleIn,
          transform: `translateY(${(1 - moduleIn) * 14}px)`,
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 38,
          color: '#c9d1d9',
        }}
      >
        DispatchError <span style={{color: '#7d8590'}}>{'{'}</span>{' '}
        Module: <span style={{color: '#7d8590'}}>{'{'}</span> index: 6, error: 2{' '}
        <span style={{color: '#7d8590'}}>{'}}'}</span>
      </div>
    </AbsoluteFill>
  );
};

const ShotZoomGlitch: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const scale = interpolate(frame, [0, 90], [1, 1.7], {extrapolateRight: 'clamp'});
  const shake = (frame > 30 ? (random(frame) - 0.5) * 12 : 0);
  const shakeY = (frame > 30 ? (random(frame * 1.3) - 0.5) * 8 : 0);
  const chroma = Math.min(1, Math.max(0, (frame - 30) / 40));

  const fadeOut = interpolate(frame, [105, 120], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  const baseCode = 'Module: { index: 6, error: 2 }';

  const layer = (color: string, dx: number, dy: number, opacity: number) => (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 96,
        fontWeight: 700,
        color,
        opacity,
        transform: `translate(${dx}px, ${dy}px) scale(${scale})`,
        letterSpacing: '-0.02em',
        mixBlendMode: 'screen',
      }}
    >
      {baseCode}
    </div>
  );

  return (
    <AbsoluteFill style={{opacity: fadeOut, background: '#0a0c10', overflow: 'hidden'}}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transform: `translate(${shake}px, ${shakeY}px)`,
        }}
      >
        {layer('#f85149', -6 * chroma, 0, 1)}
        {layer('#3fb950', 6 * chroma, 0, 0.6)}
        {layer('#ffffff', 0, 0, 1)}
      </div>

      <AbsoluteFill style={{justifyContent: 'flex-end', paddingBottom: 100, alignItems: 'center'}}>
        <div
          style={{
            opacity: chroma,
            fontFamily: 'Inter, sans-serif',
            fontSize: 40,
            fontStyle: 'italic',
            color: '#7d8590',
          }}
        >
          What does that even mean?
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const ShotTransition: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const dotIn = spring({frame: frame - 4, fps, config: {damping: 12, stiffness: 80}});
  const dotScale = interpolate(frame, [0, 60, 90], [0.05, 1, 1.05], {extrapolateRight: 'clamp'});
  const glow = interpolate(frame, [10, 50], [0, 1], {extrapolateRight: 'clamp'});

  const lineSweep = interpolate(frame, [40, 80], [-1920, 1920], {extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', background: '#0a0c10', overflow: 'hidden'}}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(circle at 50% 50%, rgba(63,185,80,${glow * 0.35}) 0%, transparent 55%)`,
        }}
      />

      <div
        style={{
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: '#3fb950',
          opacity: dotIn,
          transform: `scale(${dotScale})`,
          boxShadow: `0 0 ${80 * glow}px 20px rgba(63,185,80,${0.7 * glow})`,
        }}
      />

      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: 0,
          right: 0,
          height: 2,
          background: 'linear-gradient(90deg, transparent 0%, #3fb950 50%, transparent 100%)',
          transform: `translate(${lineSweep}px, -1px)`,
          opacity: 0.8,
        }}
      />
    </AbsoluteFill>
  );
};

const ShotLogoReveal: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const badgeIn = spring({frame: frame - 0, fps, config: {damping: 14}});
  const pIn = spring({frame: frame - 6, fps, config: {damping: 16}});
  const dIn = spring({frame: frame - 12, fps, config: {damping: 16}});
  const kIn = spring({frame: frame - 18, fps, config: {damping: 16}});
  const dotIn = spring({frame: frame - 26, fps, config: {damping: 12}});
  const tagIn = spring({frame: frame - 40, fps, config: {damping: 18}});
  const ctaIn = spring({frame: frame - 65, fps, config: {damping: 18}});

  const dotPulse = 1 + 0.1 * Math.sin(frame * 0.25);

  const letter = (ch: string, anim: number, color: string = '#fff', dx: number = 0) => (
    <span
      style={{
        display: 'inline-block',
        opacity: anim,
        transform: `translate(${(1 - anim) * dx}px, ${(1 - anim) * 60}px) scale(${0.6 + 0.4 * anim})`,
        color,
      }}
    >
      {ch}
    </span>
  );

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        background: 'radial-gradient(circle at 50% 40%, #14171d 0%, #0a0c10 60%)',
      }}
    >
      <div
        style={{
          opacity: badgeIn,
          transform: `translateY(${(1 - badgeIn) * -10}px)`,
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 24,
          letterSpacing: '0.18em',
          color: '#3fb950',
          fontWeight: 600,
          marginBottom: 24,
          textTransform: 'uppercase',
        }}
      >
        🏆 1st place · Builder Tools · Portaldot S1
      </div>

      <div
        style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: 220,
          fontWeight: 800,
          letterSpacing: '-0.04em',
          lineHeight: 0.95,
        }}
      >
        {letter('p', pIn, '#fff', -60)}
        {letter('d', dIn, '#fff', 0)}
        {letter('k', kIn, '#fff', 60)}
        <span
          style={{
            display: 'inline-block',
            opacity: dotIn,
            color: '#3fb950',
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
          transform: `translateY(${(1 - tagIn) * 14}px)`,
          fontFamily: 'Inter, sans-serif',
          fontSize: 36,
          color: '#c9d1d9',
          marginTop: 24,
          maxWidth: 1200,
          textAlign: 'center',
        }}
      >
        Portaldot Dev Kit — decode any failed transaction.
      </div>

      <div
        style={{
          opacity: ctaIn,
          transform: `translateY(${(1 - ctaIn) * 10}px)`,
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 26,
          color: '#3fb950',
          marginTop: 48,
          letterSpacing: '0.05em',
          padding: '12px 24px',
          border: '2px solid #21262d',
          borderRadius: 10,
          background: 'rgba(20,23,29,0.55)',
        }}
      >
        pip install portaldot-pdk
      </div>
    </AbsoluteFill>
  );
};

export const Intro: React.FC = () => {
  return (
    <AbsoluteFill>
      <Sequence from={0} durationInFrames={90}>
        <ShotTyping />
        {TYPING_KEY_FRAMES.map((f, i) => (
          <Sequence key={i} from={f} durationInFrames={3}>
            <Audio src={staticFile('audio/sfx-type.mp3')} volume={0.55} />
          </Sequence>
        ))}
      </Sequence>

      <Sequence from={90} durationInFrames={120}>
        <ShotErrorReveal />
        <Audio src={staticFile('audio/vo-intro-hook.mp3')} volume={1} />
        <Sequence from={10} durationInFrames={20}>
          <Audio src={staticFile('audio/sfx-error.mp3')} volume={0.85} />
        </Sequence>
        <Sequence from={36} durationInFrames={10}>
          <Audio src={staticFile('audio/sfx-glitch.mp3')} volume={0.4} />
        </Sequence>
      </Sequence>

      <Sequence from={210} durationInFrames={120}>
        <ShotZoomGlitch />
        <Audio src={staticFile('audio/vo-intro-no-fix.mp3')} volume={1} />
        <Sequence from={0} durationInFrames={10}>
          <Audio src={staticFile('audio/sfx-glitch.mp3')} volume={0.7} />
        </Sequence>
        <Sequence from={45} durationInFrames={8}>
          <Audio src={staticFile('audio/sfx-glitch.mp3')} volume={0.4} />
        </Sequence>
      </Sequence>

      <Sequence from={330} durationInFrames={90}>
        <ShotZoomGlitch />
        <Audio src={staticFile('audio/vo-intro-what.mp3')} volume={1} />
        <Sequence from={2} durationInFrames={10}>
          <Audio src={staticFile('audio/sfx-ping.mp3')} volume={0.65} />
        </Sequence>
      </Sequence>

      <Sequence from={420} durationInFrames={90}>
        <ShotTransition />
        <Audio src={staticFile('audio/vo-intro-reveal.mp3')} volume={1} />
        <Sequence from={0} durationInFrames={20}>
          <Audio src={staticFile('audio/sfx-whoosh.mp3')} volume={0.7} />
        </Sequence>
        <Sequence from={28} durationInFrames={20}>
          <Audio src={staticFile('audio/sfx-chime.mp3')} volume={0.55} />
        </Sequence>
      </Sequence>

      <Sequence from={510} durationInFrames={150}>
        <ShotLogoReveal />
        <Audio src={staticFile('audio/vo-intro-install.mp3')} volume={1} />
        <Sequence from={0} durationInFrames={25}>
          <Audio src={staticFile('audio/sfx-impact.mp3')} volume={0.75} />
        </Sequence>
        <Sequence from={28} durationInFrames={20}>
          <Audio src={staticFile('audio/sfx-chime.mp3')} volume={0.55} />
        </Sequence>
      </Sequence>
    </AbsoluteFill>
  );
};

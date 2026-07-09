import React from 'react';
import {AbsoluteFill, Audio, Sequence, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {loadFont} from '@remotion/google-fonts/Inter';
import {loadFont as loadMono} from '@remotion/google-fonts/JetBrainsMono';

loadFont();
loadMono();

// 30 s launch ad — 1080×1080 (X-native square, autoplay in feed).
// Structure:
//   0–3   Terminal typing → ExtrinsicFailed pop
//   3–6   Zoom on Module 6, error 2 (chromatic shake) → question caption
//   6–10  Green dot grows → PDK logo assembles
//   10–18 pdk debug decoded panel (the hero moment)
//   18–24 14 commands rapid-fire
//   24–30 Install CTA + handle

export const AD_FPS = 30;
export const AD_W = 1080;
export const AD_H = 1080;
export const AD_DURATION = 900; // 30 s

const BG = '#0a0c10';
const INK = '#ededed';
const MUTED = '#7d8590';
const ACCENT = '#3fb950';
const RED = '#f85149';
const PANEL = '#14171d';
const BORDER = '#21262d';

/* ---------- shots ---------- */

const ShotTerminalFail: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  // punchier char reveal (2.5x prev speed) so the command lands fast
  const cmd = '$ portaldot.tx.send(50000, alice, bob)';
  const reveal = Math.min(cmd.length, Math.floor((frame - 4) * 2.4));
  const visible = cmd.slice(0, Math.max(0, reveal));
  const blink = Math.floor(frame / 6) % 2;

  // camera-like continuous zoom on the whole scene — never dead-still
  const zoom = interpolate(frame, [0, 90], [1.06, 1.16], {extrapolateRight: 'clamp'});
  const drift = interpolate(frame, [0, 90], [-10, 10], {extrapolateRight: 'clamp'});

  // ambient background scan-line moves across the frame
  const scanY = interpolate(frame, [0, 90], [-40, 1120], {extrapolateRight: 'clamp'});

  // impact beat: on the exact frame the error appears, flash the whole screen red for 3 frames
  const flash = frame >= 42 && frame <= 45 ? 1 : 0;

  // camera shake starts on error, decays fast
  const shake = frame > 42 ? Math.max(0, (55 - frame) / 13) * (random(frame) - 0.5) * 22 : 0;
  const shakeY = frame > 42 ? Math.max(0, (55 - frame) / 13) * (random(frame * 1.7) - 0.5) * 14 : 0;

  const errIn = spring({frame: frame - 42, fps, config: {damping: 12, stiffness: 220, mass: 0.8}});
  const codeIn = spring({frame: frame - 58, fps, config: {damping: 14, stiffness: 180}});

  const fadeOut = interpolate(frame, [78, 90], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill style={{background: BG, opacity: fadeOut, overflow: 'hidden'}}>
      {/* faint moving grid so nothing is dead-still */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'linear-gradient(rgba(237,237,237,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(237,237,237,0.02) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
          transform: `translate(${drift}px, 0)`,
        }}
      />

      {/* horizontal scan line drifts down through the whole shot */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          height: 2,
          background: `linear-gradient(90deg, transparent, ${ACCENT}, transparent)`,
          opacity: 0.35,
          transform: `translateY(${scanY}px)`,
        }}
      />

      {/* red impact flash */}
      <div style={{position: 'absolute', inset: 0, background: RED, opacity: flash * 0.35}} />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          transform: `translate(${shake}px, ${shakeY}px) scale(${zoom})`,
          transformOrigin: '30% 55%',
          padding: 96,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        {/* editor-style chrome to add context */}
        <div
          style={{
            display: 'flex',
            gap: 8,
            marginBottom: 26,
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 18,
            color: MUTED,
            letterSpacing: '-0.005em',
          }}
        >
          <div style={{width: 12, height: 12, borderRadius: 6, background: '#f85149'}} />
          <div style={{width: 12, height: 12, borderRadius: 6, background: '#d29922'}} />
          <div style={{width: 12, height: 12, borderRadius: 6, background: ACCENT, marginRight: 14}} />
          <span>~/portaldot-dev — bash</span>
        </div>

        <div
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 34,
            color: INK,
            whiteSpace: 'pre',
            marginBottom: 30,
            letterSpacing: '-0.005em',
          }}
        >
          {visible}
          {reveal < cmd.length && <span style={{color: ACCENT, opacity: blink}}>▎</span>}
        </div>

        <div
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 62,
            fontWeight: 700,
            color: RED,
            opacity: errIn,
            transform: `translate(${(1 - errIn) * -60}px, 0) scale(${0.85 + 0.15 * errIn})`,
            transformOrigin: 'left center',
            marginBottom: 20,
            letterSpacing: '-0.02em',
          }}
        >
          ✗ ExtrinsicFailed
        </div>

        <div
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 34,
            color: INK,
            opacity: codeIn,
            transform: `translateY(${(1 - codeIn) * 18}px)`,
            letterSpacing: '-0.005em',
          }}
        >
          DispatchError <span style={{color: MUTED}}>{'{'}</span> Module: <span style={{color: MUTED}}>{'{'}</span>{' '}
          index: <span style={{color: RED, fontWeight: 700}}>6</span>, error:{' '}
          <span style={{color: RED, fontWeight: 700}}>2</span> <span style={{color: MUTED}}>{'}}'}</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const ShotZoomGlitch: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  // more aggressive push-in with subtle rotate for cinematic feel
  const scale = interpolate(frame, [0, 90], [0.95, 1.75], {extrapolateRight: 'clamp'});
  const rot = interpolate(frame, [0, 90], [-0.4, 0.6], {extrapolateRight: 'clamp'});
  const shake = frame > 20 ? (random(frame) - 0.5) * 14 : 0;
  const shakeY = frame > 20 ? (random(frame * 1.3) - 0.5) * 10 : 0;
  const chroma = Math.min(1, Math.max(0, (frame - 12) / 30));
  const captionIn = spring({frame: frame - 40, fps, config: {damping: 12, stiffness: 220}});
  const fadeOut = interpolate(frame, [78, 90], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  // system-alert bars top/bottom for tension
  const barIn = interpolate(frame, [0, 12], [0, 1], {extrapolateRight: 'clamp'});
  const barY = interpolate(frame, [40, 90], [0, 32], {extrapolateRight: 'clamp'});

  const base = 'Module: { index: 6, error: 2 }';
  const layer = (color: string, dx: number, dy: number, opacity: number) => (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 62,
        fontWeight: 700,
        color,
        opacity,
        transform: `translate(${dx}px, ${dy}px) scale(${scale}) rotate(${rot}deg)`,
        letterSpacing: '-0.02em',
        mixBlendMode: 'screen',
      }}
    >
      {base}
    </div>
  );

  return (
    <AbsoluteFill style={{background: BG, opacity: fadeOut, overflow: 'hidden'}}>
      {/* red alert bars */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 6,
          background: RED,
          opacity: barIn * 0.85,
          transform: `translateY(${-barY}px)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 6,
          background: RED,
          opacity: barIn * 0.85,
          transform: `translateY(${barY}px)`,
        }}
      />

      <div style={{position: 'absolute', inset: 0, transform: `translate(${shake}px, ${shakeY}px)`}}>
        {layer(RED, -6 * chroma, 0, 1)}
        {layer(ACCENT, 6 * chroma, 0, 0.55)}
        {layer(INK, 0, 0, 1)}
      </div>

      <AbsoluteFill style={{justifyContent: 'flex-end', paddingBottom: 140, alignItems: 'center'}}>
        <div
          style={{
            opacity: captionIn,
            transform: `translateY(${(1 - captionIn) * 30}px)`,
            fontFamily: 'Inter, sans-serif',
            fontSize: 42,
            fontStyle: 'italic',
            color: INK,
            letterSpacing: '-0.01em',
            padding: '10px 22px',
            background: 'rgba(10,12,16,0.6)',
            border: `1px solid ${BORDER}`,
            borderRadius: 8,
          }}
        >
          What does that even mean?
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// Shot 3: the single green dot enters big & center, then shrinks and
// slides to the RIGHT of "PDK" — becoming the period of the wordmark.
// Same DOM element from spawn to landed = the intro dot IS the logo dot.
const ShotLogoReveal: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const CENTER_X = AD_W / 2;
  const CENTER_Y = AD_H / 2;

  // Final period-dot position: to the right of "PDK" text at baseline.
  // PDK in 240px Inter Black is ~440px wide, centered on screen.
  // Right edge of K ≈ CENTER_X + 220. Add gap → dot center ≈ CENTER_X + 265.
  const LOGO_DOT_X = CENTER_X + 265;
  const LOGO_DOT_Y = CENTER_Y + 68; // sits at baseline (below cap centre)

  const BIG = 180;
  const SMALL = 52;

  const arrive = spring({frame: frame - 6, fps, config: {damping: 14, stiffness: 90}});
  const travel = interpolate(frame, [30, 70], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const sizeAt = 1 - travel;

  const glow = interpolate(frame, [10, 40, 60], [0, 1, 0], {extrapolateRight: 'clamp'});

  const dotX = CENTER_X + (LOGO_DOT_X - CENTER_X) * travel;
  const dotY = CENTER_Y + (LOGO_DOT_Y - CENTER_Y) * travel;
  const dotSize = SMALL + (BIG - SMALL) * sizeAt;
  const dotOpacity = arrive;

  const settlePulse = travel === 1 ? 1 + 0.06 * Math.sin((frame - 70) * 0.28) : 1;

  // Letters appear only after the dot has left center — they slide up next
  // to the dot's target position so the wordmark composes naturally.
  const pIn = spring({frame: frame - 40, fps, config: {damping: 16}});
  const dIn = spring({frame: frame - 46, fps, config: {damping: 16}});
  const kIn = spring({frame: frame - 52, fps, config: {damping: 16}});
  const tagIn = spring({frame: frame - 84, fps, config: {damping: 18}});

  return (
    <AbsoluteFill style={{background: BG, overflow: 'hidden'}}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(circle at ${(dotX / AD_W) * 100}% ${(dotY / AD_H) * 100}%, rgba(63,185,80,${glow * 0.3}) 0%, transparent 55%)`,
        }}
      />

      <div
        style={{
          position: 'absolute',
          top: dotY - 1,
          left: 0,
          right: 0,
          height: 2,
          background: `linear-gradient(90deg, transparent, ${ACCENT}, transparent)`,
          opacity: interpolate(frame, [20, 40, 70, 90], [0, 0.7, 0.7, 0], {extrapolateRight: 'clamp'}),
        }}
      />

      {/* PDK letters container — anchored so K's right edge sits at CENTER_X + 220 */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontFamily: 'Inter, sans-serif',
          fontWeight: 900,
          fontSize: 240,
          letterSpacing: '-0.045em',
          color: INK,
          lineHeight: 1,
          pointerEvents: 'none',
          display: 'inline-flex',
          alignItems: 'baseline',
        }}
      >
        <span style={{opacity: pIn, transform: `translateY(${(1 - pIn) * 40}px)`, display: 'inline-block'}}>P</span>
        <span style={{opacity: dIn, transform: `translateY(${(1 - dIn) * 40}px)`, display: 'inline-block'}}>D</span>
        <span style={{opacity: kIn, transform: `translateY(${(1 - kIn) * 40}px)`, display: 'inline-block'}}>K</span>
        {/* invisible spacer to keep the wordmark visually centered while the
            dot travels to sit right of the K */}
        <span style={{display: 'inline-block', width: SMALL + 22}} />
      </div>

      {/* The traveling green dot — same DOM element throughout */}
      <div
        style={{
          position: 'absolute',
          left: dotX,
          top: dotY,
          width: dotSize,
          height: dotSize,
          borderRadius: '50%',
          background: ACCENT,
          opacity: dotOpacity,
          transform: `translate(-50%, -50%) scale(${settlePulse})`,
        }}
      />

      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, calc(-50% + 200px)) translateY(${(1 - tagIn) * 12}px)`,
          opacity: tagIn,
          fontFamily: 'Inter, sans-serif',
          fontSize: 30,
          color: MUTED,
          letterSpacing: '-0.005em',
          whiteSpace: 'nowrap',
        }}
      >
        Portaldot errors, decoded.
      </div>
    </AbsoluteFill>
  );
};

const ShotDecoded: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const promptIn = spring({frame: frame - 2, fps, config: {damping: 14, stiffness: 220}});
  const panelIn = spring({frame: frame - 14, fps, config: {damping: 13, stiffness: 200}});
  const rowsIn = spring({frame: frame - 36, fps, config: {damping: 16}});
  const fadeOut = interpolate(frame, [135, 150], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill
      style={{
        background: BG,
        opacity: fadeOut,
        padding: 80,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 30,
          color: INK,
          opacity: promptIn,
          transform: `translateY(${(1 - promptIn) * 10}px)`,
          alignSelf: 'flex-start',
          marginLeft: 64,
          marginBottom: 40,
        }}
      >
        <span style={{color: ACCENT}}>$</span> pdk debug --demo
      </div>

      <div
        style={{
          width: '86%',
          background: PANEL,
          border: `2px solid ${RED}`,
          borderRadius: 14,
          padding: '32px 36px',
          opacity: panelIn,
          transform: `scale(${0.94 + 0.06 * panelIn})`,
        }}
      >
        <div
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 32,
            fontWeight: 700,
            color: RED,
            marginBottom: 22,
          }}
        >
          ✗ Balances.InsufficientBalance
        </div>

        <div style={{opacity: rowsIn, transform: `translateY(${(1 - rowsIn) * 8}px)`}}>
          <div style={{fontFamily: 'Inter, sans-serif', fontSize: 24, color: INK, fontWeight: 600, marginBottom: 6}}>
            What happened
          </div>
          <div style={{fontFamily: 'Inter, sans-serif', fontSize: 22, color: MUTED, marginBottom: 22, lineHeight: 1.35}}>
            You tried to transfer more POT than the account holds.
          </div>

          <div style={{fontFamily: 'Inter, sans-serif', fontSize: 24, color: INK, fontWeight: 600, marginBottom: 6}}>
            How to fix
          </div>
          <div style={{fontFamily: 'Inter, sans-serif', fontSize: 22, color: MUTED, lineHeight: 1.5}}>
            1. Check the sender balance.
            <br />
            2. Lower the amount, or fund the account first.
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const COMMANDS = ['doctor', 'accounts', 'pallets', 'storage', 'keys', 'simulate', 'send', 'seed', 'debug', 'explain', 'report', 'watch', 'ai-setup', '+ fix'];

const ShotCommandsGrid: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const headerIn = spring({frame: frame - 4, fps, config: {damping: 16}});
  const fadeOut = interpolate(frame, [190, 210], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill style={{background: BG, opacity: fadeOut, padding: 90, justifyContent: 'center'}}>
      <div
        style={{
          opacity: headerIn,
          transform: `translateY(${(1 - headerIn) * 12}px)`,
          fontFamily: 'Inter, sans-serif',
          fontSize: 44,
          fontWeight: 800,
          color: INK,
          textAlign: 'center',
          marginBottom: 42,
          letterSpacing: '-0.02em',
        }}
      >
        14 commands. One CLI.
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 18,
          padding: '0 20px',
        }}
      >
        {COMMANDS.map((c, i) => {
          const start = 20 + i * 6;
          const opacityIn = spring({frame: frame - start, fps, config: {damping: 20}});
          return (
            <div
              key={c}
              style={{
                background: PANEL,
                border: `1px solid ${BORDER}`,
                borderRadius: 10,
                padding: '18px 22px',
                opacity: opacityIn,
                transform: `translateY(${(1 - opacityIn) * 16}px)`,
              }}
            >
              <div style={{fontFamily: 'JetBrains Mono, monospace', fontSize: 22, color: ACCENT, fontWeight: 600}}>
                pdk {c}
              </div>
            </div>
          );
        })}
      </div>
      <div
        style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: 22,
          color: MUTED,
          textAlign: 'center',
          marginTop: 42,
          opacity: headerIn,
          fontStyle: 'italic',
        }}
      >
        Real POT gas. Zero mocks. Metadata-driven.
      </div>
    </AbsoluteFill>
  );
};

const ShotCTA: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const badgeIn = spring({frame: frame - 4, fps, config: {damping: 16}});
  const logoIn = spring({frame: frame - 18, fps, config: {damping: 16}});
  const installIn = spring({frame: frame - 42, fps, config: {damping: 16}});
  const handleIn = spring({frame: frame - 68, fps, config: {damping: 16}});

  const dotPulse = 1 + 0.06 * Math.sin(frame * 0.24);

  return (
    <AbsoluteFill style={{background: BG, justifyContent: 'center', alignItems: 'center'}}>
      <div
        style={{
          opacity: badgeIn,
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 20,
          letterSpacing: '0.18em',
          color: ACCENT,
          fontWeight: 600,
          textTransform: 'uppercase',
          marginBottom: 32,
        }}
      >
        🏆 1st place · Builder Tools · Portaldot S1
      </div>

      <div
        style={{
          opacity: logoIn,
          transform: `translateY(${(1 - logoIn) * 12}px)`,
          display: 'inline-flex',
          alignItems: 'baseline',
          fontFamily: 'Inter, sans-serif',
          fontWeight: 900,
          fontSize: 240,
          letterSpacing: '-0.045em',
          color: INK,
          lineHeight: 1,
        }}
      >
        <span>PDK</span>
        <span
          style={{
            display: 'inline-block',
            width: 52,
            height: 52,
            borderRadius: '50%',
            background: ACCENT,
            marginLeft: 22,
            transform: `translateY(-4px) scale(${dotPulse})`,
            transformOrigin: 'center',
          }}
        />
      </div>

      <div
        style={{
          opacity: installIn,
          transform: `translateY(${(1 - installIn) * 10}px)`,
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 32,
          color: INK,
          marginTop: 36,
          padding: '16px 32px',
          background: PANEL,
          border: `2px solid ${BORDER}`,
          borderRadius: 12,
        }}
      >
        <span style={{color: ACCENT}}>$</span> pip install portaldot-pdk
      </div>

      <div
        style={{
          opacity: handleIn,
          transform: `translateY(${(1 - handleIn) * 8}px)`,
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 22,
          color: MUTED,
          marginTop: 32,
        }}
      >
        @PortaldotDevKit  ·  portaldot-pdk.vercel.app
      </div>
    </AbsoluteFill>
  );
};

/* ---------- master composition ---------- */

const TYPING_KEYS = [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36, 40, 44, 48, 52, 56, 60];

export const PdkLaunchAd: React.FC = () => {
  return (
    <AbsoluteFill style={{background: BG}}>
      {/* No background music — pure SFX + VO */}

      <Sequence from={0} durationInFrames={90}>
        <ShotTerminalFail />
        <Audio src={staticFile('audio/vo-ad-hook.mp3')} volume={1} />
        {TYPING_KEYS.map((f, i) => (
          <Sequence key={i} from={f} durationInFrames={3}>
            <Audio src={staticFile('audio/sfx-type.mp3')} volume={0.5} />
          </Sequence>
        ))}
        <Sequence from={42} durationInFrames={20}>
          <Audio src={staticFile('audio/sfx-error.mp3')} volume={0.85} />
        </Sequence>
        <Sequence from={42} durationInFrames={8}>
          <Audio src={staticFile('audio/sfx-impact.mp3')} volume={0.6} />
        </Sequence>
      </Sequence>

      <Sequence from={90} durationInFrames={90}>
        <ShotZoomGlitch />
        <Audio src={staticFile('audio/vo-ad-question.mp3')} volume={1} />
        <Sequence from={0} durationInFrames={12}>
          <Audio src={staticFile('audio/sfx-glitch.mp3')} volume={0.6} />
        </Sequence>
        <Sequence from={40} durationInFrames={12}>
          <Audio src={staticFile('audio/sfx-ping.mp3')} volume={0.5} />
        </Sequence>
        <Sequence from={60} durationInFrames={10}>
          <Audio src={staticFile('audio/sfx-glitch.mp3')} volume={0.28} />
        </Sequence>
      </Sequence>

      <Sequence from={180} durationInFrames={120}>
        <ShotLogoReveal />
        <Audio src={staticFile('audio/vo-ad-reveal.mp3')} volume={1} />
        <Sequence from={0} durationInFrames={20}>
          <Audio src={staticFile('audio/sfx-whoosh.mp3')} volume={0.7} />
        </Sequence>
        <Sequence from={64} durationInFrames={30}>
          <Audio src={staticFile('audio/sfx-chime.mp3')} volume={0.6} />
        </Sequence>
        <Sequence from={64} durationInFrames={25}>
          <Audio src={staticFile('audio/sfx-impact.mp3')} volume={0.6} />
        </Sequence>
      </Sequence>

      <Sequence from={300} durationInFrames={150}>
        <ShotDecoded />
        <Audio src={staticFile('audio/vo-ad-hero.mp3')} volume={1} />
        <Sequence from={0} durationInFrames={8}>
          <Audio src={staticFile('audio/sfx-click.mp3')} volume={0.5} />
        </Sequence>
        <Sequence from={14} durationInFrames={12}>
          <Audio src={staticFile('audio/sfx-ding.mp3')} volume={0.5} />
        </Sequence>
      </Sequence>

      <Sequence from={450} durationInFrames={210}>
        <ShotCommandsGrid />
        <Audio src={staticFile('audio/vo-ad-commands.mp3')} volume={1} />
        {[0, 12, 24, 36, 48, 60, 72, 84, 96, 108, 120, 132, 144, 156].map((f, i) => (
          <Sequence key={i} from={20 + f} durationInFrames={3}>
            <Audio src={staticFile('audio/sfx-click.mp3')} volume={0.3} />
          </Sequence>
        ))}
      </Sequence>

      <Sequence from={660} durationInFrames={240}>
        <ShotCTA />
        <Audio src={staticFile('audio/vo-ad-cta.mp3')} volume={1} />
        <Sequence from={0} durationInFrames={20}>
          <Audio src={staticFile('audio/sfx-chime.mp3')} volume={0.55} />
        </Sequence>
        <Sequence from={2} durationInFrames={22}>
          <Audio src={staticFile('audio/sfx-impact.mp3')} volume={0.6} />
        </Sequence>
      </Sequence>
    </AbsoluteFill>
  );
};

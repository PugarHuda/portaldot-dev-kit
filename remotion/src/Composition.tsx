import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile} from 'remotion';
import {loadFont} from '@remotion/google-fonts/Inter';
import {loadFont as loadMono} from '@remotion/google-fonts/JetBrainsMono';
import {Intro} from './scenes/Intro';
import {DemoEmbed} from './scenes/DemoEmbed';
import {Outro} from './scenes/Outro';

loadFont();
loadMono();

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;

export const INTRO_DURATION = 660;
export const DEMO_DURATION = 4400;
export const OUTRO_DURATION = 400;
export const DURATION_FRAMES = INTRO_DURATION + DEMO_DURATION + OUTRO_DURATION;

const FPS_INT = FPS;
const s = (sec: number) => Math.round(sec * FPS_INT);

const DEMO_VO: Array<{key: string; atSec: number}> = [
  {key: 'install', atSec: 5.5},
  {key: 'doctor', atSec: 20},
  {key: 'accounts', atSec: 28},
  {key: 'pallets', atSec: 38},
  {key: 'storage', atSec: 42},
  {key: 'keys', atSec: 47},
  {key: 'simulate', atSec: 52},
  {key: 'send', atSec: 62},
  {key: 'seed', atSec: 72},
  {key: 'debug', atSec: 95},
  {key: 'explain', atSec: 107},
  {key: 'fix', atSec: 115},
  {key: 'report', atSec: 127},
  {key: 'watch', atSec: 133},
  {key: 'aisetup', atSec: 140},
];

export const PdkVoting: React.FC = () => {
  return (
    <AbsoluteFill style={{backgroundColor: '#0a0c10'}}>
      <Audio src={staticFile('audio/bg-pad.mp3')} volume={0.32} />

      <Sequence from={0} durationInFrames={INTRO_DURATION}>
        <Intro />
      </Sequence>

      <Sequence from={INTRO_DURATION} durationInFrames={DEMO_DURATION}>
        <DemoEmbed />
        {DEMO_VO.map((seg) => (
          <Sequence key={seg.key} from={s(seg.atSec)}>
            <Audio src={staticFile(`audio/vo-demo-${seg.key}.mp3`)} volume={1} />
          </Sequence>
        ))}
      </Sequence>

      <Sequence
        from={INTRO_DURATION + DEMO_DURATION}
        durationInFrames={OUTRO_DURATION}
      >
        <Outro />
        <Audio src={staticFile('audio/vo-outro.mp3')} volume={1} />
      </Sequence>
    </AbsoluteFill>
  );
};

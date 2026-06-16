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

const INTRO_DURATION = 280;
const DEMO_DURATION = 4400;
const OUTRO_DURATION = 400;

export const DURATION_FRAMES = INTRO_DURATION + DEMO_DURATION + OUTRO_DURATION;

export const PdkVoting: React.FC = () => {
  return (
    <AbsoluteFill style={{backgroundColor: '#0a0c10'}}>
      <Audio src={staticFile('audio/bg-pad.mp3')} volume={0.35} />

      <Sequence from={0} durationInFrames={INTRO_DURATION}>
        <Intro />
        <Audio src={staticFile('audio/vo-intro.mp3')} volume={1} />
      </Sequence>

      <Sequence
        from={INTRO_DURATION}
        durationInFrames={DEMO_DURATION}
      >
        <DemoEmbed />
        <Audio src={staticFile('audio/vo-demo.mp3')} volume={1} />
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

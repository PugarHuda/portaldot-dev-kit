import {Composition} from 'remotion';
import {PdkVoting, FPS, DURATION_FRAMES, WIDTH, HEIGHT} from './Composition';

export const Root: React.FC = () => {
  return (
    <Composition
      id="PdkVoting"
      component={PdkVoting}
      durationInFrames={DURATION_FRAMES}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
    />
  );
};

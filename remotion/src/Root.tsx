import {Composition, Still} from 'remotion';
import {PdkVoting, FPS, DURATION_FRAMES, WIDTH, HEIGHT} from './Composition';
import {LogoSquare, LogoHorizontal, LogoMono} from './brand/Logo';
import {XBanner} from './brand/Banner';
import {UpdateCard} from './brand/UpdateCard';
import {PdkLaunchAd, AD_FPS, AD_W, AD_H, AD_DURATION} from './ads/LaunchAd';

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="PdkVoting"
        component={PdkVoting}
        durationInFrames={DURATION_FRAMES}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Still
        id="LogoSquare"
        component={LogoSquare}
        width={1024}
        height={1024}
      />
      <Still
        id="LogoHorizontal"
        component={LogoHorizontal}
        width={1200}
        height={400}
      />
      <Still
        id="LogoMono"
        component={LogoMono}
        width={1024}
        height={1024}
      />
      <Still
        id="XBanner"
        component={XBanner}
        width={1500}
        height={500}
      />
      <Still
        id="UpdateCard"
        component={UpdateCard}
        width={1600}
        height={900}
      />
      <Composition
        id="PdkLaunchAd"
        component={PdkLaunchAd}
        durationInFrames={AD_DURATION}
        fps={AD_FPS}
        width={AD_W}
        height={AD_H}
      />
    </>
  );
};

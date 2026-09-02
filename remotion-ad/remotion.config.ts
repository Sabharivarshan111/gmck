import { Config } from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);
// The ads are vertical and dense; x264 at CRF 18 keeps the UI text crisp on
// Reels/TikTok re-encode, which is what actually degrades a product ad.
Config.setCrf(18);
Config.setChromiumOpenGlRenderer('angle');

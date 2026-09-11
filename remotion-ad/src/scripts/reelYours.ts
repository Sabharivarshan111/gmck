import type { AdScript } from './types';

/**
 * Reel — "Make it yours".
 *
 * ## Why customisation is worth sixty seconds
 *
 * Because a study app is open for four hours at a stretch, at night, on a
 * phone somebody bought for eight thousand rupees. The theme is not decoration
 * at that point — it is whether the screen is readable at one in the morning
 * and whether the app looks like it belongs to the person using it.
 *
 * ## Four colours, and the app derives the rest
 *
 * A theme here is background, text, accent and card. The other fourteen
 * colours are relationships rather than choices, so `paletteFrom` computes
 * them — which is what lets a custom theme recolour the subject cards, the
 * bars, the borders and the status bar without the reader picking eighteen
 * colours. Shot 6 is that idea in one line.
 *
 * Two things the ad deliberately does not promise:
 *
 * **It does not claim every combination is readable.** Four free colours can
 * produce unreadable text, and the editor shows the contrast figure turning
 * red rather than refusing the choice. Advertising "always readable" would be
 * a claim the feature does not make about itself.
 *
 * **It does not promise the glass.** Real refraction needs Android 13 and a
 * wallpaper; on anything else the surface draws its bevel instead. So the
 * wording is "over your own picture", which is true on every phone, rather
 * than a shader name that is true on some.
 *
 * Screens are the home editor's own captures (`homeedit-*`) and the glass
 * captures, all real.
 */
export const reelYours: AdScript = {
  id: 'orbit-reel-yours',
  title: 'Orbit MBBS — Reel: Make it yours',
  format: 'reel',
  voice: 'en-US-AvaNeural',
  rate: '+0%',
  pitch: '+0Hz',
  music: 'audio/bed/bed-guide.wav',
  shots: [
    { n: 1, frames: 129, screen: null, mascot: 'hero', camera: 'settle', text: 'You’ll see this a lot.', silentText: 'You’ll see this a lot.', vo: 'You’re going to stare at this screen a lot.', accent: '#FF4D8D' },
    { n: 2, frames: 129, screen: 'home', mascot: 'guide', camera: 'push', text: 'Make it yours', silentText: 'Make it yours', vo: 'So make it look like yours.', accent: '#FF4D8D' },
    { n: 3, frames: 129, screen: 'themeCustomizer', camera: 'trackRight', text: '4 themes', silentText: '4 themes', vo: 'There are four themes to start with.', accent: '#7C5CFF' },
    { n: 4, frames: 129, screen: 'homeLight', camera: 'settle', text: 'Light or dark', silentText: 'Light or dark', vo: 'Light when you’re studying in the library. Dark when it’s two in the morning.', accent: '#7C5CFF' },
    { n: 5, frames: 129, screen: 'themeCustomizer', mascot: 'guide', camera: 'macro', text: 'Make your own', silentText: 'Make your own', vo: 'Or build your own.', accent: '#7C5CFF' },
    { n: 6, frames: 129, screen: 'glassHome', camera: 'settle', text: 'Your own wallpaper', silentText: 'Your own wallpaper', vo: 'You can put your own picture behind everything too.', accent: '#4CC2FF' },
    { n: 7, frames: 129, screen: 'glassNotes', camera: 'push', text: 'Still easy to read', silentText: 'Still easy to read', vo: 'The cards stay readable over it.', accent: '#4CC2FF' },
    { n: 8, frames: 129, screen: 'homeEditPicture', mascot: 'guide', camera: 'macro', text: 'Rearrange your home', silentText: 'Rearrange your home', vo: 'You can rearrange the home screen while you’re there.', accent: '#22D3A6' },
    { n: 9, frames: 128, screen: 'homeEditTaller', camera: 'push', text: 'Hold and move', silentText: 'Hold and move', vo: 'Hold a block and move it.', accent: '#22D3A6' },
    { n: 10, frames: 128, screen: 'homeEditTaller', camera: 'macro', text: 'Resize it', silentText: 'Resize it', vo: 'Drag the edge to resize it.', accent: '#22D3A6' },
    { n: 11, frames: 128, screen: 'settings', camera: 'macro', text: 'Settings in one place', silentText: 'Settings in one place', vo: 'And the rest of the controls are in one settings screen.', accent: '#F5B301' },
    { n: 12, frames: 128, screen: 'settings', camera: 'glideDown', text: 'Text. Sound. Haptics.', silentText: 'Text. Sound. Haptics.', vo: 'Text size, sounds, haptics — all there.', accent: '#F5B301' },
    { n: 13, frames: 128, screen: 'noteToolbar', camera: 'push', text: 'Customise your notes', silentText: 'Customise your notes', vo: 'Even your notes can have their own font and highlighter.', accent: '#FF4D8D' },
    { n: 14, frames: 128, screen: 'glassHome', camera: 'push', text: 'Download Orbit', silentText: 'Download Orbit', vo: 'Download Orbit on the Play Store.', accent: '#7C5CFF' },
  ],
};

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
    { n: 1, frames: 80, screen: null, mascot: 'hero', camera: 'settle', text: 'You will stare at this for hours', silentText: 'You stare at this for hours', vo: 'You will stare at this for hours.', accent: '#FF4D8D' },
    { n: 2, frames: 100, screen: 'home', mascot: 'guide', camera: 'push', text: 'So make it yours', silentText: 'So make it yours', vo: 'So make it yours, properly.', accent: '#FF4D8D' },
    { n: 3, frames: 100, screen: 'themeCustomizer', camera: 'trackRight', text: 'Four themes to start', silentText: 'Four themes to start with', vo: 'Four themes to start with.', accent: '#7C5CFF' },
    { n: 4, frames: 100, screen: 'homeLight', camera: 'settle', text: 'Light for the library', silentText: 'Light for the library', vo: 'Light for the library, dark for the hostel.', accent: '#7C5CFF' },
    { n: 5, frames: 100, screen: 'themeCustomizer', mascot: 'guide', camera: 'macro', text: 'Or build your own', silentText: 'Or build your own', vo: 'Or build your own from four colours.', accent: '#7C5CFF' },
    { n: 6, frames: 105, screen: 'themeCustomizer', camera: 'push', text: 'It works out the rest', silentText: 'It works out the other fourteen', vo: 'Pick four and it works out the rest.', accent: '#4CC2FF' },
    { n: 7, frames: 100, screen: 'glassHome', camera: 'settle', text: 'Your own picture behind it', silentText: 'Your own picture behind it', vo: 'Put your own picture behind it.', accent: '#4CC2FF' },
    { n: 8, frames: 100, screen: 'glassNotes', camera: 'push', text: 'The cards let it through', silentText: 'The cards let it through', vo: 'The cards let it through, and stay readable.', accent: '#4CC2FF' },
    { n: 9, frames: 95, screen: 'glassProgress', camera: 'glideDown', text: 'A photo or a video', silentText: 'A photo, or a video', vo: 'A photo, or a video if your phone can take it.', accent: '#4CC2FF' },
    { n: 10, frames: 100, screen: 'homeEditPicture', mascot: 'guide', camera: 'macro', text: 'Move the home screen around', silentText: 'Move the home screen around', vo: 'Move the home screen around while you are there.', accent: '#22D3A6' },
    { n: 11, frames: 95, screen: 'homeEditTaller', camera: 'push', text: 'Hold a block to pick it up', silentText: 'Hold a block, pick it up', vo: 'Hold a block to pick it up.', accent: '#22D3A6' },
    { n: 12, frames: 95, screen: 'homeEditTaller', camera: 'macro', text: 'Drag the edge to make it wider', silentText: 'Drag the edge to resize it', vo: 'Drag the edge to make it wider, or taller.', accent: '#22D3A6' },
    { n: 13, frames: 95, screen: 'browse', camera: 'trackLeft', text: 'Reorder your subjects too', silentText: 'Reorder your subjects too', vo: 'Reorder your subjects too, per year.', accent: '#F5B301' },
    { n: 14, frames: 95, screen: 'settings', camera: 'macro', text: 'One button holds everything else', silentText: 'One button holds the rest', vo: 'One button holds everything else adjustable.', accent: '#F5B301' },
    { n: 15, frames: 95, screen: 'settings', camera: 'glideDown', text: 'Text size, sound, haptics', silentText: 'Text size, sound, haptics', vo: 'Text size, sound, haptics, all in there.', accent: '#F5B301' },
    { n: 16, frames: 95, screen: 'noteToolbar', camera: 'push', text: 'Even your own notes get a font', silentText: 'Even your notes get a font', vo: 'Even your own notes get a font and a highlighter.', accent: '#FF4D8D' },
    { n: 17, frames: 85, screen: null, mascot: 'hero', camera: 'settle', text: 'It should look like yours', silentText: 'It should look like yours', vo: 'It should look like yours.', accent: '#FF4D8D' },
    { n: 18, frames: 165, screen: 'glassHome', camera: 'push', text: 'Orbit MBBS, free on Google Play', silentText: 'Orbit MBBS — on Google Play', vo: 'Orbit MBBS, free on Google Play.', accent: '#7C5CFF' },
  ],
};

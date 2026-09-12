import type { AdScript } from './types';

/**
 * Reel — "How the focus timer works, and how to put your own music on it".
 *
 * ## Two features in one reel, because they are one screen
 *
 * The music player is not a separate place. It is a button on the timer's
 * transport row, where the break button used to be, and it grows in underneath
 * the controls. Sending it to its own ad would teach people to look for it
 * somewhere it is not.
 *
 * ## The music half is the half that needs teaching
 *
 * There is no catalogue, no account and nothing to stream. It plays files that
 * are already on the phone, chosen through Android's own picker — so a reader
 * expecting a Spotify-shaped thing finds an empty card and concludes it is
 * broken. Shots nine to thirteen are therefore in tap order: the button, the
 * card, the plus, the chooser, a track playing.
 *
 * Copy-or-link gets its own shot for the same reason the notes walkthrough
 * gives it one: a copy survives the original being deleted and costs space, a
 * link costs nothing and stops working if the file moves. The chooser on
 * screen says both, and the ad says both.
 *
 * ## What it may never say
 *
 * That the music is streamed, downloaded, or supplied by Orbit. It is
 * somebody's own recording, it stays on their phone, and `check:cloud-ids`
 * holds `lib/music.ts` to that.
 *
 * The wilt is stated honestly too: leaving mid-session withers the tree but the
 * minutes still count. An ad that implied the session is lost would be
 * describing Forest, not this.
 */
export const reelHowTimer: AdScript = {
  id: 'orbit-reel-how-timer',
  title: 'Orbit MBBS — How to: the focus timer and your own music',
  format: 'reel',
  voice: 'en-US-AvaNeural',
  rate: '+0%',
  pitch: '+0Hz',
  music: 'audio/bed/bed-guide.wav',
  shots: [
    { n: 1, frames: 129, screen: 'timer', mascot: 'hero', camera: 'settle', text: 'end up on your phone', silentText: 'Sitting down is the hard part', vo: 'You sit down to study and end up on your phone.', accent: '#22D3A6' },
    { n: 2, frames: 129, screen: 'timer', mascot: 'guide', camera: 'push', text: 'leave it on Focus', silentText: 'Open the timer', vo: 'Open the timer and leave it on Focus.', accent: '#22D3A6' },
    { n: 3, frames: 129, screen: 'timerBottom', camera: 'macro', text: 'you can change it', silentText: 'Change the length if you want', vo: 'Twenty-five minutes to start, and you can change it.', accent: '#4CC2FF' },
    { n: 4, frames: 129, screen: 'timer', camera: 'macro', text: 'put the phone down', silentText: 'Press play. Phone down.', vo: 'Press play, then put the phone down.', accent: '#4CC2FF' },
    { n: 5, frames: 129, screen: 'growth', camera: 'push', text: 'A tree starts growing', silentText: 'A tree grows while you focus', vo: 'A tree starts growing while you stay with it.', accent: '#22D3A6' },
    { n: 6, frames: 129, screen: 'timerBottom', camera: 'glideDown', text: 'the minutes still count', silentText: 'Your minutes still count', vo: 'Leave halfway and it withers, but the minutes still count.', accent: '#F5B301' },
    { n: 7, frames: 129, screen: 'treegallery', camera: 'pull', text: 'more species unlock', silentText: 'More species unlock', vo: 'Keep going and more species unlock.', accent: '#22D3A6' },
    { n: 8, frames: 129, screen: 'timer', camera: 'trackLeft', text: 'the chips at the top', silentText: 'Short break. Long break.', vo: 'Short break and long break are the chips at the top.', accent: '#7C5CFF' },
    { n: 9, frames: 128, screen: 'musicOpen', mascot: 'guide', camera: 'push', text: 'Tap the music button', silentText: 'Tap the music button', vo: 'Tap the music button beside play.', accent: '#FF4D8D' },
    { n: 10, frames: 128, screen: 'musicOpen', camera: 'macro', text: 'grows in under the controls', silentText: 'The player opens below', vo: 'The player grows in under the controls.', accent: '#FF4D8D' },
    { n: 11, frames: 128, screen: 'musicChooser', camera: 'settle', text: 'how to add the song', silentText: 'Tap plus to add a song', vo: 'Tap plus and it asks how to add the song.', accent: '#FF4D8D' },
    { n: 12, frames: 128, screen: 'musicChooser', camera: 'macro', text: 'Save a copy, or just link', silentText: 'Save a copy, or link it', vo: 'Save a copy, or just link to where it already is.', accent: '#F5B301' },
    { n: 13, frames: 128, screen: 'music', mascot: 'guide', camera: 'push', text: 'your own music', silentText: 'Your music, your phone', vo: 'Then it plays your own music, off your own phone.', accent: '#22D3A6' },
    { n: 14, frames: 128, screen: 'home', camera: 'push', text: 'Download Orbit', silentText: 'Download Orbit on Play Store', vo: 'Download Orbit on the Play Store.', accent: '#7C5CFF' },
  ],
};

# Google Play brand assets in this folder

## `google-play-logo.svg`

The Google Play logo (the four-colour triangle), downloaded unmodified from
Google's own developer site:

    https://developer.android.com/static/images/logos/google-play.svg

Google Play and the Google Play logo are trademarks of Google LLC. The file is
used **unmodified**: same geometry, same four brand colours (`#EA4335`,
`#FBBC04`, `#4285F4`, `#34A853`), rendered at its own 1:1 aspect ratio and
never recoloured, stretched or rotated. Google's brand guidelines forbid
altering the colour, proportions or spacing of its marks, and nothing here
does.

## `google-play-badge.png` — the slot, deliberately empty

The full **"Get it on Google Play" badge** — the pill with the wordmark — is
the asset Google asks you to use for a download call to action, and it is NOT
in this repository.

It could not be fetched: the build environment's egress policy answers 403 to
`play.google.com`, `gstatic.com`, Wikimedia and every CDN mirror. The one
reachable official host, `developer.android.com`, serves only the **deprecated**
badge design at 129x45 and 172x60 — six years old, and far too small for a
1080-wide frame.

Drawing a replacement was refused on purpose: a badge redrawn in code is a
modified badge however carefully it is done.

**To add it:** download the badge from the Play Console under Brand and
marketing (or the Play badge generator, which offers 40+ languages) and save it
here as `google-play-badge.png`. `scripts/preflight.mjs` detects the file and
`EndCard` renders it instead of the logo lockup, with no code change.

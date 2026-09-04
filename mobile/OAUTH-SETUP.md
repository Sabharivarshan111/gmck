Google Sign-In — what to register, and where
============================================

Everything below is already in the app. What is missing is the registration on
Google's side. There is nothing to change in the code.

The one value the app sends
---------------------------
  Web client ID   358287134961-24qidem5pd6qhtkq43b3a9cfcp87c49p.apps.googleusercontent.com

  In mobile/src/lib/googleAuth.ts. This is the *Web application* client, and it
  is what Supabase verifies the ID token against. Do not replace it with an
  Android client ID -- Android clients have no secret and Supabase cannot
  verify a token issued to one.


Three Android OAuth clients to create
-------------------------------------
Google Cloud Console -> APIs & Services -> Credentials -> Create credentials
-> OAuth client ID -> Application type: Android.

An Android client is a (package name, SHA-1) pair. Three certificates can sign
this app, so three clients are needed. Missing one produces DEVELOPER_ERROR
(status 10) at sign-in and nothing else -- no message saying which.

  1. PRODUCTION -- what real users run
     Package   com.aistudio.mbbsqbank.aycxvd
     SHA-1     from Play Console (see below). NOT the upload key.

  2. INTERNAL / RELEASE TESTING -- APKs signed with the upload key
     Package   com.aistudio.mbbsqbank.aycxvd
     SHA-1     CE:EA:8A:41:BB:07:78:C4:78:26:D8:8F:CC:E0:2C:C9:EB:29:40:68

  3. DEBUG / PREVIEW -- the .debug build from the debug-APK workflow
     Package   com.aistudio.mbbsqbank.aycxvd.debug
     SHA-1     CE:EA:8A:41:BB:07:78:C4:78:26:D8:8F:CC:E0:2C:C9:EB:29:40:68

     ^ the UPLOAD key, not the debug key. Verified 2026-09-03: the three
     signing secrets ARE set on this repo, so android-debug.yml decodes
     ANDROID_KEYSTORE_BASE64 and signs with the upload key. Its "sign with the
     upload key" step is conditional (`if: env.ANDROID_KEYSTORE_BASE64 != ''`),
     so this flips back to the checked-in debug key
     5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25 only if the
     secret is ever removed. Check which one a given APK actually carries with
     `apksigner verify --print-certs` before blaming Google Cloud.


The Supabase half is PROVEN WORKING — do not re-investigate it
--------------------------------------------------------------
Measured against the live project on 2026-09-04, so this is evidence rather
than an assumption:

  select provider, count(*), max(last_sign_in_at) from auth.identities group by 1;

  google  322 identities   last sign-in 2026-09-01
  email    23 identities   last sign-in 2026-08-06

322 Google identities, the most recent three days old. So the Google provider
in Supabase, the Web client ID and its secret are all correct and in use. They
are almost certainly all from the WEB app, which uses `signInWithOAuth` in a
browser and needs no Android client at all.

That matters because it splits the problem in half. **DEVELOPER_ERROR is thrown
by Google Play Services on the phone, before Supabase is contacted at all.** The
device is saying "no OAuth client matches this app's package name and signing
certificate". Nothing in Supabase, and nothing in this repo's code, can cause it
or fix it. The only fix is registering the Android client below.

So when sign-in fails in the app:

  DEVELOPER_ERROR / status 10   -> the Android OAuth client. This file.
  an error from Supabase after  -> the Web client ID or its secret.
  the Google sheet appearing

If the account picker never appears, it is always the first one.


The one people get wrong
------------------------
Play App Signing is enabled on this app. Google re-signs the upload with its
own key, so the certificate on a phone that installed from Play is **not** the
upload key. Registering only the upload key gives you sign-in that works in
your test build and fails for every real user.

Get the production SHA-1 here:

  Play Console -> your app -> Test and release -> Setup -> App signing
  -> "App signing key certificate" -> copy the SHA-1

That is client 1 above. The same page shows the "Upload key certificate",
whose SHA-1 should match CE:EA:8A:... -- if it does not, the upload key reset
has not gone through.


Why the debug entry needs its own client
----------------------------------------
An Android OAuth client is a (package name, SHA-1) PAIR, and the debug build
differs in BOTH: `applicationIdSuffix ".debug"` gives it its own package name,
and it may be signed by either of two certificates. So it always needs a client
of its own -- what changes is only which SHA-1 goes in it.

  secrets set (the case today)  -> aycxvd.debug + upload key CE:EA:8A:...
  secrets absent                -> aycxvd.debug + debug key  5E:8F:16:...

An earlier version of this file said the debug entry became "unnecessary" once
the secrets were set. That was wrong: it accounted for the certificate changing
and forgot the package name is different either way, so sign-in in the debug
build would still fail with DEVELOPER_ERROR.

If it is ever signed with the checked-in debug key, note that key's SHA-1 is
the same on every machine on earth and is not a secret -- registering it means
anyone can build an app that signs in as this one. Acceptable for a `.debug`
package that owns nothing; never register it against the production package.


Also required
-------------
* Supabase -> Authentication -> Providers -> Google: enabled, with the Web
  client ID above and its client secret.
* Supabase -> Authentication -> URL Configuration: the redirect scheme
  `com.aistudio.mbbsqbank.aycxvd` is already set in the app's manifest
  placeholder; nothing to add for native sign-in.
* The OAuth consent screen must be published, or only test users can sign in.


The exact values, so nothing has to be guessed
-----------------------------------------------
  Google Cloud project number   358287134961
  Supabase project ref          pmtgeydtqypwrypshhsx
  Supabase URL                  https://pmtgeydtqypwrypshhsx.supabase.co

  Where the client secret lives:
    Cloud Console -> Credentials -> click the *Web application* client
    "Orbit ... web" (id 358287134961-24qidem5pd...) -> right-hand panel,
    "Client secret". It is NOT in this repo and must never be committed.
    If it was never noted down, press "Add secret" / rotate and use the new
    one -- then update Supabase, or sign-in breaks.

  Paste targets:
    Web client ID     -> Supabase -> Authentication -> Providers -> Google
                         -> "Client ID (for OAuth)"
    Client secret     -> same page -> "Client Secret (for OAuth)"

  Authorized redirect URI, on the WEB client only:
    https://pmtgeydtqypwrypshhsx.supabase.co/auth/v1/callback

    Supabase prints this exact string on the Google provider page. The three
    Android clients take no redirect URI at all -- Android clients have no
    such field, which is a useful way to tell you are editing the right one.


Two different flows, and only one needs the redirect URI
---------------------------------------------------------
  NATIVE (mobile/src/lib/googleAuth.ts)
    GoogleSignin.signIn() -> supabase.auth.signInWithIdToken()
    Google issues the ID token on-device. No browser, no redirect. What it
    needs is an Android OAuth client matching (package, SHA-1). This is the
    flow behind "Sign in with Google to sync across devices".

  BROWSER (src/lib/native-auth.ts, RemoveAdsButton, NotesPurchaseCard)
    supabase.auth.signInWithOAuth({ provider: 'google' })
    This one round-trips through a browser, so it needs the redirect URI above
    registered on the Web client. The Capacitor build additionally returns to
    `app.lovable.orbitmbbs://auth/callback`.

  So a setup that only registers Android clients gives you working native
  sign-in and a failing "Buy" button, and vice versa. Both are needed.


How to verify each certificate yourself
---------------------------------------
  # debug key (checked in, password "android")
  keytool -list -v -keystore mobile/android/app/debug.keystore \
    -alias androiddebugkey -storepass android

  # upload key (your copy, not in the repo)
  keytool -list -v -keystore upload-keystore.jks -alias upload

  # what a built APK is actually signed with -- the honest check
  apksigner verify --print-certs app-release.apk


If sign-in fails
----------------
DEVELOPER_ERROR / status 10 means the (package, SHA-1) pair that signed the
app you are running is not registered. Check which of the three you are
running: the production build and the internal build share a package name but
have different certificates, so "it works in my test APK" tells you nothing
about the Play build. Changes to Cloud credentials can take a few minutes to
take effect.

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
     SHA-1     5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25


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
The debug workflow signs with Android's standard debug key when no keystore
secret is present. Its SHA-1 is the same on every machine on earth and is not
a secret -- which is the trade-off: registering it means anyone can build an
app that signs in as this one. Acceptable for a `.debug` package that owns
nothing; do not register it against the production package name.

If the three signing secrets are set on the gmck repo, the debug workflow signs
with the upload key instead and this entry is unnecessary.


Also required
-------------
* Supabase -> Authentication -> Providers -> Google: enabled, with the Web
  client ID above and its client secret.
* Supabase -> Authentication -> URL Configuration: the redirect scheme
  `com.aistudio.mbbsqbank.aycxvd` is already set in the app's manifest
  placeholder; nothing to add for native sign-in.
* The OAuth consent screen must be published, or only test users can sign in.


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

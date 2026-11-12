# DirectScope for Android (Google Play) – Trusted Web Activity

The app opens the live PWA full screen in the phone's Chrome. There is no app code here:
every deploy of the site updates the app.

## How it fits together
- `app/build.gradle` – the site host (`siteHost`), the app id `il.co.directscope.app` and the version.
- `public/.well-known/assetlinks.json` (in the site) – lists the SHA-256 of the app's signing key.
  Chrome only hides the address bar when the site serves this file.
- Signing key: `%USERPROFILE%\DirectScope-signing\` (`upload-keystore.jks` + `keystore.properties`).
  It is not in git. **Back it up.** Every update to the store must be signed with it.

## Build
Gradle refuses non-ASCII paths, so build from a drive letter:
```
subst S: "C:\Users\ns999\OneDrive\שולחן העבודה"
cd S:\DirectScope\twa
set JAVA_HOME=%LOCALAPPDATA%\Android\jdk
gradlew.bat bundleRelease assembleRelease
```
- Store file: `app/build/outputs/bundle/release/app-release.aab`
- Test file for a phone: `app/build/outputs/apk/release/app-release.apk`

For every new store upload, raise `versionCode` (and `versionName`) in `app/build.gradle`.

## Publishing on Google Play
1. In Play Console, create the app and upload the `.aab` (start with Internal testing).
2. Google re-signs the app with its own key. Copy **App integrity → App signing key → SHA-256** and add it as a
   second fingerprint in `public/.well-known/assetlinks.json`. Then deploy the site.
   Without this step, the app downloaded from the store shows an address bar.
3. Check: `https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://<host>&relation=delegate_permission/common.handle_all_urls`

## Changing the domain
Update `siteHost` in `app/build.gradle`, serve `assetlinks.json` on the new domain, raise the version, build and upload.

NATION: RISE TO POWER — v0.0.1 PWA PACKAGE

GAME CODE RULE
All game HTML, CSS and JavaScript remain together in index.html. The extra PWA files are required by browsers for installation and offline caching; they do not split the game code.

CONTENTS
- index.html: the complete game interface and game JavaScript/CSS
- manifest.webmanifest: install name, icons, standalone display and landscape orientation preference
- sw.js: service worker for app-shell caching/offline launch after first successful load
- icons/: app icons
- CHANGELOG.txt: package changes

IMPORTANT: A PWA cannot be installed from a ZIP or file:// path alone. It must be served from HTTPS (or localhost). Extract the ZIP and publish the folder to an HTTPS static host. Open the hosted URL in Chrome on Android, wait for the page to finish loading once, then use Chrome menu > Install app / Add to Home screen. Keep all files in their relative paths.

OFFLINE
After the first successful online visit and service-worker installation, the app shell is cached for later offline launch. External internet is not required by this package for the app shell itself.

SAVES
Game saves use browser localStorage and are stored on that browser/device profile. Clearing browser data can erase them. PWA install does not automatically migrate saves from a different browser or file preview.

LIMITATION
The manifest requests landscape orientation; browser/OS support can vary. If it does not lock automatically, rotate the phone manually to landscape. This is a PWA package, not an APK.

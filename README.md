# Home Hub v41

Makes the top Google Calendar section taller and scales the embedded calendar down so event line items are visible under each day.


## v42 App Launch Fix
This version uses Fully Kiosk's documented JavaScript interface:
`Android.openApplication(packageName)`

Required Fully settings:
- Enable JavaScript
- Enable JavaScript Interface
- Allow launching/opening other apps if prompted
- Open Other URL Schemes can stay on as a fallback


## v43 App-only launch
This version removes the web fallback for app cards. If Ring, SmartThings, or Google Home cannot open, it will not open the webpage; it will show an error/keep trying the Android app package instead.

Ring package: com.ringapp
SmartThings package: com.samsung.android.oneconnect
Google Home package: com.google.android.apps.chromecast.app

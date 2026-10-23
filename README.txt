UDRA Viewer: the prototype as a full-screen app in Expo Go
==========================================================

Everything is inside this folder: the screen, the 3D model and the images.
No website or link is needed.

One-time setup
- iPhone: install "Expo Go" from the App Store.
- Computer (Mac or Windows): install Node.js (LTS) from nodejs.org.

Run it
1. Unzip this folder on the computer.
2. Open a terminal in the folder:
   - Mac: right-click the folder in Finder > New Terminal at Folder.
   - Windows: open the folder, type cmd in the address bar, press Enter.
3. Run:
     npm install        (first time only, takes a minute)
     npm start
4. Scan the QR code with the iPhone Camera app and tap the banner.

Editing with live reload
- While "npm start" runs, the phone loads the screen from your computer.
  Save any file in the screen/ folder (screen/index.html is the whole UI)
  and the phone reloads by itself in a second.
- To edit with Claude Code: open a second terminal in this folder and run
  "claude". CLAUDE.md tells it how the project is laid out.

Tips
- Phone and computer on the same Wi-Fi. If the QR code won't open, press
  Ctrl+C and run:  npm run start:tunnel   (works anywhere, but without
  live reload; it shows the last saved version).
- Keep the terminal open while using the app.
- Shake the phone for Expo Go's menu (Reload, back to Expo Go home).

Credit: the 3D anatomy is based on BodyParts3D, (c) The Database Center
for Life Science, CC BY 4.0.

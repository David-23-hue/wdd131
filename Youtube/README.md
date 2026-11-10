# Clip Studio

A free, local-first video clipper for video files you own or are authorized to edit. It records a selected moment in vertical 9:16 or landscape 16:9, then uploads it through YouTube's official API.

## Requirements

- Node.js 20 or newer
- Google Chrome or Microsoft Edge (for browser video recording)
- Internet access for Google sign-in and YouTube uploads
- A Google OAuth client ID (setup below)

No npm packages or FFmpeg download are required. The local Node server only serves the app and binds to `127.0.0.1`. The source video remains in the browser; it is not uploaded to this app or sent to a clipping service. The browser records the selected portion in real time as WebM, which can then be uploaded or downloaded.

## Start

From this folder in VS Code's terminal:

```powershell
npm.cmd start
```

Open [http://localhost:4173](http://localhost:4173). Keep the terminal open while using the app.

## One-time YouTube setup

1. In [Google Cloud Console](https://console.cloud.google.com/), create or select a project and enable **YouTube Data API v3**.
2. Configure the OAuth consent screen. Add your Google account as a test user if the app remains in testing mode.
3. Create an OAuth client ID of type **Web application**.
4. Add `http://localhost:4173` under **Authorized JavaScript origins**. No redirect URI or client secret is used.
5. Paste the client ID into Clip Studio and select **Connect**. Sign in to the Google account/channel that should receive uploads and approve the requested YouTube permissions.

The client ID is saved in this browser; the OAuth access token is kept in memory only. Reconnect after reloading the app or when Google expires the token. Access can be revoked from [Google Account permissions](https://myaccount.google.com/permissions). YouTube API quota and Google OAuth testing/publishing policies still apply.

## Use

1. Select a local video file.
2. Set its start time, clip length (up to 180 seconds), and output orientation.
3. Connect the intended YouTube account.
4. Set a title, description, visibility, and made-for-kids declaration.
5. Select **Clip & upload**. Your browser records the chosen section in real time and uploads it automatically. Visibility defaults to **Private**. Keep the created clip or download it from the result card.

The recorder requires a browser that supports `MediaRecorder` and video `captureStream` (Chrome or Edge). Processing takes about as long as the selected clip. This is a manual clip selector, not an AI highlight detector. It does not download videos from YouTube. Use only material you have the rights to edit and upload. OAuth access is revocable, not a permanent connection.

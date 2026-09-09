# lo-pi

A [pi coding agent](https://github.com/badlogic/pi-coding-agent) extension that toggles a lofi radio stream from inside the terminal. One command starts/stops playback (via `mpv`) and animates a gradient equalizer in the footer while it plays.

## Features

- `/lopi` — start the default Radio Paradise lofi stream (`https://stream.radioparadise.com/mp3-128?genre=lofi`)
- `/lopi <stream-url>` — play any MP3 stream URL instead
- `/lopi` again — stop
- Footer indicator: 5-shape equalizer with a per-bar 256-color gradient (coral → pink → purple → blue → cyan) that drifts in sync with the animation; auto-clears on stop or if `mpv` exits (stream ended / crashed)
- Cleanup on session shutdown — no orphaned `mpv` processes

## Requirements

- [pi coding agent](https://www.npmjs.com/package/@earendil-works/pi-coding-agent)
- [`mpv`](https://mpv.io/) on your `PATH`

## Setup

Copy the extension into pi's extensions directory:

```sh
cp lopi.ts ~/.pi/agent/extensions/lopi.ts
```

Restart pi (or reload extensions). Then in any session:

```
/lopi                # start default lofi stream
/lopi <stream-url>   # play a custom stream
/lopi                # stop
```

## How it works

- Spawns `mpv --no-video --no-terminal <url>` with ignored stdio.
- A 400ms `setInterval` ticks 4 height frames; each frame colors its 5 shapes individually with raw ANSI 256-color codes (`\x1b[38;5;Nm`), offset by the frame index so the gradient sweeps left→right. Raw ANSI is used because pi's `theme.fg()` only accepts theme color names.
- `proc.on("exit")` and `session_shutdown` both call `stop()`, which clears the timer, deletes the footer status entry, and kills `mpv`.

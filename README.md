# FlowPilot

An AI-style auto-scheduling calendar: add tasks with durations and deadlines, and FlowPilot packs them into your free time automatically. Hit **Recalculate** and your whole week re-plans around whatever changed.

Inspired by FlowSavvy's auto-scheduling workflow; all code here is original.

## Desktop app (Windows)

Download `FlowPilot-Windows-<version>.zip` from the latest release, extract it, and run `FlowPilot.exe`. All data is stored locally on your machine.

The `Update-FlowPilot.bat` script checks this repository for the newest release, downloads it if your copy is out of date, and then launches the app.

## Development

```bash
npm install        # ELECTRON_MIRROR may be needed in some regions
npm run build      # builds the renderer into dist/
npx electron .     # runs the desktop app
```

Stack: React + TypeScript + Vite renderer, Electron shell, localStorage persistence, pure-TypeScript scheduling engine (`src/scheduler.ts`).

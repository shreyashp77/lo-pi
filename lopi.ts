import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { spawn, type ChildProcess } from "node:child_process";

const DEFAULT_STREAM = "https://stream.radioparadise.com/mp3-128?genre=lofi";
// ponytail: squares instead of box-elements (U+258x) — box glyphs render low in many terminal fonts; squares are baseline-aligned in all of them
const FRAMES = ["▪◦▪▪◦", "◦▪▪◦▪", "▪▪◦▪◦", "▪◦▪▪▪"];
// 256-color bar sweep: coral, pink, purple, blue, cyan (renders in 256 and truecolor terminals)
const GRADIENT = [203, 205, 171, 63, 87];

export default function (pi: ExtensionAPI) {
  let proc: ChildProcess | null = null;
  let timer: NodeJS.Timeout | null = null;
  // last ctx.ui, so mpv's exit handler can clear the footer status too
  // ponytail: untyped; single extension, no other consumer
  let ui: any = null;

  const stop = () => {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
    ui?.setStatus("lopi", undefined); // undefined deletes the entry; "" would leave a blank line
    if (proc) {
      proc.kill();
      proc = null;
    }
  };

  const startIndicator = () => {
    let i = 0;
    const tick = () => {
      i = (i + 1) % FRAMES.length;
      const bars = FRAMES[i]
        .split("")
        .map((ch, pos) => `\x1b[38;5;${GRADIENT[(pos + i) % GRADIENT.length]}m${ch}\x1b[39m`)
        .join("");
      ui.setStatus("lopi", bars);
    };
    tick();
    timer = setInterval(tick, 400);
  };

  pi.on("session_shutdown", () => stop());

  pi.registerCommand("lopi", {
    description: "Toggle lofi radio (optional: /lopi <stream-url>)",
    handler: (args, ctx) => {
      ui = ctx.ui;
      if (proc) {
        stop();
        ctx.ui.notify("lofi radio stopped", "info");
        return;
      }
      try {
        proc = spawn("mpv", ["--no-video", "--no-terminal", args?.trim() || DEFAULT_STREAM], {
          stdio: "ignore",
        });
        proc.on("exit", () => {
          if (proc) stop();
        });
        startIndicator();
        ctx.ui.notify("lofi radio playing", "info");
      } catch (err) {
        ctx.ui.notify(`failed to start lofi radio: ${(err as Error).message}`, "error");
      }
    },
  });
}

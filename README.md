# ⏳ wait-mate

Tiny, delightful animations that keep users company while a long-running
activity executes in the background — a little strolling character, bouncing
dots, an orbiting comet, faked asymptotic progress, a sleepy companion.
Vanilla JS, zero dependencies, one file.

## Why

Spinners tell users "wait". wait-mate tells them "wait with me" — whimsical,
low-cost theatrics that make multi-second background jobs feel shorter.

## Quick start

```html
<script type="module">
  import { WaitMate } from './src/waitmate.js';

  // one-liner: wrap any async activity
  await WaitMate.start(fetchData(), { scene: 'walker', message: 'Fetching…' });

  // or manual control
  WaitMate.start({ scene: 'meter' });
  // ...later
  WaitMate.stop({ message: 'Done!' });
</script>
```

## API

| Call | Behavior |
|---|---|
| `WaitMate.start(promise, opts?)` | Runs the animation until the promise settles, then stops (auto, with a farewell flash if `opts.message` set). Returns the promise. |
| `WaitMate.start(opts?)` | Manual mode; call `WaitMate.stop()` when done. |
| `WaitMate.stop(opts?)` | Removes the overlay; `opts.message` flashes a farewell. |
| `WaitMate.scenes` | List of available scenes. |

Options: `{ scene: 'walker' | 'dots' | 'orbit' | 'meter' | 'sleepy', message: string }`.

## Scenes

- **walker** — canvas: a little character strolling on a scrolling floor
- **dots** — three bouncing dots (SpinKit-style)
- **orbit** — dot circling a ring with a comet trail
- **meter** — progress bar with asymptotic "never quite done" theatrics
- **sleepy** — a napping companion with drifting Zzz

## Conventions & notes

- Animates only `transform` / `opacity` (GPU-friendly, borrowed from
  loaders.css / SpinKit) — no layout thrash.
- Honors `prefers-reduced-motion`: falls back to a static, calm state.
- Overlay is `role="status"` + `aria-live="polite"` for screen readers.
- Zero dependencies; works in any modern browser, no build step.

## Demo

Open `index.html` in a browser (any static server works: `python3 -m http.server`).

## License

MIT

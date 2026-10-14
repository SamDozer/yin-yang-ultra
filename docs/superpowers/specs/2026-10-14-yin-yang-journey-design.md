# Yin-Yang Journey — Design Spec

Date: 2026-10-14
Status: Draft for user review (not yet approved for implementation planning)
Base project: `abdoabdo22334456-prog/yin-yang-ultra` (vanilla HTML5 Canvas + Web Audio, no dependencies)

## 1. Purpose and success criteria

**What the user asked for:** improve the animation and the philosophical depth of the existing Yin-Yang simulation, grounded in real yin-yang texts, as both a **meditative art piece** and an **explainer**, built for aesthetic excellence. Afterwards, send the new version to the repository owner as a pull request.

**Success looks like:**
- Someone can watch the piece with no text and find it beautiful and calm (Contemplate mode).
- The same scene, with Study mode on, teaches the sequence Wuji → Taiji → Two Forms/Four Images → Reversal → Return, with every passage traceable to a named book and chapter.
- No invented quotations. Every Chinese passage is verified before shipping.
- It still runs offline from `standalone.html` with no network and no dependencies.

**Assumptions (confirm on review):** Arabic remains the primary UI language, with Chinese originals shown beside it; the owner may decline the PR, so the work must stand alone as a coherent version.

## 2. Visual language

Direction: ink on night, not a sci-fi HUD.

- **Ground:** warm black `#0b0a09` with faint paper-fiber grain.
- **Yang:** rice-paper white `#ece6d8`. **Yin:** sumi ink `#14110f` with visible ink-pool depth.
- **Accent:** muted gold `#b8975a`, used sparingly (seeds, hexagram lines, citations). Strain shifts the accent toward cinnabar `#a63d2f`.
- **Form:** brush-stroke boundary with uneven width and dry-brush breaks; ink-and-mist particles with long fades; no neon glow.
- **Motion:** nothing snaps; 1–3 s ease-out on every change; a slow ~12 s breathing pulse.
- **Type:** brush-style Chinese (Ma Shan Zheng or Noto Serif SC subset), Arabic serif (Amiri subset).
- **Layout:** full-screen canvas, thin edge control strip, no emoji, no gauge bars. Balance is shown by the image.
- **Reduced motion:** the same scenes as slow cross-fades.

## 3. The five movements

One canvas, one continuous scene. Contemplate mode auto-advances (about 75 s per movement); Study mode steps manually. A strip of five dots shows position.

| # | Movement | Scene | Source (Study mode) |
|---|---|---|---|
| 1 | Wuji 無極 | Empty circle of paper grain, breathing; one ink drop falls and ripples | Zhou Dunyi, *Taijitu shuo* |
| 2 | Taiji 太極 | Circle turns; motion peaks, stills, then the S-curve opens and splits it | *Taijitu shuo* |
| 3 | Liangyi / Sixiang 兩儀四象 | Two halves, then four phases: young yang (dawn), old yang (noon), young yin (dusk), old yin (midnight); wheel marks current phase and direction | *Yijing*, Xici I.11 |
| 4 | Reversal 物極必反 | One side pushed to its limit thins, its seed swells, colors trade places | *Huangdi Neijing* Suwen 5; *Daodejing* 40 |
| 5 | Return 歸 | The 24 s cycle with an outer ring of 24 solar terms (one per second); a hexagram at the edge rewrites its lines | *Daodejing* 42; *Yijing* |

After movement 5 the scene opens into **Practice**, the existing sandbox, with **Wu Wei**: moving the controls adds strain; leaving them alone heals it.

### Engine behavior changes
- Movement 2 reuses `merge`/`blend` from `formationState`, run as a split.
- **Phase** (new): derived from `yin - yang` and its rate of change, giving young/old yang/yin.
- **Rupture is split by cause.** Imbalance now ends in reversal. The explosion remains only for overload (total > 24) and starvation (total < 6), matching the three existing strain laws.
- **Hexagram:** total (0–30) is divided into six bands; each line flips with a short ink fade.

## 4. Sound

Procedural Web Audio, no recorded files, pentatonic (gong, shang, jue, zhi, yu).

- Yin voice: low drone and soft bowl. Yang voice: higher bell tones.
- Balance is consonance: at equal values the voices sit a perfect fifth (3:2) apart; imbalance detunes the upper voice so it beats.
- Reversal: the voices swap registers as the colors swap.
- Per movement: Wuji is near-silent filtered-noise breath; the Taiji split is one struck bowl; Return has a soft low tone every 6 s.
- Off until the first tap (autoplay rules), single mute control, low default volume. Sound is independent of Study/Contemplate.

## 5. Text

Study mode only. Each passage has three layers: Chinese original (brush type), Arabic rendering, one line of commentary, plus book and chapter.

| Movement | Passage | Source |
|---|---|---|
| Wuji | 無極而太極 | Zhou Dunyi, *Taijitu shuo* |
| Taiji | 太極動而生陽，動極而靜，靜而生陰，靜極復動 | *Taijitu shuo* |
| Liangyi / Sixiang | 易有太極，是生兩儀，兩儀生四象，四象生八卦 | *Yijing*, Xici I.11 |
| Reversal | 重陰必陽，重陽必陰 · 反者道之動 | *Huangdi Neijing* Suwen 5 · *Daodejing* 40 |
| Return | 一陰一陽之謂道 · 萬物負陰而抱陽 | *Yijing*, Xici I.5 · *Daodejing* 42 |
| Practice | 無為而無不為 | *Daodejing* 37 |

**Integrity rules**
- The Arabic is a project rendering, labeled "project translation".
- Each Chinese line is checked against a public-domain edition (for example Legge) before shipping; any line that cannot be verified is removed. Results are recorded in a verification table appended to this spec before release.
- Fonts are embedded as small subsets (only the characters used) so the project stays offline; a system serif is the fallback.

## 6. Code structure

| File | Job | Depends on |
|---|---|---|
| `engine.js` | Physics, strain laws, reversal timeline, phase mapping | none |
| `journey.js` (new) | Five movements: timing, progress, active scene | engine |
| `texts.js` (new) | Passages as data | none |
| `hexagram.js` (new) | Total to six lines, name and meaning | none |
| `renderer.js` | Ink-brush drawing, mist, seeds, solar-term ring, hexagram | engine, journey |
| `audio.js` | Pentatonic voices, consonance from balance | engine |
| `app.js` | Wiring, mode toggle, input, Wu Wei | all |

`style.css` is rewritten; `index.html` loses the HUD panels; `build_standalone.py` is updated for the new modules and font subsets.

**Data flow:** input → `engine` → one frame object (balance, strain, phase, reversal progress) → `renderer`, `audio` and Study text all read that frame. No module reads another's internals.

## 7. Error handling

- Audio blocked or unavailable: runs silent, no error shown.
- Font fails: system serif fallback; Chinese still renders.
- `prefers-reduced-motion`: slow cross-fades.
- Tiny window or missing canvas: scales to fit, as today.

## 8. Testing

- **Unit (`node --test`, no new dependencies):** `engine`, `hexagram`, phase mapping. Cases: equal values give a perfect fifth ratio; imbalance produces reversal not rupture; overload and starvation still rupture; hexagram bands are monotonic.
- **Visual:** screenshot each movement in Contemplate and Study, desktop and phone width, with reduced-motion on.
- **Offline:** open `standalone.html` with no network.
- **Quotes:** verification table completed for every passage.

## 9. Delivery

1. This spec is reviewed by the user; then an implementation plan is written and reviewed.
2. The working folder is not a git repository and the earlier clone failed on a long path. Fork `abdoabdo22334456-prog/yin-yang-ultra` as `SamDozer`, clone the fork to a short path, work on a feature branch.
3. Before anything is pushed or opened, the user approves the branch name, diff summary and PR title and description. The PR targets the owner's `main` and is a proposal the owner may decline.

## 10. Out of scope

Recorded audio, external libraries or CDNs, a backend, additional languages beyond Arabic and Chinese, mobile app packaging, and the full 64-hexagram text corpus (only name and one-line meaning per hexagram).

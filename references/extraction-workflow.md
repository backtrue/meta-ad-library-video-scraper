# Extraction Workflow

## Primary Path

1. Confirm the exclusion brand before opening the search, unless it was already provided.
2. Open the generated `https://www.facebook.com/ads/library/` URL in a browser with Facebook login.
3. Wait until the result area stops showing loading placeholders.
4. Scroll in small steps to load more cards.
5. Extract visible card text and links.
6. Normalize repeated whitespace and deduplicate cards by source URL or visible library ID.
7. Filter out clear self-brand matches before presenting candidates.
8. For short-video analysis, read or resolve duration before downloading, and keep only ads `<= 60` seconds.

Do not read local project environment files, `META_ACCESS_TOKEN`, or any Facebook
access token while doing keyword discovery. Do not call Graph API / `ads_archive`
for normal commercial ad discovery unless the user explicitly asks for Graph API
debugging.

## Practical DOM Heuristics

Meta changes class names frequently. Prefer semantic and text-based signals:

- Card boundaries often contain text such as `Library ID`, `Started running`, `開始刊登`, `投放`, or `Sponsored`.
- Source links often include `/ads/library/?id=`.
- Video candidates often include `video`, `.mp4`, `.m3u8`, `fbcdn.net`, or media preview containers.
- Visible copy is usually near the page name and delivery text; preserve line breaks.
- Self-brand filtering should compare the exclusion brand against page name, advertiser name, visible brand marks, landing page host, and obvious aliases. Do not exclude fuzzy matches unless the page clearly represents the user's brand.
- Video duration can appear as player text such as `0:00 / 0:58`; resolved `fbcdn.net` URLs may also include encoded metadata such as `duration_s`.

## Short Video Download Checks

1. Use Ad Library source URLs shaped like `https://www.facebook.com/ads/library/?id=<ID>`.
2. Prefer `yt-dlp -g` first to confirm a downloadable media URL exists.
3. Use `yt-dlp -o '<path>.%(ext)s' <sourceUrl>` to download only after duration is known or inferred to be `<= 60` seconds.
4. Verify saved files with `ffprobe -v error -show_entries format=duration,size,format_name -of json <file>`.
5. Treat `fbcdn.net` media URLs as temporary signed URLs. Do not store them as permanent source links.
6. Do not use browser-cookie extraction unless the user explicitly approves that risk; public Ad Library URLs may work without cookies.

## Script Analysis Checks

First-version script analysis stops at structured decomposition and classification:

1. Validate MP4 metadata with `ffprobe`.
2. Extract or transcribe audio into timestamped segments. If there is no spoken audio, mark `no_spoken_audio`.
3. Detect visual sections using PySceneDetect or FFmpeg scene detection; for simple ads, fixed interval frames are acceptable when shot detection fails.
4. Extract representative frames for each visual section.
5. Read visible frame text, especially subtitles, price, offer, product names, and CTA. OCR can assist only when it is already available, but it is not a separate required backend and must not replace visible frame inspection.
6. Merge transcript and visual sections into a storyboard timeline, not a raw transcript table.
7. Assign one script type: pain-solution, educational, testimonial, ritual-scenario, price-promotion, product-demo, belief-or-use-case-scenario, or other-or-unclear.

Do not produce learning recommendations, scoring, or rewrite templates in this first-version scope.

Do not add new tool prerequisites during analysis. If a batch has many videos,
repeat the same script-analysis checks per video instead of creating a separate
OCR/model/toolchain workflow. Tool availability problems are not the deliverable;
the deliverable is the script timeline grounded in video, transcript, frame
inspection, and source metadata.

## Storyboard Standard

For this skill, `1-7 script analysis` means a storyboard-first analysis
(`分鏡稿`) after download and verification.

A storyboard is shot/panel based. It is not the same as a transcript, a bullet
summary, or a marketing takeaway list. Each row should represent one ordered
visual panel or shot beat and should include:

- shot number
- time range and duration
- representative frame path
- shot / framing: wide, medium, close-up, detail/product close-up,
  screen/text card, or unknown
- camera or edit note: static, handheld, push-in, cut, split-screen,
  before-after, or unknown
- visual panel: what appears in frame, subject position, product placement,
  action, and composition
- on-screen text: subtitles, price, offer, product name, CTA, or visible labels
- audio: spoken line, voiceover, music/noise note, or `no_spoken_audio`
- script function: hook, problem, solution, proof, product_demo, offer, cta,
  transition, or unclear
- viewer job: what this shot asks the viewer to notice, believe, feel, or do

The user-facing report must show the storyboard table directly. Raw transcript
segments can be linked as evidence, but they must not dominate the report.

Use Traditional Chinese in the report. If speech recognition returns Simplified
Chinese or noisy homophones, normalize the user-facing storyboard text into
Traditional Chinese while preserving raw transcript JSON separately as evidence.

## Fallback Sequence

1. Try DOM text/link extraction from the loaded page.
2. Try page HTML search for:
   - `https:\\/\\/video`
   - `.mp4`
   - `.m3u8`
   - `ad_snapshot_url`
   - `/ads/library/?id=`
3. Try opening the card/snapshot link and repeat extraction.
4. If no video URL is available, return `source_only` with the Ad Library URL.

## Evidence

When extraction is uncertain, save a small evidence bundle:

- search URL
- timestamp
- screenshot path if available
- raw card text
- extracted source URL
- extraction status and reason

Never print or store Facebook access tokens in the evidence bundle.

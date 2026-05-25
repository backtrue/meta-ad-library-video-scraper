# Extraction Workflow

## Meta Ad Library Discovery

1. Confirm the exclusion brand before opening the search unless it was already provided.
2. Build or open the generated `https://www.facebook.com/ads/library/` URL.
3. Use a browser with Facebook login only when the environment provides one.
4. Wait until the result area stops showing loading placeholders.
5. Scroll in small steps to load more cards.
6. Extract visible card text and links.
7. Normalize repeated whitespace and deduplicate cards by source URL or visible library ID.
8. Filter out clear self-brand matches before presenting candidates.
9. For short-video analysis, read or resolve duration before downloading, and keep only ads `<= 60` seconds.

## Practical DOM Heuristics

Meta changes class names frequently. Prefer semantic and text-based signals:

- Card boundaries often contain text such as `Library ID`, `Started running`, `開始刊登`, `投放`, or `Sponsored`.
- Source links often include `/ads/library/?id=`.
- Video candidates often include `video`, `.mp4`, `.m3u8`, `fbcdn.net`, or media preview containers.
- Visible copy is usually near the page name and delivery text; preserve line breaks.
- Self-brand filtering should compare the exclusion brand against page name, advertiser name, visible brand marks, landing page host, and obvious aliases.
- Do not exclude fuzzy matches unless the page clearly represents the user's brand.
- Video duration can appear as player text such as `0:00 / 0:58`; resolved `fbcdn.net` URLs may also include encoded metadata such as `duration_s`.

## Direct URL Resolution

For a pasted URL:

1. Preserve the raw source URL.
2. Classify it before downloading:
   - Ad Library URL
   - Facebook video/Reels/watch URL
   - temporary signed media URL
   - direct video URL
   - unsupported URL
3. Try `yt-dlp -g <url>` first when available to check whether a media source can be resolved.
4. Download with `yt-dlp -o '<path>.%(ext)s' <url>` when the source is resolvable.
5. For direct MP4 URLs, a normal HTTP download is acceptable when `yt-dlp` is unavailable.
6. Verify the saved file with `ffprobe`.

## Short Video Download Checks

1. Prefer Ad Library source URLs shaped like `https://www.facebook.com/ads/library/?id=<ID>`.
2. Prefer `yt-dlp -g` first to confirm a downloadable media URL exists.
3. Use `yt-dlp -o '<path>.%(ext)s' <sourceUrl>` to download only after duration is known or inferred to be `<= 60` seconds.
4. Verify saved files with:

```bash
ffprobe -v error -show_entries format=duration,size,format_name -of json <file>
```

5. Treat `fbcdn.net` media URLs as temporary signed URLs. Do not store them as permanent source links.
6. Do not use browser-cookie extraction unless the user explicitly approves that risk.

## Script Analysis Checks

First-version script analysis stops at structured decomposition and classification:

1. Validate MP4 metadata with `ffprobe`.
2. Extract or transcribe audio into timestamped segments. If there is no spoken audio, mark `no_spoken_audio`.
3. Detect visual sections using scene detection when available. For simple ads, fixed interval frames are acceptable when shot detection fails.
4. Extract representative frames for each visual section.
5. Read visible frame text with vision or OCR when available, especially subtitles, price, offer, product names, and CTA.
6. Merge transcript and visual sections into one timeline.
7. Assign one script type: pain-solution, educational, testimonial, ritual-scenario, price-promotion, product-demo, belief-or-use-case-scenario, or other-or-unclear.

Do not produce learning recommendations, scoring, or rewrite templates in this first-version scope.

## Fallback Sequence

1. Try DOM text/link extraction from the loaded page.
2. Try page HTML search for:
   - `https:\\/\\/video`
   - `.mp4`
   - `.m3u8`
   - `ad_snapshot_url`
   - `/ads/library/?id=`
3. Try opening the card/snapshot link and repeat extraction.
4. If no video URL is available, return `source_only` with the durable source URL.

## Evidence

When extraction is uncertain, save a small evidence bundle:

- source URL
- search URL if applicable
- timestamp
- screenshot path if available
- raw card text
- extracted source URL
- extraction status and reason

Never print or store Facebook access tokens in the evidence bundle.

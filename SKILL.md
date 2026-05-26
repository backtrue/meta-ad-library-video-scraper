---
name: meta-ad-library-video-scraper
description: Use when Codex must run the fixed Meta/Facebook Ad Library video-ad workflow by keyword, running duration, or direct video URL. The skill searches Meta Ad Library web UI results, excludes the user's own brand, downloads only verified short videos, outputs first-version 1-7 script analysis, and finishes by creating a Google Docs deliverable without inventing replacement workflows.
---

# Meta Ad Library Video Scraper

## Execution Contract

When this skill is invoked, run the workflow autonomously from start to finish.
Do not ask for step-by-step confirmation.
Do not replace the workflow with another method.
Do not invent a new date strategy, search strategy, download strategy, API
strategy, browser strategy, or analysis scope.

If a required step fails:

1. Retry only the same step using the method already defined in this skill.
2. If the same step still cannot continue, stop the run.
3. Report the exact failed step, exact input, observed output/error, and the
   status of every item already processed.
4. Do not continue with a different workflow.

This skill is a checklist to execute, not a planning document. The correct
response to an unexpected page state is "stop and report", not "design a new
workflow".

## Absolute Rules

- Do not read `.env`, `.env.local`, project secrets, access tokens, or
  `META_ACCESS_TOKEN`.
- Do not call Meta Graph API or `ads_archive` for normal commercial ad search.
- Do not use browser-cookie extraction with `yt-dlp` unless the user explicitly
  asks for that exact route.
- Do not store `fbcdn.net` signed URLs as durable source records.
- Do not claim a video was downloaded unless a local file exists and `ffprobe`
  verified it.
- Do not analyze videos longer than 60 seconds unless the user explicitly
  overrides the short-video scope.
- Do not output learning recommendations, scoring, or rewrite templates in the
  first-version script analysis.
- Do not use fake data, demo data, mock data, sample ads, synthetic videos, or
  deterministic fallback outputs.
- If real extraction fails, report the failure. Do not fill gaps with invented
  candidates, placeholder media, generated transcripts, or guessed analysis.
- Alternative methods are allowed only when they are explicitly written in this
  skill before execution. Do not invent a new alternative method during a run.

## Tooling and Installation Policy

This workflow is portable only through the tools explicitly allowed here.
Different machines may not have the same local setup, but missing dependencies
do not permit inventing a replacement stack.

Before running, check whether the required tools are already available:

- browser capable of rendering Meta Ad Library pages
- Node.js only for the bundled URL builder script in this skill
- `yt-dlp` for Meta/Facebook video metadata resolution and downloads
- `ffmpeg` and `ffprobe` for media verification, frame extraction, and audio
  checks
- Python 3 with document-generation dependencies already available in the
  active runtime, such as `python-docx` and `Pillow`, when creating DOCX before
  Google Docs import
- Google Drive / Google Docs tooling, when creating the final native Google Doc

If a required tool is missing:

1. Do not switch to a different scraping, download, transcription, browser,
   media, or document-generation tool.
2. Install or download only the missing tool from the allowlist above, and only
   after the user or host environment allows that installation.
3. If installation is not allowed or fails, stop and report the missing tool,
   the step that needs it, and the items already processed.
4. Do not use package suggestions, search results, random GitHub projects,
   browser extensions, cloud APIs, SaaS scrapers, Meta Graph API, cookie export
   helpers, or OCR/transcription services as substitutes unless this skill is
   explicitly updated before execution to allow them.

## Entry Types

Start by classifying the user's request into exactly one entry type:

- `keyword_search`: user gives a keyword and wants Meta Ad Library candidates.
- `ad_library_url`: user gives `facebook.com/ads/library/?id=<ID>`.
- `facebook_video_url`: user gives Facebook watch, video, or Reels URL.
- `temporary_media_url`: user gives `fbcdn.net` or another signed media URL.
- `direct_video_url`: user gives a direct downloadable video URL.

If the user gives a keyword search request, follow Keyword Search Workflow.
If the user gives any URL, follow Direct URL Workflow.

## Required User Inputs

Before keyword search or analysis, identify these values from the request:

- keyword, for keyword search
- country, default `TW` for Taiwan workflows
- own brand name for exclusion
- duration filter, if requested
- short-video scope, default `<= 60` seconds

If own brand is missing, ask only for the own brand name. After the user
answers, continue automatically. If the user says there is no own brand, record
`none`.

## Duration Meaning

Duration filters have fixed meanings:

- running one month or more = `30`
- running one quarter or more = `90`
- running half year or more = `180`

These numbers are used only by the URL builder to produce the Ad Library URL.
Do not reinterpret them.

## Keyword Search Workflow

Follow these steps in order. Do not skip, reorder, or replace them.

1. Confirm the entry type is `keyword_search`.
2. Confirm the keyword, country, own brand exclusion, video-only scope, and
   duration filter.
3. Build the search URL with the URL builder:

   ```bash
   node scripts/build_ad_library_url.mjs "<keyword>" <country> <durationDays>
   ```

4. Use `30`, `90`, or `180` exactly when the user requested one month, one
   quarter, or half year.
5. Do not remove `start_date[max]` from the generated URL.
6. Do not add `start_date[min]` yourself.
7. Do not split the search into custom date windows.
8. Open the generated Meta Ad Library URL in a browser.
9. Wait for cards to render.
10. Extract candidate ads from the rendered cards:
    - Ad Library ID
    - page or brand name
    - visible ad copy
    - delivery/start date text
    - source URL shaped as `https://www.facebook.com/ads/library/?id=<ID>`
    - media indicators
    - visible video duration when available
11. If the browser page displays filters that contradict the generated URL,
    stop before downloading anything and report the mismatch. Do not change
    search strategy.
12. Exclude ads whose page name, advertiser name, visible brand name,
    destination URL, or known alias clearly matches the own brand.
13. Keep uncertain brand matches and mark `needs_brand_review`.
14. For remaining candidates, resolve video metadata or media URL with
    `yt-dlp` without browser-cookie extraction.
15. If duration is known and `> 60`, mark `over_60s` and skip download.
16. If duration is unknown, resolve metadata first. Do not download blindly.
17. If duration is `<= 60`, download the video with `yt-dlp`.
18. Verify the saved file with `ffprobe`.
19. If the verified file duration is `> 60`, mark `over_60s` and do not analyze.
20. If the verified file duration is `<= 60`, run Short Video Script Analysis.
21. Classify industry relevance before creating any external report.
22. Save outputs and a run summary.
23. Create the final Google Docs deliverable.

Allowed real extraction methods for keyword search are only:

- rendered browser card extraction from the generated Meta Ad Library URL
- Ad Library source URL resolution with `yt-dlp` without browser-cookie
  extraction
- local file verification with `ffprobe`
- local audio/frame extraction from verified downloaded files

No demo, mock, cached sample, or synthetic candidate may be introduced.

## Direct URL Workflow

Follow these steps in order. Do not skip, reorder, or replace them.

1. Classify the URL as one of:
   - `ad_library_url`
   - `facebook_video_url`
   - `temporary_media_url`
   - `direct_video_url`
2. Preserve the original URL as `sourceUrl`.
3. For `temporary_media_url`, mark `sourceType` as `temporary_media_url` and
   do not treat it as durable.
4. Try to resolve video metadata or a media URL with `yt-dlp` without
   browser-cookie extraction.
5. If the URL cannot be resolved with this method, stop and report
   `source_only`. Do not switch methods.
6. If duration is known and `> 60`, mark `over_60s` and stop.
7. If duration is unknown, resolve metadata first. Do not download blindly.
8. If duration is `<= 60`, download the video.
9. Verify the saved file with `ffprobe`.
10. If the verified file duration is `> 60`, mark `over_60s` and stop.
11. If the verified file duration is `<= 60`, run Short Video Script Analysis.
12. Create the final Google Docs deliverable.

Allowed real extraction methods for direct URLs are only:

- `yt-dlp` without browser-cookie extraction
- direct HTTP download only when the URL itself is a direct downloadable video
  URL
- local file verification with `ffprobe`
- local audio/frame extraction from verified downloaded files

No demo, mock, cached sample, or synthetic video may be introduced.

## Short Video Script Analysis

Run this workflow only after a local video file exists and `ffprobe` confirms
duration is `<= 60` seconds.

The analysis deliverable is a real storyboard (`分鏡稿`), not a transcript table
or a summary table. A storyboard decomposes the video into ordered shots/visual
panels. Each storyboard row must describe what the viewer sees in that shot,
how the shot is framed, what action happens, what audio/text is present, and
what script function the shot serves.

For existing ads, use extracted representative frames as the storyboard panels.
Do not replace storyboard output with raw speech transcript, generic notes, or
high-level summaries. Raw transcripts may be kept as evidence files, but the
user-facing report must be a storyboard-first deliverable.

1. Input video context:
   - local MP4 path
   - original source URL
   - source type
   - page or brand name, if known
   - ad copy, if known
   - delivery/start date text, if known
2. Verify video basics:
   - duration
   - resolution
   - whether audio exists
   - vertical or horizontal format
3. Extract spoken audio text:
   - transcribe voiceover or dialogue when possible
   - mark `no_spoken_audio` when absent
   - keep timestamp ranges
4. Segment the visual timeline:
   - detect shots or visual sections
   - if scene detection is unavailable, use fixed interval frames
   - keep shot number, start time, end time, duration, representative frame path,
     and visual description
   - each segment must correspond to a storyboard panel or a visually distinct
     beat; do not group unrelated visuals only because the transcript is nearby
5. Identify on-screen text:
   - subtitles
   - large text overlays
   - price or offer text
   - product name
   - call-to-action text
6. Merge into one script timeline:
   - shot number
   - time range and duration
   - representative frame path
   - shot size / framing when inferable (`wide`, `medium`, `close-up`,
     `detail/product close-up`, `screen/text card`, or `unknown`)
   - camera / edit note when inferable (`static`, `handheld`, `push-in`,
     `cut`, `split-screen`, `before-after`, or `unknown`)
   - visual panel description: composition, subject, product placement, action
   - spoken audio or `no_spoken_audio`
   - on-screen text
   - script function
   - viewer job: what this shot is trying to make the viewer notice, believe,
     feel, or do
7. Classify the script structure with one primary type:
   - pain-solution
   - educational
   - testimonial
   - ritual-scenario
   - price-promotion
   - product-demo
   - belief-or-use-case-scenario
   - other-or-unclear

After step 7, continue to Final Google Docs Deliverable. Do not add learning
points, scoring, or rewrite templates unless the user later asks for them.

## Industry Relevance Filter

Keyword match alone is not enough for the external Google Docs report.

Before creating the final report, classify each downloaded/analyzed ad as either
`industry_relevant` or `off_industry`.

For a keyword such as `沉香`, keep only ads that are directly about the target
industry, including:

- agarwood, incense, incense products, incense making, aromatherapy use cases,
  ritual/religious incense use, fragrance tools, or directly related product
  demonstrations
- brands or stores selling the target product category
- educational content about the target product category

Exclude from the external report ads that only happened to match the keyword but
are not part of the target industry, including:

- unrelated political, public figure, or issue ads
- dating, social, game, app, or entertainment ads
- general fashion/media/lifestyle ads where the target keyword is incidental
- any other ad where the product, service, or viewer job is not about the target
  industry

Keep excluded records in internal evidence files if they were processed, but do
not include their storyboard sections or candidate rows in the external Google
Docs report. The external report summary may state the count excluded for
off-industry mismatch, without listing local paths.

## Final Google Docs Deliverable

This is the final step of every successful run. Do not stop at local Markdown,
JSON, DOCX, or terminal output when Google Drive tooling is available.

1. Decide the document hierarchy before formatting:
   - this workflow's main deliverable is the per-ad storyboard (`逐則廣告分鏡`)
   - run summary, candidate table, evidence notes, and sources are supporting
     material only
   - typography, section order, table width, and image sizing must make the
     storyboard easier to read before optimizing any supporting section
2. Build a Google Docs-ready document from the completed storyboard report.
3. If the user provides a Google Docs example or template URL, inspect that
   document and match its section order, heading style, table structure, and
   image placement as closely as the Google Docs import/edit tooling allows,
   while preserving the storyboard as the reading priority.
4. If no example is provided, use the Storyboard Output Rules below as the
   document structure.
5. The Google Doc must include:
   - Chinese section headings only; use `執行摘要`, `候選廣告表`,
     `逐則廣告分鏡`, `證據保存說明`, and `資料來源` instead of English
     headings such as `Run summary`, `Candidate table`, `Per-ad storyboard`,
     `Evidence paths`, or `Sources`
   - Candidate table with one source link for every analyzed ad
   - Per-ad storyboard sections
   - embedded representative frames in the `Frame` column when local frame
     files exist
   - evidence status
   - source links used by the run
6. Treat the Google Doc as an external-facing report:
   - do not include local filesystem paths such as `/Users/...`, `/private/...`,
     local MP4 paths, local frame paths, JSON paths, transcript directories, or
     contact-sheet paths
   - do not expose internal temp file names
   - keep evidence files locally, but describe them only as retained internal
     run evidence unless the user explicitly asks for local audit paths
7. If creating a native Google Doc requires a DOCX import, generate the DOCX
   locally first, sanitize it for Google Docs title/border artifacts when the
   sanitizer is available, then import it as a native Google Doc.
8. Read the created Google Doc back through Google Docs tooling and verify:
   - title exists
   - `執行摘要` exists
   - candidate table row count matches the analyzed ad count plus header
   - candidate table includes one source link for every analyzed ad
   - every analyzed ad has a storyboard section
   - storyboard table count matches the analyzed ad count
   - no local filesystem path appears in the document text
   - storyboard table body text is not smaller than the supporting candidate
     table text
   - storyboard visual/content columns are readable as the main body of the
     report, not compressed like appendix data
9. If Google Docs PDF export is available, export and visually check the PDF.
   If export is blocked by permissions, report the exact export error and keep
   the verified native Google Doc as the final deliverable.
10. Final user response must include the Google Docs URL and a concise
   verification summary. Do not present local files as the primary deliverable
   once the Google Doc exists.

## Storyboard Output Rules

A completed short-video analysis report must contain these sections in this
order:

1. `逐則廣告分鏡`: the primary report body.
   - place it before long execution details unless the user explicitly asks for
     an operations-first report
   - one short strategy sentence can introduce each ad, but the storyboard table
     remains the main content
   - storyboard body text must be larger or equal to any supporting table text;
     use at least 11 pt for storyboard body text and 11 pt bold for storyboard
     headers unless the user explicitly asks for a compact appendix format
   - representative frames, `視覺內容`, `畫面文字`, and `觀眾任務` are the
     priority columns; they must not be visually minimized below index columns
     like `鏡次`, `時間`, or `腳本功能`
   - no raw transcript wall
   - Traditional Chinese user-facing wording
2. `候選廣告表`: a supporting index of all downloaded/analyzed ads with Ad Library ID, page,
   duration, script type, Meta Ad Library source link, and storyboard strategy.
   Do not include local video paths or contact sheet paths in the external
   report.
   Supporting table text must be readable in Google Docs; use at least 9 pt for table
   body text and at least 9 pt bold for headers unless the user explicitly asks
   for a compact appendix format.
3. `執行摘要`: supporting context only; keep it concise when the report is for
   external readers.
4. `證據保存說明`: describe retained evidence categories without local paths.
5. `資料來源`: include external source links used by the run.

The per-ad storyboard table must use this column set:

| Shot | Time | Frame | Shot / framing | Visual panel | On-screen text | Audio | Script function | Viewer job |

Do not omit `Frame`, `Shot / framing`, or `Viewer job`; these are what make the
output a storyboard instead of a transcript summary.

## Output Contract

For each candidate ad:

```json
{
  "pageName": "",
  "excludedBrand": "",
  "brandMatchStatus": "included | excluded_self_brand | needs_brand_review",
  "adCopy": "",
  "deliveryText": "",
  "sourceUrl": "",
  "sourceType": "ad_library_url | facebook_video_url | temporary_media_url | direct_video_url | keyword_discovery",
  "videoUrls": [],
  "visibleDurationSec": null,
  "verifiedDurationSec": null,
  "localVideoPath": "",
  "status": "downloaded_short_video | over_60s | video_link_found | source_only | temporary_source_url | extraction_failed",
  "notes": ""
}
```

For completed script analysis:

```json
{
  "sourceUrl": "",
  "sourceType": "ad_library_url | facebook_video_url | temporary_media_url | direct_video_url | keyword_discovery",
  "localVideoPath": "",
  "pageName": "",
  "adCopy": "",
  "deliveryText": "",
  "video": {
    "durationSec": null,
    "resolution": "",
    "orientation": "vertical | horizontal | square | unknown",
    "hasAudio": null
  },
  "transcript": [
    {
      "startSec": null,
      "endSec": null,
      "text": ""
    }
  ],
  "timeline": [
    {
      "shotNumber": null,
      "startSec": null,
      "endSec": null,
      "durationSec": null,
      "representativeFramePath": "",
      "shotFraming": "wide | medium | close-up | detail/product close-up | screen/text card | unknown",
      "cameraOrEdit": "static | handheld | push-in | cut | split-screen | before-after | unknown",
      "visualDescription": "",
      "spokenAudio": "",
      "onScreenText": "",
      "scriptFunction": "hook | problem | solution | proof | product_demo | offer | cta | transition | unclear",
      "viewerJob": ""
    }
  ],
  "scriptType": "pain-solution | educational | testimonial | ritual-scenario | price-promotion | product-demo | belief-or-use-case-scenario | other-or-unclear"
}
```

## Failure Report Contract

When the run stops because a step cannot continue, report:

- failed step number and name
- exact input used at that step
- exact observed output, page text, command error, or missing data
- candidates already processed
- candidates skipped and why
- files already created

Do not include a replacement plan unless the user asks for one.

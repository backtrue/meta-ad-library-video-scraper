---
name: meta-ad-library-video-scraper
description: Search Meta/Facebook Ad Library for long-running video ads by keyword, or analyze a directly pasted Ad Library, Facebook video/Reels/watch, fbcdn, direct MP4, or local video file. Use for short-video ad script analysis, especially when the user wants to keep only videos 60 seconds or shorter, preserve original source links, download/verify video files, transcribe speech, extract frames, read on-screen text, and classify the script structure.
---

# Meta Ad Library Video Scraper

## Scope

This skill supports three environments:

- Claude Desktop or Claude web app: best for uploaded video files, direct video URLs, and Ad Library URLs that can be resolved in Claude's code execution environment.
- Claude Code: best for local workflows with `yt-dlp`, `ffprobe`, browser access, and file outputs.
- Codex or other agent tools: best for browser-assisted Meta Ad Library discovery and local batch processing.

The first-version analysis ends at script structure classification. Do not output learning recommendations, scoring, or rewrite templates unless the user explicitly asks for them later.

## Required User Context

Before searching or analyzing, identify:

- entry type: keyword search, Ad Library URL, Facebook video/Reels/watch URL, `fbcdn.net` temporary media URL, direct video URL, or local video file
- user's own brand name for exclusion, unless already provided
- country, default `TW` for Taiwan workflows
- short-video scope, default `<= 60` seconds
- running-duration filter for keyword search, such as one month, one quarter, or half year

If the user says there is no brand to exclude, record exclusion brand as `none`.

## Entry Routing

### Keyword Search

Use this path when the user gives a keyword and wants candidates from Meta Ad Library.

1. Confirm keyword, exclusion brand, country, video-only scope, and running-duration filter.
2. Build a Meta Ad Library URL with `media_type=video`, exact phrase search, and optional `start_date[max]`.
3. Open the URL in a browser only when the environment has browser access and the user is logged in to Facebook.
4. Extract candidate ads:
   - page or brand name
   - visible ad copy
   - delivery/start date text
   - Ad Library URL or snapshot/source link
   - visible media indicators
   - visible video duration when available
5. Exclude clear self-brand matches by page name, advertiser name, visible brand mark, destination host, or known alias.
6. Keep uncertain brand matches and mark `needs_brand_review`.
7. For short-video analysis, resolve duration before download when possible.
8. Download only candidates verified or strongly inferred as `<= 60` seconds.
9. Verify every downloaded file with `ffprobe` before analysis.

Use `scripts/build_ad_library_url.mjs` when a deterministic URL is enough:

```bash
node scripts/build_ad_library_url.mjs "沉香" TW 180
```

Duration arguments:

- `30`: running one month or more
- `90`: running one quarter or more
- `180`: running half year or more

### Direct URL

Use this path when the user pastes a specific URL they already consider worth analyzing.

1. Classify the URL:
   - `ad_library_url`: `facebook.com/ads/library/?id=<ID>`
   - `facebook_video_url`: Facebook watch, video, or Reels URL
   - `temporary_media_url`: `fbcdn.net` or another signed expiring media URL
   - `direct_video_url`: direct MP4 or other downloadable video URL
   - `unsupported_url`: cannot be resolved as a video source
2. For `ad_library_url`, preserve the Ad Library URL as the durable source.
3. For `facebook_video_url`, try `yt-dlp` without browser-cookie extraction first.
4. For `temporary_media_url`, download immediately if possible, but mark the source as `temporary_source_url`; do not treat it as a durable source record.
5. For `direct_video_url`, download to a local file and preserve the URL as `sourceUrl`.
6. After download, verify with `ffprobe`.
7. If duration is `> 60` seconds, stop and mark `over_60s` unless the user explicitly overrides the short-video scope.
8. If duration is `<= 60` seconds, continue to Short Video Script Analysis.
9. If the URL cannot be resolved, return the source URL, failure reason, and next viable route. Do not invent a video path.

### Local Video File

Use this path when the user uploads or points to a local video file.

1. Preserve the local file path.
2. Ask for or infer original source URL if available.
3. Verify the file with `ffprobe`.
4. Stop at `over_60s` if it exceeds the short-video scope.
5. Continue to Short Video Script Analysis when `<= 60` seconds.

## Download and Verification Rules

- Prefer `yt-dlp` for Ad Library and Facebook URL resolution when available.
- Do not use browser-cookie extraction unless the user explicitly approves that route.
- Do not store `fbcdn.net` signed URLs as durable source records.
- Always preserve the durable source:
  - Ad Library URL for Ad Library ads
  - original page/video URL for Facebook videos
  - direct URL for direct downloadable videos
  - local file path plus any user-provided source for uploaded files
- Always verify downloaded files with `ffprobe`.

Minimum `ffprobe` check:

```bash
ffprobe -v error \
  -show_entries format=duration,size,format_name \
  -show_entries stream=index,codec_type,codec_name,width,height,r_frame_rate \
  -of json <video-file>
```

## Short Video Script Analysis

Run this workflow only after a video has been verified as `<= 60` seconds.

1. Input video context:
   - local video path
   - source URL or source note
   - source type
   - page or brand name if known
   - ad copy if known
   - delivery/start date text if known
2. Verify video basics:
   - duration
   - resolution
   - orientation
   - whether audio exists
3. Extract spoken audio text:
   - transcribe voiceover or spoken dialogue when possible
   - mark `no_spoken_audio` when absent
   - keep timestamp ranges for transcript segments
4. Segment the visual timeline:
   - detect shots or visual sections when tools are available
   - fixed-interval frames are acceptable for simple ads when shot detection is unavailable
   - keep start time, end time, representative frame path, and brief visual description
5. Identify on-screen text:
   - subtitles
   - large text overlays
   - price or offer text
   - product name
   - CTA text
6. Merge into a script timeline:
   - time range
   - visual description
   - spoken audio
   - on-screen text
   - script function
7. Classify the script structure, choosing one primary type:
   - pain-solution
   - educational
   - testimonial
   - ritual-scenario
   - price-promotion
   - product-demo
   - belief-or-use-case-scenario
   - other-or-unclear

## Output Contract

Candidate extraction:

```json
{
  "pageName": "",
  "excludedBrand": "",
  "brandMatchStatus": "included | excluded_self_brand | needs_brand_review",
  "adCopy": "",
  "deliveryText": "",
  "sourceUrl": "",
  "sourceType": "ad_library_url | facebook_video_url | temporary_media_url | direct_video_url | local_video_file | keyword_discovery",
  "videoUrls": [],
  "visibleDurationSec": null,
  "verifiedDurationSec": null,
  "localVideoPath": "",
  "status": "downloaded_short_video | over_60s | video_link_found | source_only | temporary_source_url | extraction_failed",
  "notes": ""
}
```

Completed script analysis:

```json
{
  "sourceUrl": "",
  "sourceType": "ad_library_url | facebook_video_url | temporary_media_url | direct_video_url | local_video_file | keyword_discovery",
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
      "startSec": null,
      "endSec": null,
      "representativeFramePath": "",
      "visualDescription": "",
      "spokenAudio": "",
      "onScreenText": "",
      "scriptFunction": "hook | problem | solution | proof | product_demo | offer | cta | transition | unclear"
    }
  ],
  "scriptType": "pain-solution | educational | testimonial | ritual-scenario | price-promotion | product-demo | belief-or-use-case-scenario | other-or-unclear"
}
```

## Boundaries

- Do not promise complete historical coverage for normal commercial ads.
- Do not infer spend, conversions, or performance from running duration.
- Treat long-running ads as script-analysis candidates, not proven winners.
- Do not expose or store access tokens.
- Do not claim a video was downloaded unless a verified local file exists.

See `references/extraction-workflow.md` for extraction heuristics and fallback sequence.

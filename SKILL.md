---
name: meta-ad-library-video-scraper
description: Use when Codex must run the fixed Meta/Facebook Ad Library video-ad workflow by keyword, running duration, or direct video URL. The skill searches Meta Ad Library web UI results, excludes the user's own brand, downloads only verified short videos, and outputs first-version 1-7 script analysis without inventing replacement workflows.
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
21. Save outputs and a run summary.

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
   - keep start time, end time, frame path, and visual description
5. Identify on-screen text:
   - subtitles
   - large text overlays
   - price or offer text
   - product name
   - call-to-action text
6. Merge into one script timeline:
   - time range
   - visual description
   - spoken audio
   - on-screen text
   - script function
7. Classify the script structure with one primary type:
   - pain-solution
   - educational
   - testimonial
   - ritual-scenario
   - price-promotion
   - product-demo
   - belief-or-use-case-scenario
   - other-or-unclear

Stop here unless the user later asks for learning points, scoring, or rewrite
templates.

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

## Failure Report Contract

When the run stops because a step cannot continue, report:

- failed step number and name
- exact input used at that step
- exact observed output, page text, command error, or missing data
- candidates already processed
- candidates skipped and why
- files already created

Do not include a replacement plan unless the user asks for one.

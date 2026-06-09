# Meta Ad Library Video Scraper Skill

A portable Agent Skill for finding and analyzing short-form Meta/Facebook Ad Library video ads.

The skill supports:

- same-industry keyword search in Meta Ad Library
- Taiwan popular-inspiration keyword discovery before Meta Ad Library search
- direct Ad Library URLs
- Facebook video, Reels, and watch URLs
- temporary `fbcdn.net` media URLs
- direct MP4/video URLs
- `<= 60s` short-video filtering
- source preservation
- `ffprobe` verification
- transcript, frame, on-screen text, and script-structure analysis

## Analysis Modes

The skill has two separate workflows:

- Same-industry storyboard analysis: use a provided keyword or URL, keep only ads relevant to the target industry, and produce a storyboard-first Google Docs report.
- Popular short-video storyboard inspiration: discover Taiwan-market search terms first, then use those terms to search Meta Ad Library. This mode does not require ads to be in the target industry; it keeps ads that are useful for storyboard inspiration and have traceable keyword-source evidence.

Popular-inspiration mode uses only these keyword sources:

- Google Trends for Taiwan trending searches and relative interest
- Google Keyword Planner for Taiwan keyword ideas and search volume ranges, only when account access is available
- TikTok Creative Center for Taiwan ad keywords, hashtags, and short-video trends, only when the page is available

Do not substitute Google Search Console, YouTube Studio Trends, Pinterest Trends, Amazon Brand Analytics, Microsoft Keyword Planner, third-party SEO tools, browser extensions, or invented seed lists unless the skill is explicitly updated first.

## Install in Claude Desktop or Claude Web

1. Download `dist/meta-ad-library-video-scraper-skill.zip` from this repo.
2. Open Claude.
3. Go to `Customize > Skills`.
4. Click the add button and choose `Upload a skill`.
5. Upload the ZIP file.
6. Enable the skill.

Best fit in Claude Desktop or Claude web:

- uploaded video files
- direct video URLs
- Ad Library URLs that Claude can resolve in its code execution environment

Browser-login-based Facebook extraction is environment-dependent. If Claude cannot access your logged-in Facebook browser session, use Claude Code or Codex for discovery, or paste a specific video/source URL.

## Install in Claude Code

Personal skill:

```bash
mkdir -p ~/.claude/skills
cp -R meta-ad-library-video-scraper ~/.claude/skills/
```

Project skill:

```bash
mkdir -p .claude/skills
cp -R meta-ad-library-video-scraper .claude/skills/
```

Then start or restart Claude Code and ask for Meta Ad Library short-video analysis.

## Install in Codex

```bash
mkdir -p ~/.codex/skills
cp -R meta-ad-library-video-scraper ~/.codex/skills/
```

## Required / Allowed Local Tools

For the full local workflow, use only the tools allowed by `SKILL.md`:

- browser capable of rendering Meta Ad Library pages
- Node.js, only for `scripts/build_ad_library_url.mjs`
- `yt-dlp`, for resolving and downloading Facebook/Ad Library videos
- FFmpeg, for `ffprobe` video verification and frame/audio extraction
- Python 3 with document-generation dependencies already available in the active runtime, such as `python-docx` and `Pillow`, when creating DOCX before Google Docs import
- Google Drive / Google Docs tooling, when creating the final native Google Doc
- Google Trends web UI, Google Keyword Planner, and TikTok Creative Center only for popular-inspiration keyword discovery

If one of these tools is missing, install only the missing allowlisted tool after the user or host environment allows it. Do not substitute SaaS scrapers, random GitHub projects, browser extensions, Meta Graph API, cookie export helpers, OCR/transcription services, or other tools unless the skill is explicitly updated before execution.

## Example Keyword URL

```bash
node scripts/build_ad_library_url.mjs "沉香" TW 180
```

This creates a Taiwan video-only exact phrase Ad Library search URL for ads that started at least 180 days ago.

## Output Scope

The first-version analysis is storyboard-first and stops at:

1. video source
2. video basics
3. ad copy
4. transcript status when available
5. visual storyboard timeline
6. on-screen text
7. script structure classification

It intentionally does not output learning recommendations, scores, or rewrite templates unless the user asks for them after analysis.

## Sources

- Meta Ad Library Help: https://www.facebook.com/help/259468828226154/
- Google Trends Trending Now Help: https://support.google.com/trends/answer/3076011?hl=en
- Google Trends data FAQ: https://support.google.com/trends/answer/4365533?hl=en
- Google Keyword Planner Help: https://support.google.com/google-ads/answer/7337243?hl=EN-GB
- TikTok Keyword Insights Help: https://ads.us.tiktok.com/help/article/keyword-insights
- TikTok Trends Help: https://ads.us.tiktok.com/help/article/how-to-use-trends
- Claude custom skills upload: https://support.claude.com/en/articles/12512180-using-skills-in-claude
- Claude Code Agent Skills: https://docs.claude.com/en/docs/claude-code/skills
- FFmpeg ffprobe documentation: https://ffmpeg.org/ffprobe.html
- yt-dlp project: https://github.com/yt-dlp/yt-dlp

# Meta Ad Library Video Scraper Skill

A portable Agent Skill for finding and analyzing short-form Meta/Facebook Ad Library video ads.

The skill supports:

- keyword discovery in Meta Ad Library
- direct Ad Library URLs
- Facebook video, Reels, and watch URLs
- temporary `fbcdn.net` media URLs
- direct MP4/video URLs
- local video files
- `<= 60s` short-video filtering
- source preservation
- `ffprobe` verification
- transcript, frame, on-screen text, and script-structure analysis

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

- Claude custom skills upload: https://support.claude.com/en/articles/12512180-using-skills-in-claude
- Claude Code Agent Skills: https://docs.claude.com/en/docs/claude-code/skills
- FFmpeg ffprobe documentation: https://ffmpeg.org/ffprobe.html
- yt-dlp project: https://github.com/yt-dlp/yt-dlp

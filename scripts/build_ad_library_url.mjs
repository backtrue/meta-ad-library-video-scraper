#!/usr/bin/env node

const [keywordArg, countryArg = "TW", durationDaysArg = ""] = process.argv.slice(2);

if (!keywordArg || keywordArg.trim().length < 2) {
  console.error("Usage: build_ad_library_url.mjs <keyword> [country=TW] [durationDays=30|90|180]");
  process.exit(1);
}

const keyword = keywordArg.trim();
const country = countryArg.trim().toUpperCase();
const durationDays = Number.parseInt(durationDaysArg, 10);
const url = new URL("https://www.facebook.com/ads/library/");

url.searchParams.set("active_status", "all");
url.searchParams.set("ad_type", "all");
url.searchParams.set("country", country);
url.searchParams.set("media_type", "video");
url.searchParams.set("q", `"${keyword}"`);
url.searchParams.set("search_type", "keyword_exact_phrase");

if (Number.isFinite(durationDays) && durationDays > 0) {
  const date = new Date();
  date.setDate(date.getDate() - durationDays);
  url.searchParams.set("start_date[max]", toYmd(date));
}

console.log(url.toString());

function toYmd(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

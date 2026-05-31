/**
 * @fileoverview TikTok scraper via tikwm.com (no API key needed).
 * Ported from Katsumi's scraper.
 * @module services/scrapers/tiktok
 */

const UA =
	"Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.6723.86 Mobile Safari/537.36";
const API_BASE = "https://www.tikwm.com/api/";

/**
 * Parse raw tikwm data into a clean structure.
 * @param {object} d - Raw tikwm response data
 * @returns {object}
 */
function parseTikTok(d) {
	return {
		id: d.id,
		title: d.title || "",
		cover: d.origin_cover || d.cover || "",
		duration: d.duration || 0,
		video: d.hdplay || d.play || "",
		videoHd: d.hdplay || "",
		videoSd: d.play || "",
		videoWm: d.wmplay || "",
		music: d.music || "",
		musicInfo: {
			title: d.music_info?.title || "",
			author: d.music_info?.author || "",
			url: d.music_info?.play || "",
			cover: d.music_info?.cover || "",
			duration: d.music_info?.duration || 0,
		},
		author: {
			id: d.author?.id || "",
			name: d.author?.unique_id || "",
			nickname: d.author?.nickname || "",
			avatar: d.author?.avatar || "",
		},
		stats: {
			likes: d.digg_count || 0,
			comments: d.comment_count || 0,
			shares: d.share_count || 0,
			views: d.play_count || 0,
		},
		images: d.images || null,
		createdAt: d.create_time || 0,
	};
}

/**
 * Check if a video URL is reachable.
 * @param {string} url
 * @returns {Promise<boolean>}
 */
async function isReachable(url) {
	try {
		const res = await fetch(url, {
			method: "HEAD",
			headers: { "User-Agent": UA },
			signal: AbortSignal.timeout(8_000),
		});
		return res.status >= 200 && res.status < 400;
	} catch {
		return false;
	}
}

/**
 * Fetch video data from tikwm API.
 * @param {string} url
 * @param {string} [hd="1"]
 * @returns {Promise<object>}
 */
async function fetchApi(url, hd = "1") {
	const res = await fetch(API_BASE, {
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
			"User-Agent": UA,
		},
		body: new URLSearchParams({ url: url.trim(), hd }).toString(),
		signal: AbortSignal.timeout(15_000),
	});

	const data = await res.json();
	if (data.code !== 0 || !data.data) {
		throw new Error(data.msg || "Failed to fetch TikTok video.");
	}
	return data.data;
}

/**
 * Download a TikTok video by URL.
 * Tries HD first, falls back to SD if HD CDN returns 502/unavailable.
 * @param {string} url
 * @returns {Promise<object>}
 */
export async function downloadTikTok(url) {
	if (!url?.trim()) throw new Error("TikTok URL is required.");

	let d = await fetchApi(url, "1");
	let result = parseTikTok(d);

	if (result.video && !result.images) {
		const hdOk = await isReachable(result.video);
		if (!hdOk && result.videoHd) {
			if (result.videoSd && result.videoSd !== result.videoHd) {
				const sdOk = await isReachable(result.videoSd);
				if (sdOk) {
					result.video = result.videoSd;
					return result;
				}
			}
			d = await fetchApi(url, "0");
			result = parseTikTok(d);
		}
	}

	return result;
}

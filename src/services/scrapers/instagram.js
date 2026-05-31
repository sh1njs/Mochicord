/**
 * @fileoverview Instagram downloader — ported from Katsumi's scraper.
 * Requires IG_SESSION_ID in .env for authenticated access.
 * Supports: posts, reels, stories, sidecar (multi-image).
 * @module services/scrapers/instagram
 */

/**
 * Extract shortcode from a post/reel URL.
 * @param {string} url
 * @returns {string|null}
 */
function extractShortcode(url) {
	return (
		url.match(
			/(?:instagram\.com|instagr\.am)\/(?:p|reel|reels|tv)\/([A-Za-z0-9_-]+)/
		)?.[1] || null
	);
}

/**
 * Extract story info from a story URL.
 * @param {string} url
 * @returns {{ username: string, storyId: string }|null}
 */
function extractStory(url) {
	const match = url.match(/instagram\.com\/stories\/([^/?]+)\/(\d+)/);
	if (!match) return null;
	return { username: match[1], storyId: match[2] };
}

/**
 * Convert a media ID (pk) to a shortcode.
 * @param {string} mediaId
 * @returns {string}
 */
function mediaIdToShortcode(mediaId) {
	const alphabet =
		"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
	let id = BigInt(mediaId);
	let shortcode = "";
	while (id > 0n) {
		shortcode = alphabet[Number(id % 64n)] + shortcode;
		id = id / 64n;
	}
	return shortcode;
}

/**
 * Get Instagram session credentials from .env.
 * @returns {{ cookies: string, csrf: string }}
 */
function getSession() {
	const sessionId = process.env.IG_SESSION_ID || "";
	if (!sessionId) throw new Error("IG_SESSION_ID is required in .env.");

	const dsUserId = process.env.IG_DS_USER_ID || "";
	const mid = process.env.IG_MID || "";
	const igDid = process.env.IG_DID || "";
	const csrf = Math.random().toString(36).slice(2);

	let cookieStr = `sessionid=${sessionId}; csrftoken=${csrf};`;
	if (dsUserId) cookieStr += ` ds_user_id=${dsUserId};`;
	if (mid) cookieStr += ` mid=${mid};`;
	if (igDid) cookieStr += ` ig_did=${igDid};`;

	return { cookies: cookieStr, csrf };
}

const UA =
	"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";
const DOC_ID = "8845758582119845";

/**
 * Fetch media data via GraphQL using shortcode.
 * @param {string} shortcode
 * @returns {Promise<object|null>}
 */
async function fetchGraphQL(shortcode) {
	const { cookies, csrf } = getSession();

	const res = await fetch("https://www.instagram.com/graphql/query", {
		method: "POST",
		headers: {
			"User-Agent": UA,
			"Content-Type": "application/x-www-form-urlencoded",
			"X-IG-App-ID": "936619743392459",
			"X-CSRFToken": csrf,
			Cookie: cookies,
			Origin: "https://www.instagram.com",
			Referer: `https://www.instagram.com/p/${shortcode}/`,
		},
		body: new URLSearchParams({
			doc_id: DOC_ID,
			variables: JSON.stringify({
				shortcode,
				fetch_tagged_user_count: null,
				hoisted_comment_id: null,
				hoisted_reply_id: null,
			}),
		}).toString(),
		signal: AbortSignal.timeout(15_000),
	});

	const data = await res.json();
	return data?.data?.xdt_shortcode_media || null;
}

/**
 * Parse GraphQL media into a clean structure.
 * @param {object} media
 * @returns {object}
 */
function parse(media) {
	const typename = media.__typename || "";

	const result = {
		shortcode: media.shortcode || "",
		type: typename,
		isVideo: media.is_video || false,
		caption: media.edge_media_to_caption?.edges?.[0]?.node?.text || "",
		author: {
			username: media.owner?.username || "",
			fullName: media.owner?.full_name || "",
			avatar: media.owner?.profile_pic_url || "",
		},
		stats: {
			likes: media.edge_media_preview_like?.count || 0,
			comments: media.edge_media_to_parent_comment?.count || 0,
			views: media.video_view_count || 0,
		},
		media: [],
	};

	if (typename === "XDTGraphSidecar") {
		const edges = media.edge_sidecar_to_children?.edges || [];
		for (const { node } of edges) {
			const videoUrl = node.video_url || node.video_resources?.[0]?.src;
			result.media.push({
				type: node.is_video ? "video" : "image",
				url: node.is_video && videoUrl ? videoUrl : node.display_url,
				thumbnail: node.display_url || "",
			});
		}
	} else if (media.is_video) {
		const videoUrl =
			media.video_url ||
			media.video_resources?.[0]?.src ||
			media.video_versions?.[0]?.url;

		result.media.push({
			type: "video",
			url: videoUrl || media.display_url || "",
			thumbnail: media.display_url || media.thumbnail_src || "",
		});
	} else {
		result.media.push({
			type: "image",
			url: media.display_url || "",
			thumbnail: media.display_url || media.thumbnail_src || "",
		});
	}

	return result;
}

/**
 * Download an Instagram post/reel/story by URL.
 * @param {string} url
 * @returns {Promise<object>}
 */
export async function downloadInstagram(url) {
	if (!url?.trim()) throw new Error("Instagram URL is required.");

	const clean = url.trim().split("?")[0];
	let shortcode;

	const storyInfo = extractStory(clean);
	if (storyInfo) {
		shortcode = mediaIdToShortcode(storyInfo.storyId);
	} else {
		shortcode = extractShortcode(clean);
	}

	if (!shortcode) {
		throw new Error(
			"Invalid Instagram URL. Supported: /p/, /reel/, /reels/, /tv/, /stories/"
		);
	}

	const media = await fetchGraphQL(shortcode);
	if (!media) {
		throw new Error(
			"Failed to fetch. Post may be private or session expired."
		);
	}

	const result = parse(media);
	if (!result.media.length) throw new Error("No downloadable media found.");
	return result;
}

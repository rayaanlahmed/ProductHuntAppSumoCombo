import fetch from "node-fetch";

/**
 * Crawl Product Hunt for trending products, optionally filtered by topic or keyword
 */
export async function crawlProductHunt(limit = 10, topic = null) {
  console.log("🧠 Starting Product Hunt crawl for:", topic);
  console.log("🔑 Using API key:", !!process.env.PRODUCTHUNT_API_KEY);

  const keyword = topic ? topic.toLowerCase() : "";

  const url = `https://api.producthunt.com/v1/posts?search[query]=${encodeURIComponent(
    keyword
  )}&per_page=${limit}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${process.env.PRODUCTHUNT_API_KEY}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`❌ Product Hunt API failed: ${response.statusText}`);
  }

  const data = await response.json();

  const posts = data?.posts || [];
  if (!posts.length) {
    console.warn(`⚠️ No posts found for "${keyword}", showing trending fallback.`);
  }

  const formatted = posts.map((p) => ({
    name: p.name,
    tagline: p.tagline,
    votes: p.votes_count,
    rating: p.reviews_rating || "N/A",
    reviewsCount: p.reviews_count || 0,
    founders:
      p.user?.name ||
      (p.makers && p.makers.length
        ? p.makers.map((m) => m.name).join(", ")
        : "Unknown"),
    url: p.redirect_url || p.discussion_url || p.url,
    homepage: p.redirect_url,
    description: p.description,
    topics: p.topics?.map((t) => t.name).join(", "),
    launchDate: p.day,
    thumbnail: p.thumbnail?.image_url,
    source: "Product Hunt",
  }));

  console.log(`✅ Returning ${formatted.length} Product Hunt results for "${keyword}"`);
  return formatted.slice(0, limit);
}

// Optional local test
if (import.meta.url === `file://${process.argv[1]}`) {
  crawlProductHunt(5, "design tools")
    .then((data) => console.log(JSON.stringify(data, null, 2)))
    .catch((err) => console.error(err));
}

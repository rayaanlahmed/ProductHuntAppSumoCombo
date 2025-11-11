import { crawlProductHunt } from "./producthunt-crawler.js";
import { crawlAppSumo } from "./appsumo-crawler.js";

/**
 * Crawl both Product Hunt and AppSumo and return a combined result.
 * @param {number} limit - Number of posts to fetch total (split between both)
 * @param {string|null} topic - Optional category or keyword filter
 * @param {string|null} sortBy - Optional sort order (latest, rating, popularity)
 */
export async function crawlCombined(limit = 10, topic = null, sortBy = null) {
  const cleanTopic = topic
    ? topic.toLowerCase().replace(/&/g, "and").replace(/\s+/g, "-")
    : null;

  console.log("🧠 Starting combined crawl for:", cleanTopic || "Trending");
  console.log("⚙️ Sort order:", sortBy || "default");

  try {
    // Divide limit evenly between Product Hunt and AppSumo
    const perSourceLimit = Math.max(1, Math.floor(limit / 2));

    // 🧩 Pass topic and sortBy correctly to both crawlers
    const [productHuntResults, appSumoResults] = await Promise.allSettled([
      crawlProductHunt(perSourceLimit, cleanTopic),
      crawlAppSumo(cleanTopic ? [cleanTopic] : [], perSourceLimit, sortBy),
    ]);

    const phData =
      productHuntResults.status === "fulfilled" ? productHuntResults.value : [];
    const asData =
      appSumoResults.status === "fulfilled" ? appSumoResults.value : [];

    // Label results by source
    const formattedPH = phData.map((p) => ({ ...p, source: "Product Hunt" }));
    const formattedAS = asData.map((p) => ({ ...p, source: "AppSumo" }));

    // Combine and sort by launch date or fallback order
    const combined = [...formattedPH, ...formattedAS].sort((a, b) => {
      if (a.launchDate && b.launchDate) {
        return new Date(b.launchDate) - new Date(a.launchDate);
      }
      return 0;
    });

    // ✅ Enforce max limit defined by user
    const finalResults = combined.slice(0, limit);

    console.log(
      `✅ Combined total: ${finalResults.length} results (${formattedPH.length} PH, ${formattedAS.length} AppSumo)`
    );

    return finalResults;
  } catch (error) {
    console.error("🚨 Combined crawler failed:", error);
    return [];
  }
}

// Optional standalone test (for local debugging)
if (import.meta.url === `file://${process.argv[1]}`) {
  crawlCombined(10, "marketing", "latest")
    .then((data) => console.log(JSON.stringify(data, null, 2)))
    .catch((err) => console.error(err));
}


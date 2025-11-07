import { crawlProductHunt } from "./producthunt-crawler.js";
import { crawlAppSumo } from "./appsumo-crawler.js";

/**
 * Crawl both Product Hunt and AppSumo and return a combined result.
 * @param {number} limit - Number of posts to fetch total (split between both)
 * @param {string|null} topic - Optional category or keyword filter
 */
export async function crawlCombined(limit = 10, topic = null) {
  const cleanTopic = topic
    ? topic.toLowerCase().replace(/&/g, "and").replace(/\s+/g, "-")
    : null;

  console.log("🧠 Starting combined crawl for:", cleanTopic || "Trending");

  try {
    // Divide limit evenly between sources
    const perSourceLimit = Math.max(1, Math.floor(limit / 2));

    const [productHuntResults, appSumoResults] = await Promise.allSettled([
      crawlProductHunt(perSourceLimit, cleanTopic),
      (async () => {
        const result = await crawlAppSumo(cleanTopic ? [cleanTopic] : [], perSourceLimit);
        return result.products || [];
      })(),
    ]);

    const phData =
      productHuntResults.status === "fulfilled" ? productHuntResults.value : [];
    const asData =
      appSumoResults.status === "fulfilled" ? appSumoResults.value : [];

    // Label results by source
    const formattedPH = phData.map((p) => ({ ...p, source: "Product Hunt" }));
    const formattedAS = asData.map((p) => ({ ...p, source: "AppSumo" }));

    // Combine & sort by launch date if available
    const combined = [...formattedPH, ...formattedAS].sort((a, b) => {
      if (a.launchDate && b.launchDate) {
        return new Date(b.launchDate) - new Date(a.launchDate);
      }
      return 0;
    });

    // ✅ Respect exact limit requested by user
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

// Optional standalone test
if (import.meta.url === `file://${process.argv[1]}`) {
  crawlCombined(10, "artificial-intelligence")
    .then((data) => console.log(JSON.stringify(data, null, 2)))
    .catch((err) => console.error(err));
}

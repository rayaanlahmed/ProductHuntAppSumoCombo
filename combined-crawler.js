import { crawlProductHunt } from "./producthunt-crawler.js";
import { crawlAppSumo } from "./appsumo-crawler.js";

/**
 * Crawl both Product Hunt and AppSumo and return a combined result.
 * @param {number} limit - Number of posts to fetch total (split between both)
 * @param {string|null} topic - Optional category or keyword filter
 */
export async function crawlCombined(limit = 10, topic = null) {
  // Normalize topic for both sites
  const cleanTopic = topic
    ? topic.toLowerCase().replace(/&/g, "and").replace(/-/g, " ").trim()
    : null;

  console.log("🧠 Starting combined crawl for:", cleanTopic || "Trending");

  try {
    // Let both crawlers fetch up to the full limit
    const perSourceLimit = limit;

    // Run both crawlers in parallel
    const [productHuntResults, appSumoResults] = await Promise.allSettled([
      crawlProductHunt(perSourceLimit, cleanTopic),
      (async () => {
        const result = await crawlAppSumo(
          cleanTopic ? [cleanTopic.replace(/ /g, "-")] : [],
          perSourceLimit
        );
        return result.products || [];
      })(),
    ]);

    // Handle results
    const phData =
      productHuntResults.status === "fulfilled"
        ? productHuntResults.value.products || productHuntResults.value || []
        : [];

    const asData =
      appSumoResults.status === "fulfilled" ? appSumoResults.value : [];

    console.log("📦 Product Hunt results:", phData.length);
    console.log("💰 AppSumo results:", asData.length);

    // Tag sources
    const formattedPH = phData.map((p) => ({ ...p, source: "Product Hunt" }));
    const formattedAS = asData.map((p) => ({ ...p, source: "AppSumo" }));

    // Combine & sort
    const combined = [...formattedPH, ...formattedAS].sort((a, b) => {
      if (a.launchDate && b.launchDate) {
        return new Date(b.launchDate) - new Date(a.launchDate);
      }
      return 0;
    });

    // Apply global limit
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

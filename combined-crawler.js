import { crawlProductHunt } from "./producthunt-crawler.js";
import { crawlAppSumo } from "./appsumo-crawler.js";

/**
 * Crawl both Product Hunt and AppSumo and return a combined result.
 * @param {number} limit - Total number of posts to fetch
 * @param {string|null} topic - Optional category or keyword filter
 */
export async function crawlCombined(limit = 10, topic = null) {
  const topicForPH = topic
    ? topic.toLowerCase().replace(/&/g, "and").replace(/-/g, " ").trim()
    : null;
  const topicForAS = topic
    ? topic.toLowerCase().replace(/&/g, "and").replace(/\s+/g, "-").trim()
    : null;

  console.log("🧠 Starting combined crawl for:", topicForPH || "Trending");

  try {
    const perSourceLimit = limit;

    const [productHuntResults, appSumoResults] = await Promise.allSettled([
      crawlProductHunt(perSourceLimit, topicForPH),
      (async () => {
        const result = await crawlAppSumo(topicForAS ? [topicForAS] : [], perSourceLimit);
        return result.products || [];
      })(),
    ]);

    // 🧩 Debug logs
    console.log("🧩 Raw Product Hunt result:", productHuntResults);
    console.log("🧩 Raw AppSumo result:", appSumoResults);

    const phData =
      productHuntResults.status === "fulfilled"
        ? productHuntResults.value.products || productHuntResults.value || []
        : [];

    const asData =
      appSumoResults.status === "fulfilled" ? appSumoResults.value : [];

    console.log("📦 Product Hunt results:", phData.length);
    console.log("💰 AppSumo results:", asData.length);

    const formattedPH = phData.map((p) => ({ ...p, source: "Product Hunt" }));
    const formattedAS = asData.map((p) => ({ ...p, source: "AppSumo" }));

    const combined = [...formattedPH, ...formattedAS].sort((a, b) => {
      if (a.launchDate && b.launchDate) {
        return new Date(b.launchDate) - new Date(a.launchDate);
      }
      return 0;
    });

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
  crawlCombined(10, "design tools")
    .then((data) => console.log(JSON.stringify(data, null, 2)))
    .catch((err) => console.error(err));
}


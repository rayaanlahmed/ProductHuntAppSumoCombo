import { crawlProductHunt } from "./producthunt-crawler.js";
import { crawlAppSumo } from "./appsumo-crawler.js";

/**
 * Crawl both Product Hunt and AppSumo and return a combined result.
 * @param {number} limit - Number of posts to fetch from each source
 * @param {string|null} topic - Optional category or keyword filter
 */
export async function crawlCombined(limit = 10, topic = null) {
  console.log("🧠 Starting combined crawl for:", topic);

  try {
    // Run both crawlers in parallel
    const [productHuntResults, appSumoResults] = await Promise.allSettled([
      crawlProductHunt(limit, topic),
      (async () => {
        const result = await crawlAppSumo([topic], limit);
        // ✅ Only return the products array (ignore rateLimited & metadata)
        return result.products || [];
      })(),
    ]);

    // Handle partial failures gracefully
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

    console.log(
      `✅ Combined total: ${combined.length} (${formattedPH.length} from Product Hunt, ${formattedAS.length} from AppSumo)`
    );

    return combined;
  } catch (error) {
    console.error("🚨 Combined crawler failed:", error);
    return [];
  }
}

// Optional standalone test (for local debugging)
if (import.meta.url === `file://${process.argv[1]}`) {
  crawlCombined(10, "artificial-intelligence")
    .then((data) => console.log(JSON.stringify(data, null, 2)))
    .catch((err) => console.error(err));
}


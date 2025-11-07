import fetch from "node-fetch";
import cheerio from "cheerio";

/**
 * Crawl AppSumo for products by topic/category or keyword.
 * @param {string[]} categories - Category or keyword list
 * @param {number} limit - Number of products to fetch
 */
export async function crawlAppSumo(categories = [], limit = 10) {
  const topic = categories?.[0]?.toLowerCase() || null;
  const searchUrl = topic
    ? `https://appsumo.com/search/?q=${encodeURIComponent(topic)}`
    : "https://appsumo.com/browse/";

  console.log(`💰 Crawling AppSumo for topic: "${topic}"`);
  console.log("🔗 URL:", searchUrl);

  const res = await fetch(searchUrl);
  if (!res.ok) {
    throw new Error(`❌ AppSumo request failed: ${res.statusText}`);
  }

  const html = await res.text();
  const $ = cheerio.load(html);

  const products = [];

  $(".css-1o9mv8n, .css-1cysf6l").each((_, el) => {
    if (products.length >= limit) return false;

    const name = $(el).find("h3, h2").first().text().trim();
    const summary = $(el).find("p").first().text().trim();
    const url =
      $(el).find("a").attr("href")?.startsWith("http")
        ? $(el).find("a").attr("href")
        : `https://appsumo.com${$(el).find("a").attr("href")}`;
    const price = $(el)
      .find("[class*='price'], [data-testid='price']")
      .first()
      .text()
      .trim();
    const reviews = $(el).find("[class*='review']").text().trim();

    if (name) {
      products.push({
        name,
        summary,
        url,
        price: price || "Pricing unavailable",
        reviews: reviews || null,
        source: "AppSumo",
      });
    }
  });

  console.log(`✅ Found ${products.length} AppSumo products for "${topic}"`);

  return { products };
}

// Optional local test
if (import.meta.url === `file://${process.argv[1]}`) {
  crawlAppSumo(["marketing"], 10)
    .then((data) => console.log(JSON.stringify(data, null, 2)))
    .catch((err) => console.error(err));
}

import fetch from "node-fetch";

/**
 * Crawl Product Hunt for trending products, optionally filtered by topic or keyword
 */
export async function crawlProductHunt(limit = 10, topic = null) {
  console.log("🧠 Starting Product Hunt crawl for:", topic);
  console.log("🔑 Using API key:", !!process.env.PRODUCTHUNT_API_KEY);

  const keyword = topic ? topic.toLowerCase() : "";

  // ✅ GraphQL query instead of old REST endpoint
  const query = `
    query {
      posts(order: RANKING, first: ${limit}) {
        edges {
          node {
            id
            name
            tagline
            description
            votesCount
            reviewsCount
            reviewsRating
            createdAt
            website
            url
            makers {
              name
              username
              profileImage
            }
            topics {
              edges {
                node {
                  name
                  slug
                }
              }
            }
            thumbnail {
              url
            }
          }
        }
      }
    }
  `;

  const response = await fetch("https://api.producthunt.com/v2/api/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.PRODUCTHUNT_API_KEY}`,
    },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    throw new Error(`❌ Product Hunt API failed: ${response.statusText}`);
  }

  const data = await response.json();

  if (data.errors) {
    console.error("🚨 Product Hunt API error:", data.errors);
    return [];
  }

  const posts =
    data?.data?.posts?.edges?.map((edge) => edge.node) || [];

  // ✅ Keyword/topic filtering (e.g., “design tools”)
  const filtered = keyword
    ? posts.filter((p) => {
        const text = `${p.name} ${p.tagline} ${p.description} ${p.topics?.edges
          ?.map((t) => t.node.name)
          .join(" ")}`.toLowerCase();
        return text.includes(keyword);
      })
    : posts;

  const formatted = filtered.map((p) => ({
    name: p.name,
    tagline: p.tagline,
    votes: p.votesCount,
    rating: p.reviewsRating || "N/A",
    reviewsCount: p.reviewsCount || 0,
    founders:
      p.makers?.length > 0
        ? p.makers.map((m) => m.name).join(", ")
        : "Unknown",
    url: p.website || p.url,
    homepage: p.website,
    description: p.description,
    topics: p.topics?.edges?.map((t) => t.node.name).join(", ") || "",
    launchDate: p.createdAt,
    thumbnail: p.thumbnail?.url,
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


import fetch from "node-fetch";

/**
 * Crawl Product Hunt for trending products, optionally by topic
 * @param {number} limit - Number of posts to fetch
 * @param {string|null} topic - Optional topic filter (ex: "artificial-intelligence")
 */
export async function crawlProductHunt(limit = 10, topic = null) {
  console.log("🧠 Starting crawl for topic:", topic);
  console.log("🔑 Using API key:", !!process.env.PRODUCTHUNT_API_KEY);

  const topicSlug = topic
    ? topic.toLowerCase().replace(/&/g, "and").replace(/\s+/g, "-")
    : null;

  // ✅ If a topic is selected, query that topic directly.
  const query = topicSlug
    ? `
      query {
        topic(slug: "${topicSlug}") {
          name
          posts(order: RANKING, first: ${limit}) {
            edges {
              node {
                name
                tagline
                votesCount
                website
                url
                description
                createdAt
                reviewsRating
                reviewsCount
                makers { name username profileImage }
                thumbnail { url }
                topics { edges { node { name slug } } }
              }
            }
          }
        }
      }
    `
    : `
      query {
        posts(order: RANKING, first: ${limit}) {
          edges {
            node {
              name
              tagline
              votesCount
              website
              url
              description
              createdAt
              reviewsRating
              reviewsCount
              makers { name username profileImage }
              thumbnail { url }
              topics { edges { node { name slug } } }
            }
          }
        }
      }
    `;

  const response = await fetch("https://api.producthunt.com/v2/api/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.PRODUCTHUNT_API_KEY}`,
    },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    throw new Error(`❌ Product Hunt API failed: ${response.statusText}`);
  }

  const data = await response.json();

  if (data.errors) {
    console.error("🚨 API Error:", data.errors);
    return [];
  }

  // ✅ Extract posts properly based on query type
  const allPosts = topicSlug
    ? data?.data?.topic?.posts?.edges?.map(({ node }) => node) || []
    : data?.data?.posts?.edges?.map(({ node }) => node) || [];

  // ✅ Format results consistently
  const formatted = allPosts.map((node) => ({
    name: node.name,
    tagline: node.tagline,
    votes: node.votesCount,
    rating: node.reviewsRating || "N/A",
    reviewsCount: node.reviewsCount || 0,
    founders:
      node.makers?.map(
        (m) =>
          `<a href="https://www.producthunt.com/@${m.username}" target="_blank">${m.name}</a>`
      ).join(", ") || "Unknown",
    url: node.website,
    producthunt_url: node.url,
    homepage:
      node.url ||
      `https://www.producthunt.com/posts/${node.name
        .toLowerCase()
        .replace(/\s+/g, "-")}`,
    topics: node.topics.edges.map((t) => t.node.name).join(", "),
    description: node.description,
    thumbnail: node.thumbnail?.url,
    launchDate: node.createdAt,
    source: "Product Hunt",
  }));

  console.log(`✅ Found ${formatted.length} posts for topic: ${topicSlug || "Trending"}`);
  return formatted.slice(0, limit);
}

// Optional manual test
if (import.meta.url === `file://${process.argv[1]}`) {
  crawlProductHunt(10, "artificial-intelligence")
    .then((data) => console.log(JSON.stringify(data, null, 2)))
    .catch((err) => console.error(err));
}

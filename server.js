import dotenv from "dotenv";
dotenv.config();
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { crawlProductHunt } from "./producthunt-crawler.js";
import { crawlAppSumo } from "./appsumo-crawler.js";
import { crawlCombined } from "./combined-crawler.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static("public"));

/* =========================
   ✅ PRODUCT HUNT CRAWLER
========================= */
app.post("/api/crawl", async (req, res) => {
  try {
    const { maxPages = 10, categories } = req.body;
    const limit = maxPages;
    const topic =
      Array.isArray(categories) && categories.length > 0 ? categories[0] : null;

    console.log("🧠 Received Product Hunt crawl request for topic:", topic);
    console.log("🔑 ProductHunt key loaded:", !!process.env.PRODUCTHUNT_API_KEY);

    const products = await crawlProductHunt(limit, topic);

    res.json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error("Error in /api/crawl:", error);
    res.status(500).json({
      success: false,
      error: error.message || "An error occurred while crawling Product Hunt",
    });
  }
});

/* =========================
   ✅ APPSUMO CRAWLER
========================= */
app.post("/api/appsumo-crawl", async (req, res) => {
  try {
    const { maxPages = 10, categories } = req.body;
    const limit = maxPages;
    const topic =
      Array.isArray(categories) && categories.length > 0 ? categories[0] : null;

    console.log("🧠 Received AppSumo crawl request for topic:", topic);

    const products = await crawlAppSumo(limit, topic);

    res.json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error("Error in /api/appsumo-crawl:", error);
    res.status(500).json({
      success: false,
      error: error.message || "An error occurred while crawling AppSumo",
    });
  }
});

/* =========================
   ✅ COMBINED CRAWLER (Product Hunt + AppSumo)
========================= */
app.post("/api/combined-crawl", async (req, res) => {
  try {
    const { maxPages = 10, categories } = req.body;
    const limit = maxPages;
    const topic =
      Array.isArray(categories) && categories.length > 0 ? categories[0] : null;

    console.log("🧠 Starting combined crawl for topic:", topic);

    const products = await crawlCombined(limit, topic);

    res.json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error("Error in /api/combined-crawl:", error);
    res.status(500).json({
      success: false,
      error: error.message || "An error occurred while running combined crawl",
    });
  }
});

/* =========================
   ✅ DIRECT TEST ROUTE
========================= */
app.get("/api/producthunt", async (req, res) => {
  try {
    const data = await crawlProductHunt(10);
    res.json({ success: true, count: data.length, results: data });
  } catch (error) {
    console.error("Error in Product Hunt crawl:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/* =========================
   ✅ FRONTEND
========================= */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

/* =========================
   ✅ START SERVER (Local)
========================= */
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════╗
║   🚀 Combined Product Hunt + AppSumo Server    ║
║   Running at: http://localhost:${PORT}         ║
╚═══════════════════════════════════════════════╝
  `);
});



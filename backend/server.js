import "dotenv/config";
import express from "express";
import cors from "cors";
import pool from "./db.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Echoes of the Room backend is running!",
  });
});

// Get all game levels
app.get("/api/levels", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, charges, map FROM levels ORDER BY id",
    );

    const levels = result.rows.map((row) => ({
      name: row.name,
      charges: row.charges === null ? "Infinity" : row.charges,
      map: row.map,
    }));

    res.json(levels);
  } catch (error) {
    console.error("Failed to fetch levels:", error);
    res.status(500).json({
      error: "Failed to fetch levels",
    });
  }
});

const server = app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});

async function shutdown() {
  console.log("\nShutting down server...");

  server.close(async () => {
    try {
      await pool.end();
      console.log("Database connections closed.");
      process.exit(0);
    } catch (error) {
      console.error("Error closing database connections:", error);
      process.exit(1);
    }
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

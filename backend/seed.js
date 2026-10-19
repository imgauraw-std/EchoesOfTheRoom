import pool from "./db.js";
import LEVELS from "./levels.js";

async function seedLevels() {
  try {
    for (const level of LEVELS) {
      const charges = level.charges === "Infinity" ? null : level.charges;

      await pool.query(
        `INSERT INTO levels (name, charges, map)
         VALUES ($1, $2, $3)`,
        [level.name, charges, JSON.stringify(level.map)],
      );
    }

    console.log("All levels inserted successfully!");
  } catch (error) {
    console.error("Failed to insert levels:", error);
  } finally {
    await pool.end();
  }
}

seedLevels();

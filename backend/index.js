import express from "express";
import cors from "cors";
import pkg from "pg";

const { Pool } = pkg;

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.post("/messages", async (req, res) => {
  const { text } = req.body;

  const result = await pool.query(
    "INSERT INTO messages (text) VALUES ($1) RETURNING *",
    [text]
  );

  res.json(result.rows[0]);
});

app.get("/messages", async (req, res) => {
  const result = await pool.query(
    "SELECT * FROM messages ORDER BY id DESC"
  );
  res.json(result.rows);
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend running on port ${PORT}`);
});
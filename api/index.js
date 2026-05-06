
const express = require('express');
const cors = require('cors');
const { neon } = require('@neondatabase/serverless');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const sql = neon(process.env.DATABASE_URL);

app.use(cors());
app.use(express.json());

// Initialize database table if not exists
async function initDb() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS cart_items (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT,
        quantity INTEGER DEFAULT 1,
        estimated_unit_price NUMERIC,
        is_loading_price BOOLEAN DEFAULT FALSE,
        sources JSONB DEFAULT '[]',
        is_collected BOOLEAN DEFAULT FALSE
      )
    `;
    // Ensure the is_loading_price column exists (migration)
    await sql`ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS is_loading_price BOOLEAN DEFAULT FALSE`;
    await sql`ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS sources JSONB DEFAULT '[]'`;
    await sql`ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS is_collected BOOLEAN DEFAULT FALSE`;
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization failed:', error);
  }
}

// GET all items
app.get('/api/items', async (req, res) => {
  try {
    const items = await sql`SELECT * FROM cart_items ORDER BY name ASC`;
    const formattedItems = items.map(item => ({
      id: item.id,
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      estimatedUnitPrice: item.estimated_unit_price ? parseFloat(item.estimated_unit_price) : null,
      isLoadingPrice: item.is_loading_price,
      sources: item.sources || [],
      isCollected: item.is_collected || false
    }));
    res.json(formattedItems);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST (Upsert) item
app.post('/api/items', async (req, res) => {
  const { id, name, category, quantity, estimatedUnitPrice, isLoadingPrice, sources, isCollected } = req.body;
  try {
    await sql`
      INSERT INTO cart_items (id, name, category, quantity, estimated_unit_price, is_loading_price, sources, is_collected)
      VALUES (${id}, ${name}, ${category}, ${quantity}, ${estimatedUnitPrice}, ${isLoadingPrice}, ${JSON.stringify(sources)}, ${isCollected || false})
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        category = EXCLUDED.category,
        quantity = EXCLUDED.quantity,
        estimated_unit_price = EXCLUDED.estimated_unit_price,
        is_loading_price = EXCLUDED.is_loading_price,
        sources = EXCLUDED.sources,
        is_collected = EXCLUDED.is_collected
    `;
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving item:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE item
app.delete('/api/items/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await sql`DELETE FROM cart_items WHERE id = ${id}`;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// For Vercel Serverless Functions, we export the app
module.exports = app;

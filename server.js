
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { neon } from '@neondatabase/serverless';

dotenv.config();

const app = express();
const port = 3005;
const sql = neon(process.env.DATABASE_URL);

app.use(cors());
app.use(express.json());

// Initialize database table
const initDb = async () => {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS cart_items (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT,
        quantity INTEGER DEFAULT 1,
        estimated_unit_price DECIMAL,
        is_loading_price BOOLEAN DEFAULT FALSE,
        sources JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;
    // Ensure column exists if table was created previously without it
    try {
        await sql`ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS is_loading_price BOOLEAN DEFAULT FALSE`;
    } catch (e) {
        // Ignore if already exists
    }
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
};

initDb();

// Routes
app.get('/api/items', async (req, res) => {
  try {
    const items = await sql`SELECT * FROM cart_items ORDER BY created_at ASC`;
    // Map database fields to frontend camelCase
    const mappedItems = items.map(item => ({
      id: item.id,
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      estimatedUnitPrice: item.estimated_unit_price ? parseFloat(item.estimated_unit_price) : null,
      isLoadingPrice: item.is_loading_price,
      sources: item.sources || []
    }));
    res.json(mappedItems);
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

app.post('/api/items', async (req, res) => {
  const item = req.body;
  try {
    await sql`
      INSERT INTO cart_items (id, name, category, quantity, estimated_unit_price, is_loading_price, sources)
      VALUES (${item.id}, ${item.name}, ${item.category}, ${item.quantity}, ${item.estimatedUnitPrice}, ${item.isLoadingPrice}, ${JSON.stringify(item.sources)})
      ON CONFLICT (id) DO UPDATE SET
        quantity = EXCLUDED.quantity,
        estimated_unit_price = EXCLUDED.estimated_unit_price,
        is_loading_price = EXCLUDED.is_loading_price,
        sources = EXCLUDED.sources
    `;
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving item:', error);
    res.status(500).json({ error: 'Failed to save item' });
  }
});

app.delete('/api/items/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await sql`DELETE FROM cart_items WHERE id = ${id}`;
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

app.delete('/api/items', async (req, res) => {
    try {
      await sql`DELETE FROM cart_items`;
      res.json({ success: true });
    } catch (error) {
      console.error('Error clearing items:', error);
      res.status(500).json({ error: 'Failed to clear items' });
    }
  });

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

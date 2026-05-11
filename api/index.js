
const express = require('express');
const cors = require('cors');
const { neon } = require('@neondatabase/serverless');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

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
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT,
        password TEXT NOT NULL,
        receive_promotions BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization failed:', error);
  }
}

initDb();

// Auth Routes
app.post('/api/register', async (req, res) => {
  const { id, name, email, phone, password, receivePromotions } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await sql`
      INSERT INTO users (id, name, email, phone, password, receive_promotions)
      VALUES (${id}, ${name}, ${email}, ${phone}, ${hashedPassword}, ${receivePromotions})
    `;
    res.json({ success: true });
  } catch (error) {
    console.error('Error registering user:', error);
    if (error.code === '23505') { // Unique violation
      return res.status(400).json({ error: 'E-mail já cadastrado' });
    }
    res.status(500).json({ error: 'Falha ao cadastrar usuário' });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const users = await sql`SELECT * FROM users WHERE email = ${email}`;
    if (users.length === 0) {
      return res.status(401).json({ error: 'Usuário não encontrado' });
    }
    const user = users[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Senha incorreta' });
    }
    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        receivePromotions: user.receive_promotions
      }
    });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: 'Falha ao realizar login' });
  }
});

// GET all items
app.get('/api/items', async (req, res) => {
  const { userId } = req.query;
  try {
    const items = userId 
      ? await sql`SELECT * FROM cart_items WHERE user_id = ${userId} ORDER BY name ASC`
      : await sql`SELECT * FROM cart_items ORDER BY name ASC`;
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
  const { id, name, category, quantity, estimatedUnitPrice, isLoadingPrice, sources, isCollected, userId } = req.body;
  try {
    await sql`
      INSERT INTO cart_items (id, name, category, quantity, estimated_unit_price, is_loading_price, sources, is_collected, user_id)
      VALUES (${id}, ${name}, ${category}, ${quantity}, ${estimatedUnitPrice}, ${isLoadingPrice}, ${JSON.stringify(sources)}, ${isCollected || false}, ${userId})
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        category = EXCLUDED.category,
        quantity = EXCLUDED.quantity,
        estimated_unit_price = EXCLUDED.estimated_unit_price,
        is_loading_price = EXCLUDED.is_loading_price,
        sources = EXCLUDED.sources,
        is_collected = EXCLUDED.is_collected,
        user_id = EXCLUDED.user_id
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


import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

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
        user_id TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
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
    console.error('Error initializing database:', error);
  }
};

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

// Routes
app.get('/api/items', async (req, res) => {
  const { userId } = req.query;
  try {
    const items = userId 
      ? await sql`SELECT * FROM cart_items WHERE user_id = ${userId} ORDER BY created_at ASC`
      : await sql`SELECT * FROM cart_items ORDER BY created_at ASC`;
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
      INSERT INTO cart_items (id, name, category, quantity, estimated_unit_price, is_loading_price, sources, user_id)
      VALUES (${item.id}, ${item.name}, ${item.category}, ${item.quantity}, ${item.estimatedUnitPrice}, ${item.isLoadingPrice}, ${JSON.stringify(item.sources)}, ${item.userId})
      ON CONFLICT (id) DO UPDATE SET
        quantity = EXCLUDED.quantity,
        estimated_unit_price = EXCLUDED.estimated_unit_price,
        is_loading_price = EXCLUDED.is_loading_price,
        sources = EXCLUDED.sources,
        user_id = EXCLUDED.user_id
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

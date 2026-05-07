
import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import { COMMON_PRODUCTS } from './constants.js';

dotenv.config();

const sql = neon(process.env.DATABASE_URL);

const updatePrices = async () => {
  try {
    const items = await sql`SELECT id, name FROM cart_items WHERE estimated_unit_price = 0 OR estimated_unit_price IS NULL`;
    console.log(`Found ${items.length} items to update.`);

    for (const item of items) {
      const product = COMMON_PRODUCTS.find(p => p.name === item.name);
      if (product && product.suggestedPrice) {
        console.log(`Updating ${item.name} with price ${product.suggestedPrice}`);
        await sql`UPDATE cart_items SET estimated_unit_price = ${product.suggestedPrice}, suggested_price = ${product.suggestedPrice} WHERE id = ${item.id}`;
      }
    }
    console.log('Update complete.');
    process.exit(0);
  } catch (error) {
    console.error('Error updating prices:', error);
    process.exit(1);
  }
};

updatePrices();

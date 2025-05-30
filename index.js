const express = require('express');
const cors = require('cors');
require('dotenv').config();

const shopify = require('./shopify');
const correos = require('./correos');

const app = express();
app.use(cors());
app.use(express.static('public'));
app.use(express.json());

app.get('/api/orders', async (req, res) => {
  try {
    const orders = await shopify.getFulfilledOrders();
    const updated = await correos.trackOrders(orders);
    res.json(updated);
  } catch (err) {
    res.status(500).send('Error fetching orders');
  }
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
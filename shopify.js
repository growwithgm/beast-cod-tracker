const axios = require('axios');

exports.getFulfilledOrders = async () => {
  const store = process.env.SHOPIFY_STORE_DOMAIN;
  const token = process.env.SHOPIFY_ACCESS_TOKEN;

  const response = await axios.get(
    `https://${store}/admin/api/2023-07/orders.json?status=any&fulfillment_status=fulfilled`,
    {
      headers: {
        'X-Shopify-Access-Token': token,
        'Content-Type': 'application/json'
      }
    }
  );

  return response.data.orders.filter(o =>
    o.fulfillments?.[0]?.tracking_number && o.fulfillments?.[0]?.tracking_company?.toLowerCase().includes('correos')
  );
};
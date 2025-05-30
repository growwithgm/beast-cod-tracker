const axios = require('axios');
const base64 = require('base-64');

exports.trackOrders = async (orders) => {
  const auth = base64.encode(`${process.env.CORREOS_CLIENT_ID}:${process.env.CORREOS_SECRET}`);
  const results = [];

  for (const order of orders) {
    const tracking = order.fulfillments[0].tracking_number;

    try {
      const res = await axios.get(
        `https://localizador.correos.es/canonico/eventos_envio_servicio_auth/${tracking}?codIdioma=ES&indUltEvento=S`,
        {
          headers: {
            Authorization: 'Basic ' + auth
          }
        }
      );

      const data = res.data?.[0];
      const status = data?.resumen_ultimo || 'No status';

      results.push({
        order_number: order.name,
        customer: order.customer?.first_name || '',
        tracking,
        status
      });
    } catch {
      results.push({
        order_number: order.name,
        tracking,
        status: 'Tracking error'
      });
    }
  }

  return results;
};
fetch('/api/orders')
  .then(res => res.json())
  .then(orders => {
    const container = document.getElementById('orders');
    orders.forEach(o => {
      const div = document.createElement('div');
      div.className = 'order status-' + (o.status.replace(/ /g, '') || 'Unknown');
      div.innerHTML = `<strong>${o.order_number}</strong><br>
        Customer: ${o.customer}<br>
        Tracking: ${o.tracking}<br>
        Status: ${o.status}`;
      container.appendChild(div);
    });
  });
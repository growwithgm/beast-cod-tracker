import React from 'react';
import styles from '../styles/PackingSlip.module.css';

/**
 * A presentational component that renders a single packing slip.  It
 * expects an `order` object with the following shape:
 * {
 *   orderId: string,
 *   orderDate: string,
 *   customerName: string,
 *   customerAddress: string,
 *   customerPhone: string,
 *   productQuantity: number,
 *   itemQuantity: number,
 *   items: Array<{
 *     name: string,
 *     sku: string,
 *     sellerSku: string,
 *     quantity: number,
 *     orderId: string,
 *     imageUrl: string
 *   }>
 * }
 */
export default function PackingSlip({ order }) {
  return (
    <div className={`${styles.packingSlip} packing-slip`}>
      <div className={styles.header}>
        <div>
          <div className={styles.title}>PACKING SLIP</div>
          <div>Order #: {order.orderId || ''}</div>
          <div>Date: {order.orderDate || ''}</div>
        </div>
        <div className={styles.customerInfo}>
          {order.customerName && <div><strong>{order.customerName}</strong></div>}
          {order.customerAddress && <div>{order.customerAddress}</div>}
          {order.customerPhone && <div>{order.customerPhone}</div>}
        </div>
      </div>
      <div className={styles.summary}>
        <div>Order quantity: 1</div>
        <div>Product quantity: {order.productQuantity}</div>
        <div>Item quantity: {order.itemQuantity}</div>
      </div>
      <table className={styles.itemsTable}>
        <thead>
          <tr>
            <th>No.</th>
            <th>Product Image</th>
            <th>Product Name</th>
            <th>SKU</th>
            <th>Seller SKU</th>
            <th>Qty</th>
            <th>Order ID</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item, index) => (
            <tr key={index}>
              <td>{index + 1}</td>
              <td>
                <img
                  src={
                    item.imageUrl ||
                    'https://placehold.co/60x60/f0f0f0/cccccc?text=No+Img'
                  }
                  alt={item.name || 'Product Image'}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src =
                      'https://placehold.co/60x60/f0f0f0/cccccc?text=No+Img';
                  }}
                />
              </td>
              <td>{item.name}</td>
              <td>{item.sku}</td>
              <td>{item.sellerSku}</td>
              <td>{item.quantity}</td>
              <td>{item.orderId}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className={styles.footer}>
        TikTok Shop
      </div>
    </div>
  );
}
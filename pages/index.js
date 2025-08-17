import { useState } from 'react';
import Papa from 'papaparse';
import dynamic from 'next/dynamic';
import PackingSlip from '../components/PackingSlip';

export default function Home() {
  const [ordersFile, setOrdersFile] = useState(null);
  const [imagesFile, setImagesFile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  /**
   * Handle selection of the orders CSV file.
   * @param {Event} e
   */
  const handleOrdersFileChange = (e) => {
    setOrdersFile(e.target.files?.[0] || null);
  };

  /**
   * Handle selection of the images CSV file.
   * @param {Event} e
   */
  const handleImagesFileChange = (e) => {
    setImagesFile(e.target.files?.[0] || null);
  };

  /**
   * Parse the provided CSV files and build a list of order objects.  The
   * orders CSV is grouped by Order ID and enriched with customer
   * information and product images from the images CSV.  If any
   * required data is missing the component will still attempt to
   * display what it can.
   */
  const processFiles = () => {
    if (!ordersFile || !imagesFile) {
      setError('Please select both an orders CSV and an images CSV.');
      return;
    }
    setLoading(true);
    setError('');
    // First parse the images CSV to build a map from SKU/product code to image URL.
    Papa.parse(imagesFile, {
      header: true,
      skipEmptyLines: true,
      complete: (imgResult) => {
        const imageData = imgResult.data;
        const imageMap = {};
        imageData.forEach((row) => {
          const keys = Object.keys(row);
          if (keys.length >= 2) {
            const key = String(row[keys[0]] || '').trim();
            const url = String(row[keys[1]] || '').trim();
            if (key) {
              imageMap[key] = url;
            }
          }
        });
        // Now parse the orders CSV and build order groups.
        Papa.parse(ordersFile, {
          header: true,
          skipEmptyLines: true,
          complete: (ordResult) => {
            try {
              const rows = ordResult.data;
              const headers = ordResult.meta.fields || Object.keys(rows[0] || {});
              // Helper to find the first header containing any of the provided keywords.
              const findField = (keywords) => {
                return (
                  headers.find((h) => {
                    const lower = h.toLowerCase();
                    return keywords.some((k) => lower.includes(k));
                  }) || ''
                );
              };
              const orderIdField = findField(['order id', 'order number', 'orderid']);
              const orderDateField = findField(['order date', 'date', 'created at', 'created']);
              const productNameField = findField(['product name', 'sku name', 'item name']);
              const skuField = findField(['sku id', 'sku', 'product id']);
              const sellerSkuField = findField(['seller sku', 'seller id', 'seller_sku']);
              const quantityField = findField(['quantity', 'qty', 'item quantity']);
              const nameField = findField([
                'recipient name',
                'buyer name',
                'customer name',
                'receiver name',
              ]);
              const phoneField = findField(['phone', 'mobile']);
              const addressFields = headers.filter((h) => {
                const lower = h.toLowerCase();
                return (
                  lower.includes('address') ||
                  lower.includes('street') ||
                  lower.includes('province') ||
                  lower.includes('city') ||
                  lower.includes('state') ||
                  lower.includes('district') ||
                  lower.includes('country') ||
                  lower.includes('zip') ||
                  lower.includes('postal')
                );
              });
              const ordersMap = {};
              rows.forEach((row) => {
                const orderId = row[orderIdField] || 'Unknown';
                if (!ordersMap[orderId]) {
                  const addressParts = addressFields
                    .map((f) => row[f])
                    .filter((v) => v && String(v).trim() !== '');
                  const address = addressParts.join(', ');
                  ordersMap[orderId] = {
                    orderId: orderId,
                    orderDate: row[orderDateField] || '',
                    customerName: row[nameField] || '',
                    customerPhone: row[phoneField] || '',
                    customerAddress: address,
                    items: [],
                  };
                }
                const sellerSku = row[sellerSkuField] || row[skuField] || '';
                const sku = row[skuField] || '';
                const productKey = sellerSku || sku || row[productNameField] || '';
                ordersMap[orderId].items.push({
                  name: row[productNameField] || '',
                  sku: sku,
                  sellerSku: sellerSku,
                  quantity: parseInt(row[quantityField]) || 1,
                  orderId: orderId,
                  imageUrl: imageMap[productKey] || imageMap[sku] || imageMap[sellerSku] || '',
                });
              });
              const list = Object.values(ordersMap).map((order) => {
                const productQuantity = order.items.length;
                const itemQuantity = order.items.reduce(
                  (sum, it) => sum + (it.quantity || 0),
                  0,
                );
                return {
                  ...order,
                  productQuantity,
                  itemQuantity,
                };
              });
              setOrders(list);
              setLoading(false);
            } catch (err) {
              setError('Failed to process orders CSV: ' + err.message);
              setLoading(false);
            }
          },
          error: (err) => {
            setError('Failed to parse orders CSV: ' + err.message);
            setLoading(false);
          },
        });
      },
      error: (err) => {
        setError('Failed to parse images CSV: ' + err.message);
        setLoading(false);
      },
    });
  };

  /**
   * Generate a PDF file from the rendered packing slips.  This
   * function uses dynamic imports to load jsPDF and html2canvas on
   * demand, which keeps the initial bundle size small.  Each packing
   * slip is rasterised into a canvas and inserted as a separate page
   * in the resulting document.  Once complete the PDF is downloaded
   * automatically.
   */
  const downloadPDF = async () => {
    if (orders.length === 0) return;
    setLoading(true);
    try {
      const { jsPDF } = await import('jspdf');
      const html2canvas = (await import('html2canvas')).default;
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const slipElements = document.querySelectorAll('.packing-slip');
      for (let i = 0; i < slipElements.length; i++) {
        const el = slipElements[i];
        // Ensure any asynchronous resources such as images have time to load.
        await new Promise((resolve) => setTimeout(resolve, 300));
        const canvas = await html2canvas(el, { scale: 2, useCORS: true });
        const imgData = canvas.toDataURL('image/png');
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        const pageHeight = pdf.internal.pageSize.getHeight();
        let drawWidth = pdfWidth;
        let drawHeight = pdfHeight;
        if (pdfHeight > pageHeight) {
          drawHeight = pageHeight;
          drawWidth = (imgProps.width * drawHeight) / imgProps.height;
        }
        pdf.addImage(imgData, 'PNG', 0, 0, drawWidth, drawHeight);
        if (i < slipElements.length - 1) {
          pdf.addPage();
        }
      }
      pdf.save('packing_slips.pdf');
    } catch (err) {
      setError('Failed to generate PDF: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h1>TikTok Shop Packing Slip Generator</h1>
      <p>
        Upload the TikTok orders CSV and the product images CSV below. The
        application will parse the data, match each product to its image and
        render printable packing slips for each order. You can preview them in
        the browser and download a combined PDF when ready.
      </p>
      <div style={{ marginTop: '1rem', marginBottom: '1rem' }}>
        <div style={{ marginBottom: '0.5rem' }}>
          <label>
            Orders CSV:&nbsp;
            <input type="file" accept=".csv,text/csv" onChange={handleOrdersFileChange} />
          </label>
        </div>
        <div style={{ marginBottom: '0.5rem' }}>
          <label>
            Images CSV:&nbsp;
            <input type="file" accept=".csv,text/csv" onChange={handleImagesFileChange} />
          </label>
        </div>
        <button onClick={processFiles} disabled={loading || !ordersFile || !imagesFile}>
          {loading ? 'Processing...' : 'Generate Packing Slips'}
        </button>
        {orders.length > 0 && (
          <button
            onClick={downloadPDF}
            style={{ marginLeft: '1rem' }}
            disabled={loading}
          >
            {loading ? 'Generating PDF...' : 'Download PDF'}
          </button>
        )}
      </div>
      {error && (
        <div style={{ color: 'red', marginTop: '1rem' }}>{error}</div>
      )}
      {/* Render each order's packing slip */}
      {orders.map((order, index) => (
        <div key={order.orderId || index} className={index < orders.length - 1 ? 'page-break' : ''}>
          <PackingSlip order={order} />
        </div>
      ))}
    </div>
  );
}
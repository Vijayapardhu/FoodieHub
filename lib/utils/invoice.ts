import { Database } from "@/types/database.types"
import { format } from "date-fns"

type Order = Database["public"]["Tables"]["orders"]["Row"] & {
  canteens: Database["public"]["Tables"]["canteens"]["Row"]
  order_items: Array<
    Database["public"]["Tables"]["order_items"]["Row"] & {
      items: Database["public"]["Tables"]["items"]["Row"]
    }
  >
  users?: {
    full_name: string | null
    email: string | null
  } | null
}

export function generateInvoiceHTML(order: Order): string {
  const orderDate = format(new Date(order.created_at), "dd MMM yyyy, hh:mm a")
  const invoiceNumber = `INV-${order.id.substring(0, 8).toUpperCase()}`
  const subtotal = order.order_items?.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,
    0
  ) || 0
  const tax = 0 // Can be added if tax is calculated
  const total = Number(order.total_amount)

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice - ${order.token}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background: #fff;
      padding: 20px;
    }
    .invoice-container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      padding: 40px;
      box-shadow: 0 0 10px rgba(0,0,0,0.1);
    }
    .header {
      border-bottom: 3px solid #f97316;
      padding-bottom: 20px;
      margin-bottom: 30px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .logo-section h1 {
      color: #f97316;
      font-size: 28px;
      margin-bottom: 5px;
    }
    .logo-section p {
      color: #666;
      font-size: 14px;
    }
    .invoice-info {
      text-align: right;
    }
    .invoice-info h2 {
      font-size: 24px;
      color: #333;
      margin-bottom: 10px;
    }
    .invoice-info p {
      color: #666;
      font-size: 14px;
      margin: 3px 0;
    }
    .details-section {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
      margin-bottom: 30px;
    }
    .detail-box h3 {
      color: #f97316;
      font-size: 14px;
      text-transform: uppercase;
      margin-bottom: 10px;
      letter-spacing: 1px;
    }
    .detail-box p {
      color: #333;
      margin: 5px 0;
      font-size: 14px;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    .items-table thead {
      background: #f97316;
      color: white;
    }
    .items-table th {
      padding: 12px;
      text-align: left;
      font-weight: 600;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .items-table td {
      padding: 12px;
      border-bottom: 1px solid #eee;
      font-size: 14px;
    }
    .items-table tbody tr:hover {
      background: #fafafa;
    }
    .text-right {
      text-align: right;
    }
    .text-center {
      text-align: center;
    }
    .totals-section {
      margin-top: 20px;
      display: flex;
      justify-content: flex-end;
    }
    .totals-box {
      width: 300px;
      border: 2px solid #f97316;
      padding: 20px;
      border-radius: 8px;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 10px;
      font-size: 14px;
    }
    .total-row.grand-total {
      font-size: 20px;
      font-weight: bold;
      color: #f97316;
      border-top: 2px solid #f97316;
      padding-top: 10px;
      margin-top: 10px;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #eee;
      text-align: center;
      color: #666;
      font-size: 12px;
    }
    .status-badge {
      display: inline-block;
      padding: 5px 15px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      margin-top: 5px;
    }
    .status-pending { background: #fef3c7; color: #92400e; }
    .status-confirmed { background: #dbeafe; color: #1e40af; }
    .status-preparing { background: #fed7aa; color: #9a3412; }
    .status-ready { background: #d1fae5; color: #065f46; }
    .status-completed { background: #d1fae5; color: #065f46; }
    .status-cancelled { background: #fee2e2; color: #991b1b; }
    @media print {
      body {
        padding: 0;
      }
      .invoice-container {
        box-shadow: none;
      }
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <div class="header">
      <div class="logo-section">
        <h1>FoodieHub</h1>
        <p>College Canteen Management System</p>
      </div>
      <div class="invoice-info">
        <h2>INVOICE</h2>
        <p><strong>Invoice #:</strong> ${invoiceNumber}</p>
        <p><strong>Token:</strong> ${order.token}</p>
        <p><strong>Date:</strong> ${orderDate}</p>
        <span class="status-badge status-${order.status}">${order.status}</span>
      </div>
    </div>

    <div class="details-section">
      <div class="detail-box">
        <h3>Bill From</h3>
        <p><strong>${order.canteens?.name || "Canteen"}</strong></p>
        ${order.canteens?.address ? `<p>${order.canteens.address}</p>` : ""}
        ${order.canteens?.contact_phone ? `<p>Phone: ${order.canteens.contact_phone}</p>` : ""}
      </div>
      <div class="detail-box">
        <h3>Bill To</h3>
        <p><strong>${order.customer_name || order.users?.full_name || "Customer"}</strong></p>
        ${order.customer_phone ? `<p>Phone: ${order.customer_phone}</p>` : ""}
        ${order.users?.email ? `<p>Email: ${order.users.email}</p>` : ""}
        ${order.user_id ? `<p style="color: #999; font-size: 12px;">Customer ID: ${order.user_id.substring(0, 8)}</p>` : ""}
      </div>
    </div>

    <table class="items-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Item Description</th>
          <th class="text-center">Qty</th>
          <th class="text-right">Unit Price</th>
          <th class="text-right">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${order.order_items?.map((item, index) => `
          <tr>
            <td>${index + 1}</td>
            <td><strong>${item.items.name}</strong></td>
            <td class="text-center">${item.quantity}</td>
            <td class="text-right">₹${Number(item.price).toFixed(2)}</td>
            <td class="text-right"><strong>₹${(Number(item.price) * item.quantity).toFixed(2)}</strong></td>
          </tr>
        `).join("") || "<tr><td colspan='5' class='text-center'>No items</td></tr>"}
      </tbody>
    </table>

    <div class="totals-section">
      <div class="totals-box">
        <div class="total-row">
          <span>Subtotal:</span>
          <span>₹${subtotal.toFixed(2)}</span>
        </div>
        ${tax > 0 ? `
        <div class="total-row">
          <span>Tax:</span>
          <span>₹${tax.toFixed(2)}</span>
        </div>
        ` : ""}
        <div class="total-row grand-total">
          <span>Total Amount:</span>
          <span>₹${total.toFixed(2)}</span>
        </div>
      </div>
    </div>

    <div class="footer">
      <p><strong>Payment Method:</strong> ${order.payment_method === "on_shop" ? "On Shop Payment" : order.payment_method}</p>
      <p><strong>Payment Status:</strong> <span class="status-badge status-${order.payment_status}">${order.payment_status}</span></p>
      <p style="margin-top: 15px;">Thank you for your order! Please show your token at the canteen to collect your order.</p>
      <p style="margin-top: 10px; font-size: 11px;">This is a computer-generated invoice and does not require a signature.</p>
    </div>
  </div>
</body>
</html>
  `.trim()
}

export function downloadInvoice(order: Order) {
  const htmlContent = generateInvoiceHTML(order)
  const blob = new Blob([htmlContent], { type: "text/html" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `invoice-${order.token}-${format(new Date(order.created_at), "yyyyMMdd")}.html`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function printInvoice(order: Order) {
  const htmlContent = generateInvoiceHTML(order)
  const printWindow = window.open("", "_blank")
  if (printWindow) {
    printWindow.document.write(htmlContent)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 250)
  }
}


import { Database } from "@/types/database.types"
import { format } from "date-fns"

type Order = Database["public"]["Tables"]["orders"]["Row"] & {
  canteens: Database["public"]["Tables"]["canteens"]["Row"]
  delivery_blocks?: { name: string } | null
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

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}

/** The bowl mark from components/brand/logo.tsx, redrawn as a static string — this
 *  document is a standalone HTML file with no React tree to render the component into. */
const LOGO_MARK_SVG = `
  <svg viewBox="70 172 372 174" xmlns="http://www.w3.org/2000/svg" width="30" height="14" fill="#f6f2e4">
    <rect x="76" y="178" width="360" height="42" rx="21" />
    <path d="M108 220a148 118 0 0 0 296 0z" />
  </svg>
`

/**
 * A classic ruled bill, not a corporate PDF — dashed rules, a monospace
 * table with dotted leaders, one ink colour. This is what a canteen counter
 * actually hands over, so the printed and downloaded copy should read like
 * one rather than like an enterprise SaaS receipt.
 */
export function generateInvoiceHTML(order: Order): string {
  const orderDate = format(new Date(order.created_at), "dd MMM yyyy, hh:mm a")
  const invoiceNumber = `FH-${order.id.substring(0, 8).toUpperCase()}`
  const subtotal = Number(order.subtotal) || 0
  const discount = Number(order.discount_amount) || 0
  const total = Number(order.total_amount)
  const customerName = order.customer_name || order.users?.full_name || "Customer"
  const isOnline = order.payment_method === "online"
  const isPaid = order.payment_status === "completed"
  const delivering = order.fulfillment_type === "delivery"
  const deliveryFee = Number(order.delivery_fee) || 0

  const rows = (order.order_items ?? [])
    .map((item, index) => {
      const name = escapeHtml(item.items?.name ?? "Item")
      const lineTotal = Number(item.price) * item.quantity
      return `
        <tr>
          <td class="num">${index + 1}</td>
          <td class="item">${name}</td>
          <td class="num">${item.quantity}</td>
          <td class="rate">₹${Number(item.price).toFixed(2)}</td>
          <td class="amount">₹${lineTotal.toFixed(2)}</td>
        </tr>`
    })
    .join("")

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bill ${order.token}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Courier New', ui-monospace, Consolas, monospace;
      color: #1a1a1a;
      background: #e9e9e4;
      padding: 32px 16px;
    }
    .bill {
      max-width: 420px;
      margin: 0 auto;
      background: #fffdf7;
      padding: 28px 26px 24px;
      border: 1px solid #1a1a1a;
      box-shadow: 0 2px 0 #1a1a1a;
    }
    .rule { border: none; border-top: 1px dashed #1a1a1a; margin: 16px 0; }
    .rule.solid { border-top: 2px solid #1a1a1a; }
    .center { text-align: center; }
    .brand {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }
    .brand .mark {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 30px;
      height: 30px;
      border-radius: 8px;
      background: linear-gradient(135deg, #2f7f5c, #1f5c40);
    }
    .brand .word {
      font-size: 19px;
      font-weight: 700;
      letter-spacing: 0.02em;
    }
    .brand .word .hub { color: #2f7f5c; }
    .tagline {
      margin-top: 3px;
      font-size: 10.5px;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: #555;
    }
    .doc-title {
      margin-top: 14px;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.18em;
      text-transform: uppercase;
    }
    .meta {
      margin-top: 10px;
      font-size: 12px;
      line-height: 1.65;
    }
    .meta .row { display: flex; justify-content: space-between; gap: 12px; }
    .meta .row span:first-child { color: #555; }
    .party { font-size: 12px; line-height: 1.6; }
    .party .label {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: #555;
      margin-bottom: 3px;
    }
    .party + .party { margin-top: 12px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th {
      text-align: left;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #555;
      padding-bottom: 6px;
      border-bottom: 1px dashed #1a1a1a;
    }
    td { padding: 5px 0; vertical-align: top; }
    .num { width: 24px; }
    th.num, td.num { text-align: center; }
    th.rate, td.rate, th.amount, td.amount { text-align: right; }
    td.rate, td.amount { white-space: nowrap; font-variant-numeric: tabular-nums; }
    .totals { font-size: 12px; margin-top: 4px; }
    .totals .row {
      display: flex;
      justify-content: space-between;
      padding: 3px 0;
      font-variant-numeric: tabular-nums;
    }
    .totals .row.discount { color: #1f6b3a; }
    .totals .row.grand {
      margin-top: 6px;
      padding-top: 10px;
      border-top: 2px solid #1a1a1a;
      font-size: 16px;
      font-weight: 700;
    }
    .badge {
      display: inline-block;
      margin-top: 6px;
      padding: 2px 9px;
      border: 1px solid #1a1a1a;
      border-radius: 999px;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }
    .badge.paid { background: #e3f3e9; }
    .badge.due { background: #fdf0d5; }
    .footer {
      margin-top: 4px;
      text-align: center;
      font-size: 12px;
    }
    .footer .thanks { font-weight: 700; letter-spacing: 0.04em; }
    .fine-print {
      margin-top: 14px;
      text-align: center;
      font-size: 10px;
      color: #777;
      line-height: 1.6;
    }
    @media print {
      body { background: #fff; padding: 0; }
      .bill { box-shadow: none; border: none; max-width: 100%; padding: 0; }
    }
  </style>
</head>
<body>
  <div class="bill">
    <div class="center">
      <span class="brand">
        <span class="mark">${LOGO_MARK_SVG}</span>
        <span class="word">Foodie<span class="hub">Hub</span></span>
      </span>
      <div class="tagline">Campus canteen ordering</div>
      <div class="doc-title">Bill of sale</div>
    </div>

    <hr class="rule">

    <div class="meta">
      <div class="row"><span>Bill no.</span><span>${invoiceNumber}</span></div>
      <div class="row"><span>Token</span><span>${escapeHtml(order.token)}</span></div>
      <div class="row"><span>Date</span><span>${orderDate}</span></div>
    </div>

    <hr class="rule">

    <div class="party">
      <div class="label">Served by</div>
      <div>${escapeHtml(order.canteens?.name || "Canteen")}</div>
      ${order.canteens?.address ? `<div>${escapeHtml(order.canteens.address)}</div>` : ""}
      ${order.canteens?.contact_phone ? `<div>${escapeHtml(order.canteens.contact_phone)}</div>` : ""}
    </div>
    <div class="party">
      <div class="label">Billed to</div>
      <div>${escapeHtml(customerName)}</div>
      ${order.customer_phone ? `<div>${escapeHtml(order.customer_phone)}</div>` : ""}
    </div>

    <hr class="rule">

    <table>
      <thead>
        <tr>
          <th class="num">#</th>
          <th>Item</th>
          <th class="num">Qty</th>
          <th class="rate">Rate</th>
          <th class="amount">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${rows || `<tr><td colspan="5" class="center">No items</td></tr>`}
      </tbody>
    </table>

    <hr class="rule">

    <div class="totals">
      <div class="row"><span>Subtotal</span><span>₹${subtotal.toFixed(2)}</span></div>
      ${discount > 0 ? `<div class="row discount"><span>Discount</span><span>−₹${discount.toFixed(2)}</span></div>` : ""}
      ${delivering && deliveryFee > 0 ? `<div class="row"><span>Delivery fee</span><span>₹${deliveryFee.toFixed(2)}</span></div>` : ""}
      <div class="row grand"><span>Total</span><span>₹${total.toFixed(2)}</span></div>
    </div>

    <hr class="rule">

    ${delivering ? `<div class="footer" style="margin-bottom: 4px;">Deliver to ${escapeHtml(order.delivery_blocks?.name ?? "—")}</div>` : ""}

    <div class="footer">
      <div>${
        isOnline
          ? "Paid online · Razorpay"
          : delivering
            ? "Payable on delivery"
            : "Payable at the counter"
      }</div>
      <span class="badge ${isPaid ? "paid" : "due"}">${isPaid ? "Paid" : "Payment due"}</span>
      <div class="thanks" style="margin-top: 12px;">Thank you — see you again!</div>
    </div>

    <div class="fine-print">
      Computer-generated bill, no signature required.<br>
      FoodieHub takes no commission — this is what the canteen actually charged.
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
  a.download = `foodiehub-bill-${order.token}-${format(new Date(order.created_at), "yyyyMMdd")}.html`
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

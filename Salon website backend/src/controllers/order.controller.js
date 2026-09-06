import { z } from "zod";
import {
  createOrder,
  listOrders,
  listOrdersForUser,
  updateOrderStatus
} from "../models/order.model.js";
import { getOrderDetailsForEmail } from "../models/payment.model.js";
import { getSettings } from "../models/admin.model.js";
import { query } from "../config/db.js";
import { sendLowStockAlert, sendOrderStatusUpdate } from "../utils/email.js";
import { notFound } from "../utils/httpError.js";

const orderSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().positive(),
        variantId: z.string().uuid().optional()
      })
    )
    .min(1),
  delivery: z.object({
    name: z.string().min(2),
    phone: z.string().min(7).max(20),
    address: z.string().min(5, "Please provide a more complete address or location so we can find you"),
    notes: z.string().optional(),
    email: z.string().email("Please provide a real email so we can send you updates about your order")
  }),
  giftCardCode: z.string().optional()
});

export async function create(req, res) {
  const body = orderSchema.parse(req.body);
  const userId = req.user ? req.user.id : null;
  const result = await createOrder(userId, body.items, body.delivery, body.giftCardCode);

  checkLowStock(result.items).catch(() => {});

  res.status(201).json(result);
}

async function checkLowStock(items) {
  const settings = await getSettings();
  if (!settings?.notifications?.lowStock) return;

  for (const item of items) {
    if (item.variantId) {
      const result = await query(
        "select label, stock_qty from product_variants where id = $1",
        [item.variantId]
      );
      const variant = result.rows[0];
      if (variant && variant.stock_qty <= 5) {
        sendLowStockAlert(variant.label, variant.stock_qty);
      }
    } else {
      const result = await query(
        "select name, stock_qty from products where id = $1",
        [item.productId]
      );
      const product = result.rows[0];
      if (product && product.stock_qty <= 5) {
        sendLowStockAlert(product.name, product.stock_qty);
      }
    }
  }
}

export async function mine(req, res) {
  res.json(await listOrdersForUser(req.user.id));
}

export async function index(req, res) {
  const { status } = z.object({ status: z.string().optional() }).parse(req.query);
  res.json(await listOrders(status));
}

export async function updateStatus(req, res) {
  const body = z.object({
    status: z.enum(["pending_payment", "paid", "preparing", "out_for_delivery", "fulfilled", "cancelled"])
  }).parse(req.body);
  const order = await updateOrderStatus(req.params.id, body.status);
  if (!order) throw notFound("Order not found");

  const details = await getOrderDetailsForEmail(order.id);
  if (details) sendOrderStatusUpdate(details.customerEmail, order, body.status);

  res.json({ order });
}
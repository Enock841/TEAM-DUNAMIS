import { Router } from "express";
import { z } from "zod";
import { pool, query } from "../db/pool.js";
import { requireAdmin, requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { HttpError } from "../utils/httpError.js";

const router = Router();

const orderSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string().uuid(),
      quantity: z.number().int().positive()
    })
  ).min(1)
});

router.post(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const body = orderSchema.parse(req.body);
    const client = await pool.connect();

    try {
      await client.query("begin");

      const orderResult = await client.query(
        `insert into orders (user_id, status, total_amount)
         values ($1, 'pending_payment', 0)
         returning id, user_id as "userId", status, total_amount as "totalAmount"`,
        [req.user.id]
      );
      const order = orderResult.rows[0];
      let total = 0;
      const items = [];

      for (const item of body.items) {
        const productResult = await client.query(
          "select id, name, price, stock_qty from products where id = $1 and is_active = true for update",
          [item.productId]
        );
        const product = productResult.rows[0];

        if (!product) throw new HttpError(404, `Product ${item.productId} not found`);
        if (product.stock_qty < item.quantity) {
          throw new HttpError(409, `${product.name} does not have enough stock`);
        }

        await client.query("update products set stock_qty = stock_qty - $1 where id = $2", [
          item.quantity,
          product.id
        ]);

        const lineTotal = Number(product.price) * item.quantity;
        total += lineTotal;

        const itemResult = await client.query(
          `insert into order_items (order_id, product_id, quantity, unit_price)
           values ($1, $2, $3, $4)
           returning id, product_id as "productId", quantity, unit_price as "unitPrice"`,
          [order.id, product.id, item.quantity, product.price]
        );
        items.push(itemResult.rows[0]);
      }

      const updatedOrder = await client.query(
        `update orders
         set total_amount = $1, updated_at = now()
         where id = $2
         returning id, user_id as "userId", status, total_amount as "totalAmount"`,
        [total, order.id]
      );

      await client.query("commit");
      res.status(201).json({ order: updatedOrder.rows[0], items });
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  })
);

router.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const result = await query(
      `select o.id, o.status, o.total_amount as "totalAmount", o.created_at as "createdAt",
              coalesce(json_agg(json_build_object(
                'productId', p.id,
                'name', p.name,
                'quantity', oi.quantity,
                'unitPrice', oi.unit_price
              )) filter (where oi.id is not null), '[]') as items
       from orders o
       left join order_items oi on oi.order_id = o.id
       left join products p on p.id = oi.product_id
       where o.user_id = $1
       group by o.id
       order by o.created_at desc`,
      [req.user.id]
    );
    res.json(result.rows);
  })
);

router.get(
  "/",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const params = z.object({ status: z.string().optional() }).parse(req.query);
    const result = await query(
      `select o.id, o.status, o.total_amount as "totalAmount", o.created_at as "createdAt",
              json_build_object('id', u.id, 'name', u.name, 'phone', u.phone) as "user",
              coalesce(json_agg(json_build_object(
                'productId', p.id,
                'name', p.name,
                'quantity', oi.quantity,
                'unitPrice', oi.unit_price
              )) filter (where oi.id is not null), '[]') as items
       from orders o
       join users u on u.id = o.user_id
       left join order_items oi on oi.order_id = o.id
       left join products p on p.id = oi.product_id
       where ($1::text is null or o.status = $1)
       group by o.id, u.id
       order by o.created_at desc`,
      [params.status || null]
    );
    res.json(result.rows);
  })
);

export default router;


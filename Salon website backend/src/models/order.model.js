import { pool, query } from "../config/db.js";
import { HttpError } from "../utils/httpError.js";

export async function createOrder(userId, requestedItems, delivery, giftCardCode) {
  const client = await pool.connect();
  try {
    await client.query("begin");
    const orderResult = await client.query(
      `insert into orders (user_id, status, total_amount, delivery_name, delivery_phone, delivery_address, delivery_notes, delivery_email)
       values ($1, 'pending_payment', 0, $2, $3, $4, $5, $6)
       returning id, user_id as "userId", status, total_amount as "totalAmount",
                 delivery_name as "deliveryName", delivery_phone as "deliveryPhone",
                 delivery_address as "deliveryAddress", delivery_notes as "deliveryNotes",
                 delivery_email as "deliveryEmail"`,
      [userId, delivery.name, delivery.phone, delivery.address, delivery.notes || null, delivery.email || null]
    );
    const order = orderResult.rows[0];
    let total = 0;
    const items = [];

    for (const item of requestedItems) {
      const productResult = await client.query(
        `select id, name, price, stock_qty
         from products
         where id = $1 and is_active = true
         for update`,
        [item.productId]
      );
      const product = productResult.rows[0];
      if (!product) throw new HttpError(404, `Product ${item.productId} not found`);
      if (product.stock_qty < item.quantity) {
        throw new HttpError(409, `${product.name} does not have enough stock`);
      }

      await client.query(
        "update products set stock_qty = stock_qty - $1 where id = $2",
        [item.quantity, product.id]
      );

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

    let discount = 0;
    let appliedCode = null;
    let finalStatus = "pending_payment";

    if (giftCardCode) {
      const cardResult = await client.query(
        `select id, code, balance, status from gift_cards
         where upper(code) = upper($1)
         for update`,
        [giftCardCode]
      );
      const card = cardResult.rows[0];
      if (!card || card.status !== "active" || Number(card.balance) <= 0) {
        throw new HttpError(404, "That gift card code is not valid or has no balance remaining");
      }

      discount = Math.min(Number(card.balance), total);
      appliedCode = card.code;

      const newBalance = Number(card.balance) - discount;
      await client.query(
        `update gift_cards
         set balance = $1, status = case when $1 <= 0 then 'used' else status end, updated_at = now()
         where id = $2`,
        [newBalance, card.id]
      );

      if (discount >= total) {
        finalStatus = "paid";
      }
    }

    const finalTotal = total - discount;

    const updatedOrder = await client.query(
      `update orders
       set total_amount = $1, gift_card_code = $2, gift_card_discount = $3, status = $4, updated_at = now()
       where id = $5
       returning id, user_id as "userId", status, total_amount as "totalAmount",
                 delivery_name as "deliveryName", delivery_phone as "deliveryPhone",
                 delivery_address as "deliveryAddress", delivery_notes as "deliveryNotes",
                 gift_card_code as "giftCardCode", gift_card_discount as "giftCardDiscount"`,
      [finalTotal, appliedCode, discount, finalStatus, order.id]
    );
    await client.query("commit");
    return { order: updatedOrder.rows[0], items };
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

export async function listOrdersForUser(userId) {
  const result = await query(
    `select o.id, o.status, o.total_amount as "totalAmount", o.created_at as "createdAt",
            o.delivery_name as "deliveryName", o.delivery_phone as "deliveryPhone",
            o.delivery_address as "deliveryAddress", o.delivery_notes as "deliveryNotes",
            o.gift_card_code as "giftCardCode", o.gift_card_discount as "giftCardDiscount",
            coalesce(json_agg(json_build_object(
              'productId', p.id, 'name', p.name, 'quantity', oi.quantity,
              'unitPrice', oi.unit_price
            )) filter (where oi.id is not null), '[]') as items
     from orders o
     left join order_items oi on oi.order_id = o.id
     left join products p on p.id = oi.product_id
     where o.user_id = $1
     group by o.id
     order by o.created_at desc`,
    [userId]
  );
  return result.rows;
}

export async function listOrders(status) {
  const result = await query(
    `select o.id, o.status, o.total_amount as "totalAmount", o.created_at as "createdAt",
            o.delivery_name as "deliveryName", o.delivery_phone as "deliveryPhone",
            o.delivery_address as "deliveryAddress", o.delivery_notes as "deliveryNotes",
            o.gift_card_code as "giftCardCode", o.gift_card_discount as "giftCardDiscount",
            json_build_object(
              'id', u.id,
              'name', coalesce(u.name, o.delivery_name || ' (guest)'),
              'phone', coalesce(u.phone, o.delivery_phone)
            ) as "user",
            coalesce(json_agg(json_build_object(
              'productId', p.id, 'name', p.name, 'quantity', oi.quantity,
              'unitPrice', oi.unit_price
            )) filter (where oi.id is not null), '[]') as items
     from orders o
     left join users u on u.id = o.user_id
     left join order_items oi on oi.order_id = o.id
     left join products p on p.id = oi.product_id
     where ($1::text is null or o.status = $1)
     group by o.id, u.id
     order by o.created_at desc`,
    [status || null]
  );
  return result.rows;
}

export async function updateOrderStatus(id, status) {
  const result = await query(
    `update orders set status = $1, updated_at = now()
     where id = $2
     returning id, status, total_amount as "totalAmount", updated_at as "updatedAt"`,
    [status, id]
  );
  return result.rows[0] || null;
}
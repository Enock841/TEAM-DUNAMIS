import { query } from "../config/db.js";

export async function listCustomers() {
  const result = await query(
    `select u.id, u.name, u.phone, u.created_at as "createdAt",
            count(distinct b.id)::int as "bookingCount",
            count(distinct o.id)::int as "orderCount",
            coalesce(sum(distinct case when o.status in ('paid', 'fulfilled')
              then o.total_amount else 0 end), 0) as "totalSpent"
     from users u
     left join bookings b on b.user_id = u.id
     left join orders o on o.user_id = u.id
     where u.role = 'customer' and u.is_active = true
     group by u.id
     order by u.created_at desc`
  );
  return result.rows;
}

export async function findCustomerDetails(id) {
  const customerResult = await query(
    `select id, name, phone, created_at as "createdAt"
     from users where id = $1 and role = 'customer'`,
    [id]
  );
  if (!customerResult.rowCount) return null;
  const [bookings, orders] = await Promise.all([
    query(
      `select b.id, b.booking_date as date, b.time_slot as "timeSlot", b.status,
              s.name as "serviceName"
       from bookings b join services s on s.id = b.service_id
       where b.user_id = $1 order by b.booking_date desc`,
      [id]
    ),
    query(
      `select id, status, total_amount as "totalAmount", created_at as "createdAt"
       from orders where user_id = $1 order by created_at desc`,
      [id]
    )
  ]);
  return { ...customerResult.rows[0], bookings: bookings.rows, orders: orders.rows };
}

export async function listPayments() {
  const result = await query(
    `select p.id, p.reference, p.payment_type as "paymentType",
            p.amount, p.status, p.momo_number as "momoNumber",
            p.created_at as "createdAt",
            case when u.id is not null
              then json_build_object('id', u.id, 'name', u.name, 'phone', u.phone)
              else null
            end as customer
     from payments p
     left join users u on u.id = p.user_id
     order by p.created_at desc`
  );
  return result.rows;
}

export async function getAnalytics() {
  const [metrics, services, products, revenue] = await Promise.all([
    query(
      `select
        (select count(*)::int from users where role = 'customer' and is_active = true) as customers,
        (select count(*)::int from bookings) as appointments,
        (select count(*)::int from orders) as orders,
        (select coalesce(sum(amount), 0) from payments where status = 'success') as revenue`
    ),
    query(
      `select s.name, count(b.id)::int as bookings
       from services s left join bookings b on b.service_id = s.id
       group by s.id order by bookings desc, s.name limit 5`
    ),
    query(
      `select p.name, coalesce(sum(oi.quantity), 0)::int as units
       from products p left join order_items oi on oi.product_id = p.id
       group by p.id order by units desc, p.name limit 5`
    ),
    query(
      `select to_char(date_trunc('month', created_at), 'Mon YYYY') as month,
              sum(amount) as amount
       from payments
       where status = 'success' and created_at >= now() - interval '6 months'
       group by date_trunc('month', created_at)
       order by date_trunc('month', created_at)`
    )
  ]);
  return {
    metrics: metrics.rows[0],
    popularServices: services.rows,
    bestSellingProducts: products.rows,
    revenueTrend: revenue.rows
  };
}

export async function getSettings() {
  const result = await query(
    `select business_name as "businessName", phone, address,
            opening_hours as "openingHours", notifications, payment_methods as "paymentMethods",
            about_image_url as "aboutImageUrl",
            updated_at as "updatedAt"
     from business_settings where id = 1`
  );
  return result.rows[0];
}

export async function updateSettings(input) {
  const current = await getSettings();
  const merged = { ...current, ...input };
  const result = await query(
    `update business_settings
     set business_name = $1, phone = $2, address = $3, opening_hours = $4,
         notifications = $5, payment_methods = $6, about_image_url = $7, updated_at = now()
     where id = 1
     returning business_name as "businessName", phone, address,
               opening_hours as "openingHours", notifications,
               payment_methods as "paymentMethods", about_image_url as "aboutImageUrl",
               updated_at as "updatedAt"`,
    [
      merged.businessName,
      merged.phone,
      merged.address,
      merged.openingHours,
      merged.notifications,
      merged.paymentMethods,
      merged.aboutImageUrl || ''
    ]
  );
  return result.rows[0];
}

export async function listStaff() {
  const result = await query(
    `select id, name, phone, is_active as "isActive", created_at as "createdAt"
     from users where role = 'admin' order by created_at`
  );
  return result.rows;
}

export async function createStaff({ name, phone, email, passwordHash }) {
  const result = await query(
    `insert into users (name, phone, email, password_hash, role)
     values ($1, $2, $3, $4, 'admin')
     returning id, name, phone, email, is_active as "isActive", created_at as "createdAt"`,
    [name, phone, email, passwordHash]
  );
  return result.rows[0];
}

export async function updateStaffStatus(id, isActive) {
  const result = await query(
    `update users set is_active = $1, updated_at = now()
     where id = $2 and role = 'admin'
     returning id, name, phone, is_active as "isActive", created_at as "createdAt"`,
    [isActive, id]
  );
  return result.rows[0] || null;
}
update service_categories
set name = 'Lash & Brows',
    updated_at = now()
where name = 'Lashes'
  and not exists (
    select 1
    from service_categories
    where name = 'Lash & Brows'
  );

update service_categories
set is_active = false,
    updated_at = now();

insert into service_categories (name, daily_cap, image_url, is_active)
values
  ('Braiding', 3, '/images/services/braiding.jpg', true),
  ('Nails', 8, '/images/services/nails.jpg', true),
  ('Piercings', 8, '/images/services/piercings.png', true),
  ('Lash & Brows', 6, '/images/services/lashes.jpg', true),
  ('Wigs', 5, 'https://sampahallen.github.io/beryl-s-beauty-mark/images/product-hd-lace-wig.jpg', true),
  ('Others', 6, '/images/services/makeup.jpg', true)
on conflict (name) do update
set daily_cap = excluded.daily_cap,
    image_url = excluded.image_url,
    is_active = true,
    updated_at = now();

update services
set is_active = false,
    updated_at = now();

create temporary table desired_services (
  name text primary key,
  description text not null,
  category_name text not null,
  duration_minutes integer not null,
  price_min numeric(10, 2) not null,
  price_max numeric(10, 2) not null
) on commit drop;

insert into desired_services
  (name, description, category_name, duration_minutes, price_min, price_max)
values
  (
    'Knotless Box Braids',
    'Lightweight knotless braids with neat parting and a comfortable, natural finish.',
    'Braiding',
    270,
    350,
    500
  ),
  (
    'Stitch Cornrows',
    'Clean, defined cornrows shaped around your preferred pattern and finish.',
    'Braiding',
    150,
    220,
    320
  ),
  (
    'Goddess Braids',
    'Soft braids finished with flowing curls for an elegant, textured look.',
    'Braiding',
    240,
    420,
    580
  ),
  (
    'Classic Manicure',
    'Nail shaping, cuticle care and a clean polish finish.',
    'Nails',
    45,
    80,
    120
  ),
  (
    'Gel Manicure',
    'A tidy manicure finished with durable, high-shine gel colour.',
    'Nails',
    60,
    120,
    180
  ),
  (
    'Acrylic Full Set',
    'Sculpted acrylic extensions shaped and finished in your preferred length and colour.',
    'Nails',
    120,
    220,
    350
  ),
  (
    'Classic Lobe Piercing',
    'A careful single or paired lobe piercing with placement guidance and aftercare advice.',
    'Piercings',
    30,
    80,
    150
  ),
  (
    'Curated Ear Stack',
    'A personalised ear-styling consultation with coordinated lobe and cartilage placements.',
    'Piercings',
    45,
    180,
    350
  ),
  (
    'Nose Piercing',
    'Professional nostril piercing with placement guidance and complete aftercare advice.',
    'Piercings',
    30,
    120,
    220
  ),
  (
    'Classic Lash Set',
    'Natural-looking individual lash extensions for subtle length and definition.',
    'Lash & Brows',
    120,
    250,
    350
  ),
  (
    'Hybrid Lash Set',
    'A balanced blend of classic and volume lashes for soft fullness.',
    'Lash & Brows',
    150,
    320,
    450
  ),
  (
    'Lash Refill',
    'A careful refresh that replaces grown-out extensions and restores an even finish.',
    'Lash & Brows',
    75,
    150,
    250
  ),
  (
    'Brow Shaping & Tint',
    'Precision shaping and a custom tint for fuller, softly defined brows.',
    'Lash & Brows',
    45,
    120,
    180
  ),
  (
    'Signature Wig Install',
    'Lace preparation, secure placement and a natural-looking finish tailored to you.',
    'Wigs',
    150,
    300,
    500
  ),
  (
    'Wig Revamp',
    'Cleaning, conditioning, reshaping and restyling for an existing wig.',
    'Wigs',
    90,
    150,
    250
  ),
  (
    'Wig Customisation & Styling',
    'Hairline customisation, lace tinting and finished styling for a polished fit.',
    'Wigs',
    120,
    250,
    450
  ),
  (
    'Soft Glam Makeup',
    'A polished, radiant look with soft definition for everyday events and celebrations.',
    'Others',
    90,
    250,
    350
  ),
  (
    'Full Glam Makeup',
    'A camera-ready finish with fuller coverage, defined eyes and a tailored lip.',
    'Others',
    120,
    350,
    500
  ),
  (
    'Bridal Makeup',
    'Long-wear bridal makeup planned around your features, outfit and ceremony.',
    'Others',
    150,
    600,
    900
  );

do $$
declare
  desired record;
  existing_service_id uuid;
begin
  for desired in select * from desired_services loop
    select id
    into existing_service_id
    from services
    where lower(name) = lower(desired.name)
    order by is_active desc, created_at asc
    limit 1;

    if existing_service_id is null then
      insert into services (
        name,
        description,
        category_id,
        duration_minutes,
        price_min,
        price_max,
        images,
        is_active
      )
      select
        desired.name,
        desired.description,
        category.id,
        desired.duration_minutes,
        desired.price_min,
        desired.price_max,
        array[category.image_url],
        true
      from service_categories category
      where category.name = desired.category_name;
    else
      update services service
      set name = desired.name,
          description = desired.description,
          category_id = category.id,
          duration_minutes = desired.duration_minutes,
          price_min = desired.price_min,
          price_max = desired.price_max,
          images = array[category.image_url],
          is_active = true,
          updated_at = now()
      from service_categories category
      where service.id = existing_service_id
        and category.name = desired.category_name;
    end if;
  end loop;
end
$$;

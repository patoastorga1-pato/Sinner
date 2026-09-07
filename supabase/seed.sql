-- Development-only seed. Apply after all migrations; do not use these demo accounts in production.

insert into public.amenities (name, slug, category, icon_name) values
  ('Jacuzzi', 'jacuzzi', 'wellness', 'bath'),
  ('Pool', 'pool', 'wellness', 'waves'),
  ('Private entrance', 'private-entrance', 'privacy', 'door-open'),
  ('Private parking', 'private-parking', 'access', 'car'),
  ('Self check-in', 'self-check-in', 'privacy', 'key-round'),
  ('Soundproofing', 'soundproofing', 'privacy', 'volume-x'),
  ('Wi-Fi', 'wifi', 'comfort', 'wifi'),
  ('Air conditioning', 'air-conditioning', 'comfort', 'snowflake'),
  ('Shower', 'shower', 'wellness', 'shower-head'),
  ('Bathtub', 'bathtub', 'wellness', 'bath'),
  ('Mirrors', 'mirrors', 'studio', 'scan'),
  ('Lighting equipment', 'lighting-equipment', 'studio', 'lamp-desk'),
  ('Tripod', 'tripod', 'studio', 'camera'),
  ('Kitchen', 'kitchen', 'comfort', 'cooking-pot'),
  ('Terrace', 'terrace', 'outdoor', 'sunset'),
  ('Outdoor area', 'outdoor-area', 'outdoor', 'trees')
on conflict (slug) do update set name = excluded.name, category = excluded.category, icon_name = excluded.icon_name;

insert into public.allowed_uses (name, slug) values
  ('Intimate experiences', 'intimate_experiences'),
  ('Nudity', 'nudity'),
  ('Photography', 'photography'),
  ('Video recording', 'video_recording'),
  ('Commercial content', 'commercial_content'),
  ('Groups', 'groups'),
  ('Events', 'events'),
  ('Smoking', 'smoking'),
  ('Pets', 'pets')
on conflict (slug) do update set name = excluded.name;

-- A deterministic host and guests make review aggregation testable in local development.
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
) values
  ('00000000-0000-0000-0000-000000000000', '30000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'host.nocturne@sinner.local', crypt('SinnerDemo2026!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"first_name":"Nocturne","last_name":"Hospitality","display_name":"Nocturne Hospitality","date_of_birth":"1990-01-01","terms_accepted_at":"2026-01-01T00:00:00Z","privacy_accepted_at":"2026-01-01T00:00:00Z","adult_confirmation_at":"2026-01-01T00:00:00Z"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '31000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'guest.one@sinner.local', crypt('SinnerDemo2026!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"first_name":"Mariana","last_name":"Demo","display_name":"Mariana","date_of_birth":"1992-04-12","terms_accepted_at":"2026-01-01T00:00:00Z","privacy_accepted_at":"2026-01-01T00:00:00Z","adult_confirmation_at":"2026-01-01T00:00:00Z"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '31000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'guest.two@sinner.local', crypt('SinnerDemo2026!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"first_name":"Alex","last_name":"Demo","display_name":"Alex","date_of_birth":"1988-09-08","terms_accepted_at":"2026-01-01T00:00:00Z","privacy_accepted_at":"2026-01-01T00:00:00Z","adult_confirmation_at":"2026-01-01T00:00:00Z"}', now(), now(), '', '', '', '')
on conflict (id) do nothing;

-- Password sign-in also requires an email identity linked to each Auth user.
insert into auth.identities (
  id, user_id, provider_id, identity_data, provider,
  last_sign_in_at, created_at, updated_at
)
select
  u.id,
  u.id,
  u.id::text,
  jsonb_build_object(
    'sub', u.id::text,
    'email', u.email,
    'email_verified', true,
    'phone_verified', false
  ),
  'email',
  null,
  u.created_at,
  u.updated_at
from auth.users u
where u.id in (
  '30000000-0000-4000-8000-000000000001',
  '31000000-0000-4000-8000-000000000001',
  '31000000-0000-4000-8000-000000000002'
)
on conflict (provider_id, provider) do update set
  identity_data = excluded.identity_data,
  updated_at = excluded.updated_at;

insert into public.user_roles(user_id, role) values
  ('30000000-0000-4000-8000-000000000001', 'host')
on conflict (user_id, role) do nothing;

insert into public.spaces (
  id, host_id, name, slug, short_description, description, space_type, status,
  city, state, country, approximate_location, exact_address, max_guests,
  hourly_price, overnight_price, full_day_price, cleaning_fee, minimum_hours,
  privacy_score, instant_booking, creator_friendly, group_friendly, events_allowed,
  featured, cancellation_policy, check_in_notes, minimum_booking_notice_minutes,
  buffer_minutes, house_rules, published_at
) values
  ('00000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', 'Midnight Loft', 'midnight-loft', 'Low light, discreet access and a private jacuzzi in central Guadalajara.', 'A low-lit private loft designed for hourly escapes, discreet content sessions and elevated after-dark experiences.', 'Private Suite', 'approved', 'Guadalajara', 'Jalisco', 'Mexico', 'Colonia Americana, Guadalajara', 'DEMO PRIVATE ADDRESS 1', 8, 350, 6800, 9200, 250, 2, 9.7, false, true, true, false, true, 'Free cancellation up to 48 hours before the selected start time.', 'Self check-in details are shared after confirmation.', 180, 45, '[{"key":"guests","label":"Maximum guests","detail":"Up to 8 registered guests"},{"key":"smoking","label":"Smoking","detail":"Not permitted indoors","allowed":false},{"key":"noise","label":"Noise","detail":"Keep sound within the private space"}]', now() - interval '2 days'),
  ('00000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000001', 'The Velvet Room', 'the-velvet-room', 'A cinematic suite for two with self check-in and quiet interiors.', 'A compact private suite with a cinematic palette, self check-in and polished comfort for couples.', 'Private Suite', 'approved', 'Zapopan', 'Jalisco', 'Mexico', 'Ciudad Granja, Zapopan', 'DEMO PRIVATE ADDRESS 2', 4, 280, 4200, 6100, 200, 2, 9.4, true, false, false, false, true, 'Free cancellation up to 24 hours before arrival.', 'A private access code is released after confirmation.', 120, 30, '[{"key":"guests","label":"Maximum guests","detail":"Up to 4 registered guests"},{"key":"smoking","label":"Smoking","detail":"Not permitted","allowed":false},{"key":"events","label":"Events","detail":"Not permitted","allowed":false}]', now() - interval '4 days'),
  ('00000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000001', 'Obsidian Villa', 'obsidian-villa', 'A secluded villa with pool, parking and room for curated private events.', 'A private villa for curated lifestyle events, groups and elegant nighttime gatherings.', 'Villa', 'approved', 'Guadalajara', 'Jalisco', 'Mexico', 'Las Fuentes, Guadalajara', 'DEMO PRIVATE ADDRESS 3', 20, 1200, 17500, 24000, 1200, 4, 9.9, false, true, true, true, true, 'Event cancellations require seven days notice.', 'The verified organizer meets the property manager at a nearby access point.', 1440, 120, '[{"key":"guests","label":"Maximum guests","detail":"Up to 20 registered guests"},{"key":"events","label":"Events","detail":"Approved guest lists are allowed","allowed":true},{"key":"noise","label":"Noise","detail":"Outdoor sound ends at 1 AM"}]', now() - interval '6 days'),
  ('00000000-0000-4000-8000-000000000004', '30000000-0000-4000-8000-000000000001', 'Luna Studio', 'luna-studio', 'Creator-ready studio with controlled light, mirrors and soundproofing.', 'A flexible studio for photography and video with a private changing area and configurable equipment.', 'Studio', 'approved', 'Zapopan', 'Jalisco', 'Mexico', 'Chapalita, Zapopan', 'DEMO PRIVATE ADDRESS 4', 6, 620, null, 5200, 180, 2, 9.2, true, true, true, false, false, 'Free cancellation up to 24 hours before the session.', 'Equipment requests should be sent before arrival.', 180, 30, '[{"key":"guests","label":"Maximum guests","detail":"Up to 6 registered guests"},{"key":"equipment","label":"Equipment","detail":"Return equipment to its original position"}]', now() - interval '9 days'),
  ('00000000-0000-4000-8000-000000000005', '30000000-0000-4000-8000-000000000001', 'Casa Niebla', 'casa-niebla', 'A serene apartment with a private terrace and independent entrance.', 'A quiet apartment with warm natural materials, a sheltered terrace and flexible hourly access.', 'Apartment', 'approved', 'Guadalajara', 'Jalisco', 'Mexico', 'Providencia, Guadalajara', 'DEMO PRIVATE ADDRESS 5', 4, 780, 5400, 7600, 300, 3, 9.6, false, true, false, false, false, 'Free cancellation up to 48 hours before arrival.', 'Street-level details are withheld until confirmation.', 360, 45, '[{"key":"guests","label":"Maximum guests","detail":"Up to 4 registered guests"},{"key":"events","label":"Events","detail":"Not permitted","allowed":false}]', now() - interval '12 days'),
  ('00000000-0000-4000-8000-000000000006', '30000000-0000-4000-8000-000000000001', 'Atelier Nocturne', 'atelier-nocturne', 'An industrial studio for photo, video and commercial productions.', 'An adaptable production space with tall ceilings, blackout control and a simple load-in route.', 'Studio', 'approved', 'Tlaquepaque', 'Jalisco', 'Mexico', 'Centro, Tlaquepaque', 'DEMO PRIVATE ADDRESS 6', 10, 1100, null, 8700, 350, 3, 8.9, true, true, true, false, false, 'Free cancellation up to 24 hours before the session.', 'A studio assistant provides access without entering the booked area.', 240, 45, '[{"key":"guests","label":"Maximum guests","detail":"Up to 10 registered guests"},{"key":"equipment","label":"Equipment","detail":"Production insurance may be requested"}]', now() - interval '15 days'),
  ('00000000-0000-4000-8000-000000000007', '30000000-0000-4000-8000-000000000001', 'Eclipse Playroom', 'eclipse-playroom', 'A themed private room with sound control and discreet self check-in.', 'A carefully finished themed room with durable surfaces, flexible ambient light and clear private-use rules.', 'Playroom', 'approved', 'Zapopan', 'Jalisco', 'Mexico', 'Valle Real, Zapopan', 'DEMO PRIVATE ADDRESS 7', 6, 1250, 7200, 9800, 450, 2, 9.8, false, false, true, false, false, 'Free cancellation up to 48 hours before arrival.', 'Identity verification is required before access details are released.', 360, 60, '[{"key":"guests","label":"Maximum guests","detail":"Up to 6 registered guests"},{"key":"events","label":"Events","detail":"Not permitted","allowed":false}]', now() - interval '19 days'),
  ('00000000-0000-4000-8000-000000000008', '30000000-0000-4000-8000-000000000001', 'Terraza Umbral', 'terraza-umbral', 'A discreet rooftop venue for controlled guest lists and private events.', 'An enclosed rooftop venue with covered lounge areas, service access and a host-managed entrance.', 'Venue', 'approved', 'Guadalajara', 'Jalisco', 'Mexico', 'Lafayette, Guadalajara', 'DEMO PRIVATE ADDRESS 8', 30, 2200, null, 16800, 900, 4, 8.7, false, true, true, true, false, 'Events require seven days notice for a full refund.', 'Guest-list and vendor details are reviewed before confirmation.', 2880, 120, '[{"key":"guests","label":"Maximum guests","detail":"Up to 30 registered guests"},{"key":"events","label":"Events","detail":"Approved events are allowed","allowed":true}]', now() - interval '23 days'),
  ('00000000-0000-4000-8000-000000000009', '30000000-0000-4000-8000-000000000001', 'Suite Amatista', 'suite-amatista', 'An accessible private suite with bathtub and contactless arrival.', 'A polished suite with contactless access, blackout curtains and a calm private bathroom.', 'Private Suite', 'approved', 'Tonala', 'Jalisco', 'Mexico', 'Loma Dorada, Tonala', 'DEMO PRIVATE ADDRESS 9', 2, 540, 3600, 5100, 180, 2, 9.1, true, false, false, false, false, 'Free cancellation up to 24 hours before arrival.', 'Contactless access details are shared after confirmation.', 120, 30, '[{"key":"guests","label":"Maximum guests","detail":"Up to 2 registered guests"},{"key":"smoking","label":"Smoking","detail":"Not permitted","allowed":false}]', now() - interval '28 days'),
  ('00000000-0000-4000-8000-000000000010', '30000000-0000-4000-8000-000000000001', 'Casa Cobalto', 'casa-cobalto', 'A lakeside villa with private grounds, pool and production-friendly spaces.', 'A spacious villa with enclosed gardens, a pool and varied interiors for groups and private stays.', 'Villa', 'approved', 'Ajijic', 'Jalisco', 'Mexico', 'West Ajijic, Lake Chapala', 'DEMO PRIVATE ADDRESS 10', 14, 950, 12800, 18400, 950, 4, 9.8, false, true, true, true, false, 'Free cancellation up to seven days before arrival.', 'The exact property entrance is shared only after confirmation.', 1440, 90, '[{"key":"guests","label":"Maximum guests","detail":"Up to 14 registered guests"},{"key":"pets","label":"Pets","detail":"Permitted with host approval","allowed":true}]', now() - interval '35 days'),
  ('00000000-0000-4000-8000-000000000011', '30000000-0000-4000-8000-000000000001', 'Secret Draft Suite', 'secret-draft-suite', 'A private draft used to verify that unpublished listings never leak.', 'This development-only listing must remain invisible to marketplace searches and direct public detail reads.', 'Private Suite', 'draft', 'Guadalajara', 'Jalisco', 'Mexico', 'Private draft location', 'DEMO PRIVATE DRAFT ADDRESS', 2, 500, 3400, 4800, 150, 2, 10, false, false, false, false, false, 'Draft policy.', 'Draft check-in notes.', 120, 30, '[]', null)
on conflict (id) do update set
  host_id = excluded.host_id, name = excluded.name, slug = excluded.slug,
  short_description = excluded.short_description, description = excluded.description,
  space_type = excluded.space_type, status = excluded.status, city = excluded.city,
  state = excluded.state, country = excluded.country, approximate_location = excluded.approximate_location,
  exact_address = excluded.exact_address, max_guests = excluded.max_guests,
  hourly_price = excluded.hourly_price, overnight_price = excluded.overnight_price,
  full_day_price = excluded.full_day_price, cleaning_fee = excluded.cleaning_fee,
  minimum_hours = excluded.minimum_hours, privacy_score = excluded.privacy_score,
  instant_booking = excluded.instant_booking, creator_friendly = excluded.creator_friendly,
  group_friendly = excluded.group_friendly, events_allowed = excluded.events_allowed,
  featured = excluded.featured, cancellation_policy = excluded.cancellation_policy,
  check_in_notes = excluded.check_in_notes, minimum_booking_notice_minutes = excluded.minimum_booking_notice_minutes,
  buffer_minutes = excluded.buffer_minutes, house_rules = excluded.house_rules, published_at = excluded.published_at;

-- Nationwide development markets. These values also update an already-seeded dev project.
update public.spaces as s
set
  country_code = location.country_code,
  country = location.country,
  state = location.state,
  state_code = location.state_code,
  municipality = location.municipality,
  city = location.city,
  locality = location.locality,
  postal_code = location.postal_code,
  latitude = location.latitude,
  longitude = location.longitude,
  approximate_location = location.approximate_location,
  exact_address = location.exact_address
from (values
  ('00000000-0000-4000-8000-000000000001'::uuid, 'MX', 'Mexico', 'Jalisco', 'JAL', 'Guadalajara', 'Guadalajara', 'Colonia Americana', '44160', 20.6736000, -103.3680000, 'Colonia Americana, Guadalajara, Jalisco', 'DEMO PRIVATE ADDRESS GDL'),
  ('00000000-0000-4000-8000-000000000002'::uuid, 'MX', 'Mexico', 'Ciudad de México', 'CMX', 'Cuauhtémoc', 'Ciudad de México', 'Roma Norte', '06700', 19.4180000, -99.1640000, 'Roma Norte, Ciudad de México', 'DEMO PRIVATE ADDRESS CDMX'),
  ('00000000-0000-4000-8000-000000000003'::uuid, 'MX', 'Mexico', 'Nuevo León', 'NLE', 'Monterrey', 'Monterrey', 'Obispado', '64060', 25.6780000, -100.3420000, 'Obispado, Monterrey, Nuevo León', 'DEMO PRIVATE ADDRESS MTY'),
  ('00000000-0000-4000-8000-000000000004'::uuid, 'MX', 'Mexico', 'Quintana Roo', 'ROO', 'Benito Juárez', 'Cancún', 'Zona Hotelera', '77500', 21.1210000, -86.8510000, 'Zona Hotelera, Cancún, Quintana Roo', 'DEMO PRIVATE ADDRESS CUN'),
  ('00000000-0000-4000-8000-000000000005'::uuid, 'MX', 'Mexico', 'Jalisco', 'JAL', 'Puerto Vallarta', 'Puerto Vallarta', 'Zona Romántica', '48380', 20.6530000, -105.2250000, 'Zona Romántica, Puerto Vallarta, Jalisco', 'DEMO PRIVATE ADDRESS PVR'),
  ('00000000-0000-4000-8000-000000000006'::uuid, 'MX', 'Mexico', 'Querétaro', 'QUE', 'Querétaro', 'Querétaro', 'Centro Histórico', '76000', 20.5930000, -100.3920000, 'Centro Histórico, Querétaro, Querétaro', 'DEMO PRIVATE ADDRESS QRO'),
  ('00000000-0000-4000-8000-000000000007'::uuid, 'MX', 'Mexico', 'Baja California', 'BCN', 'Tijuana', 'Tijuana', 'Zona Río', '22010', 32.5260000, -117.0200000, 'Zona Río, Tijuana, Baja California', 'DEMO PRIVATE ADDRESS TIJ'),
  ('00000000-0000-4000-8000-000000000008'::uuid, 'MX', 'Mexico', 'Yucatán', 'YUC', 'Mérida', 'Mérida', 'Centro', '97000', 20.9670000, -89.6230000, 'Centro, Mérida, Yucatán', 'DEMO PRIVATE ADDRESS MID'),
  ('00000000-0000-4000-8000-000000000009'::uuid, 'MX', 'Mexico', 'Puebla', 'PUE', 'Puebla', 'Puebla', 'Angelópolis', '72197', 19.0310000, -98.2380000, 'Angelópolis, Puebla, Puebla', 'DEMO PRIVATE ADDRESS PUE'),
  ('00000000-0000-4000-8000-000000000010'::uuid, 'MX', 'Mexico', 'Guanajuato', 'GUA', 'León', 'León', 'El Coecillo', '37260', 21.1250000, -101.6820000, 'El Coecillo, León, Guanajuato', 'DEMO PRIVATE ADDRESS BJX'),
  ('00000000-0000-4000-8000-000000000011'::uuid, 'MX', 'Mexico', 'Jalisco', 'JAL', 'Guadalajara', 'Guadalajara', 'Providencia', '44630', null, null, 'Providencia, Guadalajara, Jalisco', 'DEMO PRIVATE DRAFT ADDRESS')
) as location(
  id, country_code, country, state, state_code, municipality, city, locality,
  postal_code, latitude, longitude, approximate_location, exact_address
)
where s.id = location.id;

insert into public.space_photos (space_id, storage_path, sort_order, is_cover, alt_text) values
  ('00000000-0000-4000-8000-000000000001', 'https://images.unsplash.com/photo-1615873968403-89e068629265', 0, true, 'Midnight Loft main room'),
  ('00000000-0000-4000-8000-000000000001', 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304', 1, false, 'Midnight Loft bedroom'),
  ('00000000-0000-4000-8000-000000000001', 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b', 2, false, 'Midnight Loft lounge'),
  ('00000000-0000-4000-8000-000000000002', 'https://images.unsplash.com/photo-1590490360182-c33d57733427', 0, true, 'The Velvet Room main suite'),
  ('00000000-0000-4000-8000-000000000002', 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0', 1, false, 'The Velvet Room lounge'),
  ('00000000-0000-4000-8000-000000000002', 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6', 2, false, 'The Velvet Room details'),
  ('00000000-0000-4000-8000-000000000003', 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c', 0, true, 'Obsidian Villa exterior'),
  ('00000000-0000-4000-8000-000000000003', 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d', 1, false, 'Obsidian Villa lounge'),
  ('00000000-0000-4000-8000-000000000003', 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3', 2, false, 'Obsidian Villa interior'),
  ('00000000-0000-4000-8000-000000000004', 'https://images.unsplash.com/photo-1604014237800-1c9102c219da', 0, true, 'Luna Studio'),
  ('00000000-0000-4000-8000-000000000005', 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3', 0, true, 'Casa Niebla'),
  ('00000000-0000-4000-8000-000000000006', 'https://images.unsplash.com/photo-1497366811353-6870744d04b2', 0, true, 'Atelier Nocturne'),
  ('00000000-0000-4000-8000-000000000007', 'https://images.unsplash.com/photo-1617104678098-de229db51175', 0, true, 'Eclipse Playroom'),
  ('00000000-0000-4000-8000-000000000008', 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30', 0, true, 'Terraza Umbral'),
  ('00000000-0000-4000-8000-000000000009', 'https://images.unsplash.com/photo-1618773928121-c32242e63f39', 0, true, 'Suite Amatista'),
  ('00000000-0000-4000-8000-000000000010', 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde', 0, true, 'Casa Cobalto')
on conflict (space_id, storage_path) do update set sort_order = excluded.sort_order, is_cover = excluded.is_cover, alt_text = excluded.alt_text;

with assignments(space_slug, amenity_slug) as (values
  ('midnight-loft','jacuzzi'), ('midnight-loft','private-entrance'), ('midnight-loft','self-check-in'), ('midnight-loft','soundproofing'), ('midnight-loft','wifi'), ('midnight-loft','lighting-equipment'),
  ('the-velvet-room','private-entrance'), ('the-velvet-room','self-check-in'), ('the-velvet-room','soundproofing'), ('the-velvet-room','air-conditioning'), ('the-velvet-room','shower'),
  ('obsidian-villa','pool'), ('obsidian-villa','private-parking'), ('obsidian-villa','private-entrance'), ('obsidian-villa','kitchen'), ('obsidian-villa','terrace'), ('obsidian-villa','outdoor-area'),
  ('luna-studio','lighting-equipment'), ('luna-studio','tripod'), ('luna-studio','mirrors'), ('luna-studio','soundproofing'), ('luna-studio','wifi'),
  ('casa-niebla','private-entrance'), ('casa-niebla','terrace'), ('casa-niebla','bathtub'), ('casa-niebla','wifi'), ('casa-niebla','kitchen'),
  ('atelier-nocturne','lighting-equipment'), ('atelier-nocturne','tripod'), ('atelier-nocturne','mirrors'), ('atelier-nocturne','private-parking'), ('atelier-nocturne','soundproofing'),
  ('eclipse-playroom','private-entrance'), ('eclipse-playroom','self-check-in'), ('eclipse-playroom','soundproofing'), ('eclipse-playroom','jacuzzi'), ('eclipse-playroom','shower'),
  ('terraza-umbral','terrace'), ('terraza-umbral','outdoor-area'), ('terraza-umbral','private-entrance'), ('terraza-umbral','private-parking'), ('terraza-umbral','kitchen'),
  ('suite-amatista','self-check-in'), ('suite-amatista','bathtub'), ('suite-amatista','shower'), ('suite-amatista','wifi'), ('suite-amatista','private-parking'),
  ('casa-cobalto','pool'), ('casa-cobalto','outdoor-area'), ('casa-cobalto','terrace'), ('casa-cobalto','private-parking'), ('casa-cobalto','kitchen')
)
insert into public.space_amenities(space_id, amenity_id)
select s.id, a.id from assignments x join public.spaces s on s.slug = x.space_slug join public.amenities a on a.slug = x.amenity_slug
on conflict do nothing;

insert into public.space_allowed_uses (space_id, allowed_use_id, allowed)
select s.id, u.id,
  case
    when s.slug = 'midnight-loft' and u.slug = any(array['intimate_experiences','nudity','photography','video_recording','commercial_content','groups']) then true
    when s.slug = 'the-velvet-room' and u.slug = any(array['intimate_experiences','nudity','photography']) then true
    when s.slug = 'obsidian-villa' and u.slug = any(array['intimate_experiences','nudity','photography','video_recording','groups','events']) then true
    when s.slug in ('luna-studio','atelier-nocturne') and u.slug = any(array['nudity','photography','video_recording','commercial_content','groups']) then true
    when s.slug = 'casa-niebla' and u.slug = any(array['intimate_experiences','nudity','photography','video_recording']) then true
    when s.slug = 'eclipse-playroom' and u.slug = any(array['intimate_experiences','nudity','photography','groups']) then true
    when s.slug = 'terraza-umbral' and u.slug = any(array['photography','video_recording','commercial_content','groups','events']) then true
    when s.slug = 'suite-amatista' and u.slug = any(array['intimate_experiences','nudity','photography']) then true
    when s.slug = 'casa-cobalto' and u.slug = any(array['intimate_experiences','nudity','photography','video_recording','commercial_content','groups','events','pets']) then true
    else false
  end
from public.spaces s cross join public.allowed_uses u
where s.slug in ('midnight-loft','the-velvet-room','obsidian-villa','luna-studio','casa-niebla','atelier-nocturne','eclipse-playroom','terraza-umbral','suite-amatista','casa-cobalto')
on conflict (space_id, allowed_use_id) do update set allowed = excluded.allowed;

insert into public.availability(space_id, date, start_time, end_time, status) values
  ('00000000-0000-4000-8000-000000000001', current_date + 3, '20:00', '23:00', 'reserved'),
  ('00000000-0000-4000-8000-000000000001', current_date + 7, '18:00', '22:00', 'blocked'),
  ('00000000-0000-4000-8000-000000000002', current_date + 4, '21:00', '01:00', 'reserved'),
  ('00000000-0000-4000-8000-000000000003', current_date + 5, '16:00', '23:30', 'blocked')
on conflict (space_id, date, start_time, end_time) do update set status = excluded.status;

insert into public.bookings(id, guest_id, space_id, start_datetime, end_datetime, guest_count, status, base_amount, cleaning_fee, service_fee, total_amount) values
  ('40000000-0000-4000-8000-000000000001', '31000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001', now() - interval '35 days', now() - interval '35 days' + interval '4 hours', 2, 'completed', 1400, 250, 182, 1832),
  ('40000000-0000-4000-8000-000000000002', '31000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000001', now() - interval '20 days', now() - interval '20 days' + interval '4 hours', 2, 'completed', 1400, 250, 182, 1832),
  ('40000000-0000-4000-8000-000000000003', '31000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000002', now() - interval '15 days', now() - interval '15 days' + interval '4 hours', 2, 'completed', 1120, 200, 145, 1465),
  ('40000000-0000-4000-8000-000000000004', '31000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000003', now() - interval '12 days', now() - interval '12 days' + interval '4 hours', 8, 'completed', 4800, 1200, 660, 6660)
on conflict (id) do nothing;

insert into public.reviews(id, booking_id, author_id, space_id, overall_rating, cleanliness_rating, privacy_rating, accuracy_rating, host_rating, discretion_rating, comment, created_at) values
  ('50000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001', '31000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001', 5, 5, 5, 5, 5, 5, 'The arrival was discreet, the lighting was excellent and the space matched every photo.', now() - interval '30 days'),
  ('50000000-0000-4000-8000-000000000002', '40000000-0000-4000-8000-000000000002', '31000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000001', 5, 5, 5, 5, 5, 5, 'Clear rules, responsive host and a genuinely private entrance.', now() - interval '15 days'),
  ('50000000-0000-4000-8000-000000000003', '40000000-0000-4000-8000-000000000003', '31000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000002', 4, 5, 5, 4, 5, 5, 'Beautiful room and very clear instructions from the host.', now() - interval '10 days'),
  ('50000000-0000-4000-8000-000000000004', '40000000-0000-4000-8000-000000000004', '31000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000003', 5, 5, 5, 5, 5, 5, 'The privacy and guest flow were exceptionally well planned for our group.', now() - interval '7 days')
on conflict (id) do nothing;

insert into public.experiences (id, host_id, name, slug, description, city, state, country, duration_minutes, max_guests, price, currency, status) values
  ('10000000-0000-4000-8000-000000000001', null, 'Private Jacuzzi Experience', 'private-jacuzzi-experience', 'Warm water, low light and complete privacy.', 'Guadalajara', 'Jalisco', 'Mexico', 180, 2, 2800, 'MXN', 'approved'),
  ('10000000-0000-4000-8000-000000000002', null, 'Couples Escape', 'couples-escape', 'A private setting designed for two.', 'Zapopan', 'Jalisco', 'Mexico', 300, 2, 3900, 'MXN', 'approved'),
  ('10000000-0000-4000-8000-000000000003', null, 'Themed Experience', 'themed-experience', 'Immersive rooms with a distinct point of view.', 'Guadalajara', 'Jalisco', 'Mexico', 240, 4, 3200, 'MXN', 'approved'),
  ('10000000-0000-4000-8000-000000000004', null, 'Private Content Studio', 'private-content-studio', 'Controlled light, discreet access and creator-ready sets.', 'Guadalajara', 'Jalisco', 'Mexico', 240, 6, 4500, 'MXN', 'approved'),
  ('10000000-0000-4000-8000-000000000005', null, 'Sensory Experience', 'sensory-experience', 'Atmosphere, sound and detail curated for the night.', 'Zapopan', 'Jalisco', 'Mexico', 180, 2, 3500, 'MXN', 'approved')
on conflict (id) do nothing;

insert into public.events (id, organizer_id, name, slug, description, city, state, country, venue_name, event_date, start_time, end_time, capacity, ticket_price, currency, visibility, status) values
  ('20000000-0000-4000-8000-000000000001', null, 'Midnight Masquerade', 'midnight-masquerade', 'A private masked social evening for verified adults.', 'Guadalajara', 'Jalisco', 'Mexico', 'Private venue', current_date + 30, '21:00', '02:00', 120, 1200, 'MXN', 'invite_only', 'approved'),
  ('20000000-0000-4000-8000-000000000002', null, 'Couples Only Night', 'couples-only-night', 'A limited private event reserved for verified couples.', 'Zapopan', 'Jalisco', 'Mexico', 'Private venue', current_date + 45, '20:00', '01:00', 80, 1600, 'MXN', 'private', 'approved'),
  ('20000000-0000-4000-8000-000000000003', null, 'After Dark Social', 'after-dark-social', 'A curated social event with discreet access and verified attendance.', 'Guadalajara', 'Jalisco', 'Mexico', 'Private venue', current_date + 60, '21:00', '02:00', 160, 900, 'MXN', 'public', 'approved')
on conflict (id) do nothing;

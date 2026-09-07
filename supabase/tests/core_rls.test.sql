begin;

select plan(41);

select has_table('public', 'profiles', 'profiles exists');
select has_table('public', 'user_roles', 'user_roles exists');
select has_table('public', 'spaces', 'spaces exists');
select has_table('public', 'bookings', 'bookings exists');
select has_table('public', 'favorites', 'favorites exists');
select has_table('public', 'messages', 'messages exists');
select has_table('public', 'notifications', 'notifications exists');
select has_table('public', 'reports', 'reports exists');

select ok((select relrowsecurity from pg_class where oid = 'public.profiles'::regclass), 'profiles RLS enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.user_roles'::regclass), 'user_roles RLS enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.spaces'::regclass), 'spaces RLS enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.bookings'::regclass), 'bookings RLS enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.favorites'::regclass), 'favorites RLS enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.conversations'::regclass), 'conversations RLS enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.messages'::regclass), 'messages RLS enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.notifications'::regclass), 'notifications RLS enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.event_tickets'::regclass), 'event_tickets RLS enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.reports'::regclass), 'reports RLS enabled');

select policies_are('public', 'favorites', array['favorites_own_delete','favorites_own_insert','favorites_own_select'], 'favorites policies are explicit');
select policies_are('public', 'profiles', array['profiles_select_own','profiles_update_own'], 'profile policies are explicit');
select policies_are('public', 'notifications', array['notifications_own_delete','notifications_own_select','notifications_own_update'], 'notification policies are explicit');
select has_function('public', 'request_host_role', array[]::text[], 'host role RPC exists');
select has_view('public', 'public_profiles', 'safe public profile view exists');
select col_is_pk('public', 'profiles', 'id', 'profile id is primary key');

select has_column('public', 'spaces', 'short_description', 'spaces have marketplace summaries');
select has_column('public', 'spaces', 'featured', 'spaces support featured ordering');
select has_column('public', 'spaces', 'rating_average', 'spaces cache average ratings');
select has_column('public', 'spaces', 'review_count', 'spaces cache review counts');
select has_column('public', 'spaces', 'house_rules', 'spaces have structured house rules');
select has_column('public', 'space_photos', 'alt_text', 'space photos support accessible labels');
select has_column('public', 'amenities', 'icon_name', 'amenities map to UI icons');
select has_view('public', 'public_host_profiles', 'safe public host profile view exists');
select has_view('public', 'public_space_reviews', 'safe public review view exists');
select has_function('public', 'search_public_spaces', 'public marketplace search RPC exists');
select has_function('public', 'check_space_availability', 'privacy-safe availability RPC exists');
select ok(not has_column_privilege('anon', 'public.spaces', 'exact_address', 'SELECT'), 'anonymous users cannot select exact addresses');
select ok(not has_column_privilege('authenticated', 'public.spaces', 'exact_address', 'SELECT'), 'authenticated users cannot select exact addresses directly');
select ok(not has_column_privilege('anon', 'public.spaces', 'latitude', 'SELECT'), 'anonymous users cannot select exact latitude');
select ok(has_column_privilege('anon', 'public.spaces', 'hourly_price', 'SELECT'), 'anonymous users can select public pricing');
select policies_are('public', 'availability', array['availability_owner_delete','availability_owner_insert','availability_owner_select','availability_owner_update'], 'availability policies keep raw intervals private');
select policies_are('public', 'reviews', array['reviews_author_delete','reviews_completed_booking_insert','reviews_visible_space'], 'reviews expose only approved listing feedback publicly');

select * from finish();
rollback;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.apis TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.api_categories TO service_role;
GRANT SELECT ON public.apis TO anon, authenticated;
GRANT SELECT ON public.api_categories TO anon, authenticated;
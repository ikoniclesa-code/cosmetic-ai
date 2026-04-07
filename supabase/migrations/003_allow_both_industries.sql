ALTER TABLE public.businesses
DROP CONSTRAINT IF EXISTS businesses_industry_check;

ALTER TABLE public.businesses
ADD CONSTRAINT businesses_industry_check
CHECK (industry IN ('cosmetics', 'home_chemistry', 'both'));

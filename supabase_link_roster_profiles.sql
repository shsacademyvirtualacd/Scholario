-- ═══════════════════════════════════════════════════════════════════════════
-- Scholario — Roster Profile Link Hotfix
-- ═══════════════════════════════════════════════════════════════════════════

-- Link existing roster entries where profile_id is NULL by matching emails
UPDATE public.roster r
SET profile_id = p.id
FROM public.profiles p
JOIN auth.users u ON p.id = u.id
WHERE LOWER(r.email) = LOWER(u.email)
  AND r.profile_id IS NULL;

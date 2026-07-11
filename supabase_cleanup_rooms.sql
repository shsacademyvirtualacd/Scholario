-- Cleanup script to remove generic "Room 101", "Room 102", etc.
-- This ensures the UI properly falls back to "TBD" or "Join Class" button when teachers add a link.

UPDATE public.class_slots
SET room_or_link = NULL
WHERE room_or_link ILIKE 'Room %';

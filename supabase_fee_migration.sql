-- ═══════════════════════════════════════════════════════════════════════════
-- Scholario — Fee Status & Automated Roster Provisioning Migration
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Create Fee Configuration Table
CREATE TABLE IF NOT EXISTS public.fee_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid UNIQUE REFERENCES public.class_offerings(id) ON DELETE CASCADE,
  amount numeric NOT NULL CHECK (amount >= 0),
  payment_instructions text NOT NULL,
  whatsapp_number text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on fee_configs
ALTER TABLE public.fee_configs ENABLE ROW LEVEL SECURITY;

-- 2. Create Fee Status Table
CREATE TABLE IF NOT EXISTS public.fee_statuses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('unpaid', 'pending', 'paid')) DEFAULT 'unpaid',
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on fee_statuses
ALTER TABLE public.fee_statuses ENABLE ROW LEVEL SECURITY;

-- 3. Create Fee Audit Trail Table
CREATE TABLE IF NOT EXISTS public.fee_audit_trail (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  status_from text NOT NULL,
  status_to text NOT NULL,
  changed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  changed_at timestamptz DEFAULT now(),
  notes text
);

-- Enable RLS on fee_audit_trail
ALTER TABLE public.fee_audit_trail ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
-- Admins have full access to everything
CREATE POLICY "fee_configs: admin all" ON public.fee_configs FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "fee_statuses: admin all" ON public.fee_statuses FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "fee_audit_trail: admin all" ON public.fee_audit_trail FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Students can read their own class's fee config and their own fee status
CREATE POLICY "fee_configs: student read" ON public.fee_configs FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.enrollments e
    WHERE e.student_id = auth.uid() AND e.offering_id = class_id
  ) OR public.is_admin()
);

CREATE POLICY "fee_statuses: student read" ON public.fee_statuses FOR SELECT USING (
  student_id = auth.uid() OR public.is_admin()
);

-- Students can trigger status updates to 'pending' via their own profile
CREATE POLICY "fee_statuses: student update pending" ON public.fee_statuses FOR UPDATE USING (
  student_id = auth.uid()
) WITH CHECK (
  student_id = auth.uid() AND status = 'pending'
);

-- 5. Helper Function to log audit trail
CREATE OR REPLACE FUNCTION public.log_fee_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.fee_audit_trail (student_id, status_from, status_to, changed_by, notes)
    VALUES (
      NEW.student_id,
      OLD.status,
      NEW.status,
      auth.uid(),
      'Status updated from ' || OLD.status || ' to ' || NEW.status
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_fee_status_updated
  AFTER UPDATE ON public.fee_statuses
  FOR EACH ROW EXECUTE FUNCTION public.log_fee_status_change();

-- 6. Trigger on auth.users for Automated Profile & Enrollment Provisioning
CREATE OR REPLACE FUNCTION public.handle_new_user_oauth()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_roster_record record;
  v_stream text;
  v_class_id uuid;
BEGIN
  -- Look up email in roster (case-insensitive)
  SELECT * INTO v_roster_record
  FROM public.roster
  WHERE LOWER(email) = LOWER(NEW.email);

  -- If not found, do not create profile, just return
  IF v_roster_record IS NULL THEN
    RETURN NEW;
  END IF;

  -- Determine stream based on class assignments
  v_stream := 'pre-engineering'; -- Default stream

  -- Insert profile
  INSERT INTO public.profiles (id, role, full_name, phone, stream)
  VALUES (
    NEW.id,
    v_roster_record.role,
    v_roster_record.full_name,
    NULL,
    CASE WHEN v_roster_record.role = 'student' THEN v_stream ELSE NULL END
  );

  -- Link roster entry
  UPDATE public.roster
  SET profile_id = NEW.id
  WHERE id = v_roster_record.id;

  -- Enrollments / teachers setup
  IF v_roster_record.role = 'student' THEN
    FOREACH v_class_id IN ARRAY v_roster_record.class_ids
    LOOP
      INSERT INTO public.enrollments (student_id, offering_id, total_classes)
      VALUES (NEW.id, v_class_id, 48)
      ON CONFLICT DO NOTHING;
    END LOOP;

    -- Initialize student fee status
    INSERT INTO public.fee_statuses (student_id, status)
    VALUES (NEW.id, 'unpaid')
    ON CONFLICT DO NOTHING;

  ELSIF v_roster_record.role = 'teacher' THEN
    INSERT INTO public.teachers (id, full_name, email, is_active, joining_date)
    VALUES (NEW.id, v_roster_record.full_name, LOWER(NEW.email), TRUE, CURRENT_DATE)
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email;

    FOREACH v_class_id IN ARRAY v_roster_record.class_ids
    LOOP
      UPDATE public.class_offerings
      SET teacher_id = NEW.id
      WHERE id = v_class_id;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger execution
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_oauth();

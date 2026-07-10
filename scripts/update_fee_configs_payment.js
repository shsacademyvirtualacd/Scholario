import pg from 'pg';

const connectionString = 'postgresql://postgres:Marcelmmm23155@@db.rxgrxjlyrfzojvirkhdc.supabase.co:5432/postgres';
const pool = new pg.Pool({ connectionString });

const instructions = `Easypaisa:
Number: 03335292094
Name: Sadia Fatima

JazzCash:
Number: 03058969050
Name: Haseena Bibi`;

async function main() {
  try {
    const res = await pool.query('UPDATE public.fee_configs SET payment_instructions = $1, updated_at = now()', [instructions]);
    console.log('Successfully updated rows in fee_configs:', res.rowCount);

    // Also check or ensure a universal config row exists if class_id IS NULL is queried
    const checkUniv = await pool.query('SELECT id FROM public.fee_configs WHERE class_id IS NULL');
    if (checkUniv.rows.length === 0) {
      await pool.query('INSERT INTO public.fee_configs (class_id, amount, payment_instructions, whatsapp_number) VALUES (NULL, 0, $1, $2)', [instructions, '03222314436']);
      console.log('Inserted universal fee_configs row.');
    } else {
      await pool.query('UPDATE public.fee_configs SET payment_instructions = $1 WHERE class_id IS NULL', [instructions]);
      console.log('Updated universal fee_configs row.');
    }
  } catch (e) {
    console.error('Error updating fee_configs:', e);
  } finally {
    await pool.end();
  }
}

main();

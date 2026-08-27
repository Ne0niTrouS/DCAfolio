-- DCAfolio 0005 — additional Thai SET symbols
--
-- Template for growing the stock master by hand. Copy this file to the next
-- number (0006, 0007…), edit the rows, and apply with `supabase db push`.
--
-- Why a migration and not the SQL editor: the repository is the definition of
-- what production contains. A row typed straight into the dashboard exists in
-- exactly one place, is absent from every fresh checkout, and is invisible to
-- the database tests. Adding it here keeps the two in step.
--
-- The app can also add a symbol at a time through the Stocks page, which calls
-- the `stock-admin` Edge Function. Use that for one-offs; use a migration when
-- adding a batch, or when the list must be reproducible.
--
-- VERIFY THE NAMES. Thai listed companies rename and restructure — SCB now sits
-- under SCBX, TRUE and DTAC merged, GULF merged with INTUCH. Check each symbol
-- and Thai name against https://www.set.or.th before relying on it. A wrong
-- name here is wrong on every screen and in every export.
--
-- `on conflict (symbol) do nothing` makes this safe to run repeatedly and safe
-- to re-run after adding rows: existing symbols are left exactly as they are.
-- It will NOT correct a name that is already wrong — see the bottom of the file.

insert into public.stocks (symbol, name_th, market, is_active) values
  ('LH',     'บริษัท แลนด์แอนด์เฮ้าส์ จำกัด (มหาชน)',                  'SET', true),
  ('TTB',    'ธนาคารทหารไทยธนชาต จำกัด (มหาชน)',                       'SET', true),
  ('TISCO',  'บริษัท ทิสโก้ไฟแนนเชียลกรุ๊ป จำกัด (มหาชน)',              'SET', true),
  ('KKP',    'ธนาคารเกียรตินาคินภัทร จำกัด (มหาชน)',                    'SET', true),
  ('PTTGC',  'บริษัท พีทีที โกลบอล เคมิคอล จำกัด (มหาชน)',              'SET', true),
  ('TOP',    'บริษัท ไทยออยล์ จำกัด (มหาชน)',                          'SET', true),
  ('IVL',    'บริษัท อินโดรามา เวนเจอร์ส จำกัด (มหาชน)',                'SET', true),
  ('DELTA',  'บริษัท เดลต้า อีเลคโทรนิคส์ (ประเทศไทย) จำกัด (มหาชน)',    'SET', true),
  ('HMPRO',  'บริษัท โฮม โปรดักส์ เซ็นเตอร์ จำกัด (มหาชน)',             'SET', true),
  ('CRC',    'บริษัท เซ็นทรัล รีเทล คอร์ปอเรชั่น จำกัด (มหาชน)',         'SET', true),
  ('WHA',    'บริษัท ดับบลิวเอชเอ คอร์ปอเรชั่น จำกัด (มหาชน)',           'SET', true),
  ('BTS',    'บริษัท บีทีเอส กรุ๊ป โฮลดิ้งส์ จำกัด (มหาชน)',             'SET', true)
on conflict (symbol) do nothing;

-- Correcting a name that is already in the table needs an explicit update,
-- because the insert above deliberately leaves existing rows alone. Uncomment
-- and edit only the rows you have actually verified:
--
-- update public.stocks
--    set name_th = 'ชื่อที่ถูกต้อง'
--  where symbol = 'XXXX';
--
-- Retiring a symbol: deactivate rather than delete. `transactions.stock_id`
-- references this table with ON DELETE RESTRICT, so a delete either fails or
-- would orphan recorded purchases. An inactive stock disappears from the
-- pickers and keeps every past transaction readable.
--
-- update public.stocks set is_active = false where symbol = 'XXXX';

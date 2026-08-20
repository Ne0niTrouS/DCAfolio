-- DCAfolio 0004 — Thai SET stock master
--
-- The stock master is reference data, so it ships as a migration rather than a
-- seed file: the Supabase CLI has no command that runs an arbitrary SQL file
-- against a remote project, and `supabase db push` is the only supported way to
-- get rows into production. Applying migrations locally seeds development too.
--
-- A starter list of widely-held SET symbols so the transaction form is usable
-- immediately. It is NOT an exhaustive SET listing.
--
-- VERIFY BEFORE RELYING ON IT: several Thai listed companies have renamed or
-- restructured in recent years (for example SCB under the SCBX holding, the
-- TRUE/DTAC merger, and GULF's merger with INTUCH). Confirm each symbol and
-- Thai name against the official SET listing before production use, and add
-- corrections as a new migration rather than by editing this file in place.
--
-- Idempotent: safe to run repeatedly.

insert into public.stocks (symbol, name_th, market, is_active) values
  ('ADVANC', 'บริษัท แอดวานซ์ อินโฟร์ เซอร์วิส จำกัด (มหาชน)',        'SET', true),
  ('AOT',    'บริษัท ท่าอากาศยานไทย จำกัด (มหาชน)',                    'SET', true),
  ('BBL',    'ธนาคารกรุงเทพ จำกัด (มหาชน)',                            'SET', true),
  ('BDMS',   'บริษัท กรุงเทพดุสิตเวชการ จำกัด (มหาชน)',                 'SET', true),
  ('BEM',    'บริษัท ทางด่วนและรถไฟฟ้ากรุงเทพ จำกัด (มหาชน)',           'SET', true),
  ('BH',     'บริษัท โรงพยาบาลบำรุงราษฎร์ จำกัด (มหาชน)',               'SET', true),
  ('CPALL',  'บริษัท ซีพี ออลล์ จำกัด (มหาชน)',                        'SET', true),
  ('CPF',    'บริษัท เจริญโภคภัณฑ์อาหาร จำกัด (มหาชน)',                 'SET', true),
  ('CPN',    'บริษัท เซ็นทรัลพัฒนา จำกัด (มหาชน)',                      'SET', true),
  ('EGCO',   'บริษัท ผลิตไฟฟ้า จำกัด (มหาชน)',                          'SET', true),
  ('GULF',   'บริษัท กัลฟ์ ดีเวลลอปเมนท์ จำกัด (มหาชน)',                'SET', true),
  ('KBANK',  'ธนาคารกสิกรไทย จำกัด (มหาชน)',                           'SET', true),
  ('KTB',    'ธนาคารกรุงไทย จำกัด (มหาชน)',                            'SET', true),
  ('MINT',   'บริษัท ไมเนอร์ อินเตอร์เนชั่นแนล จำกัด (มหาชน)',           'SET', true),
  ('OR',     'บริษัท ปตท. น้ำมันและการค้าปลีก จำกัด (มหาชน)',            'SET', true),
  ('PTT',    'บริษัท ปตท. จำกัด (มหาชน)',                              'SET', true),
  ('PTTEP',  'บริษัท ปตท. สำรวจและผลิตปิโตรเลียม จำกัด (มหาชน)',        'SET', true),
  ('SCB',    'บริษัท เอสซีบี เอกซ์ จำกัด (มหาชน)',                      'SET', true),
  ('SCC',    'บริษัท ปูนซิเมนต์ไทย จำกัด (มหาชน)',                      'SET', true),
  ('TRUE',   'บริษัท ทรู คอร์ปอเรชั่น จำกัด (มหาชน)',                   'SET', true),
  ('TU',     'บริษัท ไทยยูเนี่ยน กรุ๊ป จำกัด (มหาชน)',                   'SET', true)
on conflict (symbol) do nothing;

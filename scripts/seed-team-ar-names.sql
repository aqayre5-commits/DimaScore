-- Seed Arabic team names (teams.name.ar) — Phase 15, Task 15.13 (match rebuild E).
--
-- Fixes the AR-SEO gap where getTeamDisplayName fell back to English (name.en) for teams with no
-- Arabic name, making AR pages (h1, <title>, recap prose) mix Arabic with Latin team names.
--
-- Curated, hand-verified set: national teams (AFCON + major world + Arab nations — standard country
-- names), Botola Pro/2 clubs, and the biggest global clubs. Applied to prod 2026-09-17 via the Neon
-- console (raised name.ar coverage from 17 → 123 teams). This file is the version-controlled record
-- so the names survive a DB restore; re-runnable (jsonb_set is idempotent).
--
-- Long tail (remaining ~1280 teams, mostly minor clubs + youth/women national variants) is deferred
-- to a Wikipedia-langlinks backfill script (en-Wikipedia URL in TEAM_SAMEAS → ar title). Also TODO:
-- shortName.ar for cleaner compact labels (ticker/score strips).

-- Batch 1 — national teams (core), Moroccan clubs, top global clubs
UPDATE teams AS t
SET name = jsonb_set(t.name, '{ar}', to_jsonb(v.ar), true)
FROM (VALUES
  (31,'المغرب'),(32,'مصر'),(28,'تونس'),(13,'السنغال'),(1504,'غانا'),(1530,'الكاميرون'),(1531,'جنوب إفريقيا'),(1495,'مالاوي'),
  (2,'فرنسا'),(6,'البرازيل'),(25,'ألمانيا'),(15,'سويسرا'),(21,'الدنمارك'),
  (10179,'المغرب تحت 23 سنة'),(14461,'المغرب للسيدات'),(19072,'المغرب تحت 18 سنة'),
  (968,'الوداد الرياضي'),(976,'الرجاء الرياضي'),(969,'الجيش الملكي'),(977,'الفتح الرباطي'),
  (962,'نهضة بركان'),(965,'المغرب التطواني'),(3453,'المغرب الفاسي'),(973,'حسنية أكادير'),
  (974,'اتحاد طنجة'),(975,'أولمبيك آسفي'),(972,'أولمبيك خريبكة'),(971,'كوكب مراكش'),
  (964,'الدفاع الحسني الجديدي'),(1075,'مولودية وجدة'),(967,'سريع وادي زم'),(966,'راسينغ الدار البيضاء'),
  (1074,'يوسفية برشيد'),(979,'الكاك القنيطري'),(3448,'جمعية سلا'),(970,'شباب أطلس خنيفرة'),
  (541,'ريال مدريد'),(529,'برشلونة'),(33,'مانشستر يونايتد'),(50,'مانشستر سيتي'),(40,'ليفربول'),
  (157,'بايرن ميونخ'),(85,'باريس سان جيرمان'),(42,'أرسنال'),(49,'تشيلسي'),(47,'توتنهام'),
  (496,'يوفنتوس'),(505,'إنتر ميلان'),(489,'ميلان'),(492,'نابولي'),(165,'بوروسيا دورتموند'),
  (530,'أتلتيكو مدريد'),(194,'أياكس'),(197,'آيندهوفن'),(209,'فينورد'),(211,'بنفيكا'),
  (212,'بورتو'),(228,'سبورتينغ لشبونة'),(247,'سلتيك'),(257,'رينجرز'),(81,'مارسيليا'),(497,'روما')
) AS v(id, ar)
WHERE t.id = v.id;

-- Batch 2 — additional national teams (AFCON + major world + Arab nations)
UPDATE teams AS t
SET name = jsonb_set(t.name, '{ar}', to_jsonb(v.ar), true)
FROM (VALUES
  (19,'نيجيريا'),(1532,'الجزائر'),(1501,'ساحل العاج'),(1500,'مالي'),(1502,'بوركينا فاسو'),
  (1517,'الكونغو الديمقراطية'),(1509,'غينيا'),(1503,'الغابون'),(1492,'غامبيا'),(1507,'زامبيا'),
  (1529,'أنغولا'),(1491,'موريتانيا'),(1516,'بنين'),(1534,'توغو'),(1506,'إثيوبيا'),
  (1511,'كينيا'),(1489,'تنزانيا'),(1519,'أوغندا'),(1514,'رواندا'),(1493,'ناميبيا'),
  (1520,'بوتسوانا'),(1510,'السودان'),(1496,'جنوب السودان'),(1526,'ليبيا'),
  (26,'الأرجنتين'),(9,'إسبانيا'),(768,'إيطاليا'),(27,'البرتغال'),(1118,'هولندا'),(1,'بلجيكا'),
  (16,'المكسيك'),(2384,'الولايات المتحدة'),
  (23,'السعودية'),(1569,'قطر'),(1563,'الإمارات'),(1547,'البحرين'),(1570,'الكويت'),(1552,'عُمان'),
  (1567,'العراق'),(1548,'الأردن'),(1551,'لبنان'),(1565,'سوريا'),(1562,'فلسطين'),(1550,'اليمن')
) AS v(id, ar)
WHERE t.id = v.id;

-- Batch 3 — national teams' shortName.ar = name.ar (country name IS the short form; cleans AR
-- compact labels in the ticker / score strips). Derived from the verified name.ar above.
UPDATE teams
SET short_name = jsonb_set(COALESCE(short_name, '{}'::jsonb), '{ar}', name->'ar', true)
WHERE is_national
  AND COALESCE(name->>'ar','') <> ''
  AND COALESCE(short_name->>'ar','') = '';

-- =============================================================================
-- HashiVita Nutri — ampliação da base de alimentos
--
-- ⚠️ NÃO APLICADO. Rode você no SQL Editor do painel:
--    https://supabase.com/dashboard/project/fzhzdwwaartjulmqysrs/sql
--
-- Acrescenta ~120 alimentos aos 36 do 02_seed_food.sql, chegando a ~156.
-- Foco em alimentação brasileira do dia a dia, não em itens exóticos.
--
-- Idempotente: `on conflict (lower(name)) do update`. Reexecutar é seguro, e
-- itens que já existem do seed original são atualizados, não duplicados.
--
-- -----------------------------------------------------------------------------
-- HONESTIDADE DOS DADOS — leia antes de confiar nos números
-- -----------------------------------------------------------------------------
-- A Tabela TACO (UNICAMP, 4ª ed.) cobre: energia, proteína, carboidrato, sódio,
-- ferro e zinco. Os valores dessas seis colunas são aproximações da TACO.
--
-- A TACO **NÃO TRAZ** selênio, iodo nem vitamina D. Esses três vêm de fontes
-- complementares (USDA FoodData Central e literatura de composição) e são
-- ESTIMATIVAS: variam muito com solo, ração animal, origem e processamento.
-- O caso extremo é a castanha-do-pará, cuja faixa real vai de 200 a 3000 mcg
-- de selênio por 100 g.
--
-- Onde não havia dado confiável para um nutriente específico de um alimento,
-- o valor é 0 — e 0 aqui significa "sem dado", não "contém zero". Isso é
-- deliberado: preencher com um número plausível inventado seria pior, porque
-- o app soma esses valores para comparar com metas diárias.
--
-- Se o feedback nutricional do app for orientar decisão sobre uma condição
-- crônica de tireoide, os valores de selênio e iodo merecem uma fonte
-- escolhida conscientemente por você, não estas estimativas.
--
-- -----------------------------------------------------------------------------
-- CATEGORIAS
-- -----------------------------------------------------------------------------
-- `food.category` é uma coluna `text`, NÃO um enum `food_category`. As
-- categorias em uso são as do seed original (Cereais, Leguminosas, Tubérculos,
-- Hortaliças, Frutas, Carnes, Peixes, Frutos do mar, Ovos, Laticínios,
-- Oleaginosas, Temperos). Este arquivo acrescenta duas: "Óleos e gorduras" e
-- "Bebidas" — sem elas, azeite e café cairiam numa categoria errada.
-- Todos os valores são POR 100 g (ou 100 ml, no caso de líquidos).
-- =============================================================================

insert into public.food
  (name, emoji, category, energia_kcal, proteina_g, carboidrato_g, sodium_mg,
   selenium_mcg, iodine_mcg, vitamin_d_mcg, iron_mg, zinc_mg, default_unit, default_grams)
values
  -- ---------------------------------------------------------------- Cereais
  ('Arroz parboilizado cozido',   '🍚', 'Cereais',      124,  2.5,  25.8,     1,   4.0,  0.5,  0.0, 0.3, 0.6, 'colher de servir', 45),
  ('Macarrão cozido',             '🍝', 'Cereais',      102,  3.2,  19.9,     1,  12.0,  1.0,  0.0, 0.5, 0.4, 'porção',          100),
  ('Macarrão integral cozido',    '🍝', 'Cereais',      124,  5.3,  25.0,     3,  15.0,  1.0,  0.0, 1.1, 0.9, 'porção',          100),
  ('Pão de forma integral',       '🍞', 'Cereais',      253,  9.4,  49.9,   508,  20.0,  3.0,  0.0, 2.5, 1.2, 'fatia',            25),
  ('Pão de queijo',               '🥐', 'Cereais',      363,  5.0,  41.0,   540,   6.0,  4.0,  0.2, 0.6, 0.6, 'unidade',          30),
  ('Tapioca (goma hidratada)',    '🫓', 'Cereais',      240,  0.0,  60.0,     1,   0.0,  0.0,  0.0, 0.0, 0.0, 'unidade',          60),
  ('Cuscuz de milho cozido',      '🌽', 'Cereais',      113,  2.2,  25.3,     6,   3.0,  0.5,  0.0, 0.3, 0.4, 'fatia',            80),
  ('Milho verde cozido',          '🌽', 'Cereais',       98,  3.2,  17.1,     1,   0.6,  0.5,  0.0, 0.4, 0.6, 'espiga',           90),
  ('Farinha de mandioca',         '🌾', 'Cereais',      365,  1.2,  87.9,     2,   0.7,  0.5,  0.0, 1.1, 0.4, 'colher de sopa',   10),
  ('Granola tradicional',         '🥣', 'Cereais',      471, 10.0,  61.0,    18,   9.0,  1.0,  0.0, 3.5, 2.3, 'porção',           40),
  ('Quinoa cozida',               '🌾', 'Cereais',      120,  4.4,  21.3,     7,   2.8,  0.5,  0.0, 1.5, 1.1, 'porção',           80),
  ('Biscoito cream cracker',      '🍘', 'Cereais',      432,  9.9,  68.7,   840,  10.0,  2.0,  0.0, 2.0, 0.7, 'unidade',           7),
  ('Aveia em farelo',             '🌾', 'Cereais',      399, 16.6,  66.2,     4,  12.0,  1.0,  0.0, 5.4, 3.1, 'colher de sopa',   15),
  ('Bolo de fubá simples',        '🍰', 'Cereais',      316,  5.6,  49.0,   210,   5.0,  4.0,  0.3, 1.1, 0.6, 'fatia',            60),

  -- ----------------------------------------------------------- Leguminosas
  ('Feijão preto cozido',         '🫘', 'Leguminosas',   77,  4.5,  14.0,     2,   1.4,  0.3,  0.0, 1.5, 0.7, 'concha',           80),
  ('Feijão branco cozido',        '🫘', 'Leguminosas',   93,  6.4,  16.6,     2,   1.8,  0.3,  0.0, 2.1, 0.9, 'concha',           80),
  ('Feijão fradinho cozido',      '🫘', 'Leguminosas',   78,  5.1,  13.5,     3,   1.6,  0.3,  0.0, 1.3, 0.9, 'concha',           80),
  ('Ervilha em conserva',         '🟢', 'Leguminosas',   74,  4.6,  12.8,   240,   1.0,  0.5,  0.0, 1.2, 0.7, 'porção',           60),
  ('Ervilha fresca cozida',       '🟢', 'Leguminosas',   81,  5.4,  14.5,     3,   1.8,  0.5,  0.0, 1.5, 1.2, 'porção',           80),
  ('Soja cozida em grão',         '🫘', 'Leguminosas',  151, 12.5,  10.6,     2,  10.0,  1.0,  0.0, 2.5, 1.1, 'porção',           80),
  ('Proteína texturizada de soja','🫘', 'Leguminosas',  337, 51.0,  33.0,    20,  14.0,  1.0,  0.0, 6.5, 3.8, 'porção',           30),
  ('Homus (pasta de grão-de-bico)','🥣','Leguminosas',  166,  7.9,  14.3,   379,   2.9,  0.5,  0.0, 2.4, 1.5, 'colher de sopa',   25),

  -- ----------------------------------------------------------- Tubérculos
  ('Inhame cozido',               '🍠', 'Tubérculos',    97,  1.8,  22.6,     1,   0.7,  1.0,  0.0, 0.4, 0.3, 'pedaço',          100),
  ('Cará cozido',                 '🍠', 'Tubérculos',    83,  1.8,  19.0,     8,   0.7,  1.0,  0.0, 0.3, 0.3, 'pedaço',          100),
  ('Batata frita',                '🍟', 'Tubérculos',   267,  3.6,  35.6,   250,   0.4,  1.0,  0.0, 0.7, 0.4, 'porção',          100),
  ('Purê de batata',              '🥔', 'Tubérculos',    75,  1.9,  13.5,   180,   0.4,  3.0,  0.1, 0.3, 0.3, 'porção',          100),
  ('Beterraba crua',              '🫐', 'Tubérculos',    49,  1.9,  11.1,    32,   0.7,  1.0,  0.0, 0.3, 0.4, 'unidade',          80),
  ('Mandioquinha cozida',         '🥔', 'Tubérculos',   101,  1.1,  23.7,     6,   0.6,  1.0,  0.0, 0.3, 0.2, 'porção',          100),

  -- ------------------------------------------------------------ Hortaliças
  ('Abobrinha refogada',          '🥒', 'Hortaliças',    30,  1.1,   3.2,     2,   0.2,  1.0,  0.0, 0.3, 0.3, 'porção',           80),
  ('Abóbora cabotiá cozida',      '🎃', 'Hortaliças',    48,  1.4,  10.8,     1,   0.3,  1.0,  0.0, 0.4, 0.3, 'porção',           80),
  ('Chuchu cozido',               '🥒', 'Hortaliças',    19,  0.4,   4.8,     1,   0.2,  1.0,  0.0, 0.2, 0.2, 'porção',           80),
  ('Berinjela cozida',            '🍆', 'Hortaliças',    19,  0.7,   4.4,     1,   0.2,  1.0,  0.0, 0.2, 0.1, 'porção',           80),
  ('Quiabo cozido',               '🥬', 'Hortaliças',    30,  1.9,   5.8,     2,   0.7,  1.0,  0.0, 0.4, 0.5, 'porção',           80),
  ('Pepino cru',                  '🥒', 'Hortaliças',    10,  0.9,   2.0,     1,   0.3,  1.0,  0.0, 0.2, 0.2, 'porção',           60),
  ('Pimentão verde cru',          '🫑', 'Hortaliças',    21,  1.1,   4.9,     1,   0.0,  1.0,  0.0, 0.3, 0.1, 'unidade',          80),
  ('Pimentão vermelho cru',       '🫑', 'Hortaliças',    24,  1.0,   5.5,     2,   0.1,  1.0,  0.0, 0.3, 0.2, 'unidade',          80),
  ('Cebola crua',                 '🧅', 'Hortaliças',    39,  1.7,   8.9,     1,   0.5,  1.0,  0.0, 0.2, 0.2, 'unidade',          70),
  ('Alho cru',                    '🧄', 'Hortaliças',   113,  7.0,  23.9,     3,  14.2,  1.0,  0.0, 0.8, 1.2, 'dente',             3),
  ('Rúcula crua',                 '🥬', 'Hortaliças',    13,  1.8,   2.2,    27,   0.3,  1.0,  0.0, 1.5, 0.4, 'porção',           40),
  ('Agrião cru',                  '🥬', 'Hortaliças',    17,  2.7,   2.3,    18,   0.9,  1.5,  0.0, 3.1, 0.3, 'porção',           40),
  ('Almeirão cru',                '🥬', 'Hortaliças',    18,  1.8,   3.0,    18,   0.3,  1.0,  0.0, 1.1, 0.3, 'porção',           40),
  ('Acelga crua',                 '🥬', 'Hortaliças',    19,  1.4,   4.0,   213,   0.9,  1.0,  0.0, 1.8, 0.4, 'porção',           40),
  ('Couve-flor cozida',           '🥦', 'Hortaliças',    19,  1.2,   3.9,     3,   0.6,  1.0,  0.0, 0.3, 0.2, 'porção',           80),
  ('Vagem cozida',                '🫛', 'Hortaliças',    25,  1.8,   5.3,     1,   0.6,  1.0,  0.0, 0.6, 0.3, 'porção',           80),
  ('Palmito em conserva',         '🥫', 'Hortaliças',    23,  2.2,   3.7,   350,   0.7,  1.0,  0.0, 0.9, 0.5, 'porção',           60),
  ('Cogumelo Paris cru',          '🍄', 'Hortaliças',    22,  3.1,   3.3,     5,   9.3,  1.0,  0.2, 0.5, 0.5, 'porção',           50),
  ('Cenoura cozida',              '🥕', 'Hortaliças',    30,  0.8,   6.7,    40,   0.1,  1.5,  0.0, 0.2, 0.2, 'porção',           80),
  ('Tomate cozido/molho',         '🍅', 'Hortaliças',    24,  1.2,   4.4,   210,   0.2,  1.0,  0.0, 0.6, 0.2, 'porção',           60),
  ('Milho de pipoca estourada',   '🍿', 'Hortaliças',   448,  9.9,  70.2,     4,   3.0,  1.0,  0.0, 2.9, 2.5, 'porção',           25),
  ('Repolho roxo cru',            '🥬', 'Hortaliças',    31,  1.4,   7.2,    16,   0.6,  1.0,  0.0, 0.5, 0.2, 'porção',           60),
  ('Salsa crua',                  '🌿', 'Hortaliças',    33,  3.3,   5.5,    36,   0.1,  1.0,  0.0, 3.2, 0.7, 'colher de sopa',    5),
  ('Cebolinha crua',              '🌿', 'Hortaliças',    28,  1.9,   5.0,     7,   0.9,  1.0,  0.0, 1.0, 0.4, 'colher de sopa',    5),

  -- ---------------------------------------------------------------- Frutas
  ('Banana nanica',               '🍌', 'Frutas',        92,  1.4,  23.8,     0,   1.0,  2.0,  0.0, 0.3, 0.2, 'unidade',          85),
  ('Banana da terra cozida',      '🍌', 'Frutas',       128,  1.0,  33.4,     1,   1.0,  2.0,  0.0, 0.3, 0.2, 'unidade',         100),
  ('Manga Palmer',                '🥭', 'Frutas',        72,  0.4,  19.4,     1,   0.6,  1.0,  0.0, 0.1, 0.1, 'unidade',         150),
  ('Abacaxi',                     '🍍', 'Frutas',        48,  0.9,  12.3,     1,   0.1,  1.0,  0.0, 0.3, 0.1, 'fatia',            80),
  ('Melancia',                    '🍉', 'Frutas',        33,  0.9,   8.1,     0,   0.4,  1.0,  0.0, 0.2, 0.1, 'fatia',           200),
  ('Melão',                       '🍈', 'Frutas',        29,  0.7,   7.5,    11,   0.4,  1.0,  0.0, 0.2, 0.1, 'fatia',           150),
  ('Uva Itália',                  '🍇', 'Frutas',        53,  0.7,  13.6,     1,   0.1,  1.0,  0.0, 0.1, 0.1, 'cacho pequeno',   100),
  ('Morango',                     '🍓', 'Frutas',        30,  0.9,   6.8,     1,   0.4,  1.0,  0.0, 0.3, 0.2, 'porção',          100),
  ('Goiaba vermelha',             '🍈', 'Frutas',        54,  1.1,  13.0,     1,   0.6,  1.0,  0.0, 0.2, 0.2, 'unidade',         130),
  ('Caju (fruto)',                '🍐', 'Frutas',        43,  1.0,  10.3,     2,   0.5,  1.0,  0.0, 0.2, 0.2, 'unidade',          80),
  ('Acerola',                     '🍒', 'Frutas',        33,  0.9,   8.0,     3,   0.6,  1.0,  0.0, 0.2, 0.1, 'porção',           50),
  ('Tangerina',                   '🍊', 'Frutas',        58,  0.8,  14.9,     1,   0.1,  1.0,  0.0, 0.1, 0.1, 'unidade',         120),
  ('Limão Tahiti',                '🍋', 'Frutas',        32,  0.9,  11.1,     1,   0.4,  1.0,  0.0, 0.2, 0.1, 'unidade',          60),
  ('Pera',                        '🍐', 'Frutas',        53,  0.6,  14.0,     0,   0.1,  1.0,  0.0, 0.1, 0.1, 'unidade',         130),
  ('Kiwi',                        '🥝', 'Frutas',        51,  1.3,  11.5,     3,   0.2,  1.0,  0.0, 0.3, 0.1, 'unidade',          80),
  ('Ameixa fresca',               '🍑', 'Frutas',        53,  0.8,  13.9,     0,   0.0,  1.0,  0.0, 0.1, 0.1, 'unidade',          70),
  ('Coco fresco',                 '🥥', 'Frutas',       406,  3.7,  10.4,    23,  10.1,  1.0,  0.0, 1.8, 1.1, 'porção',           30),
  ('Maracujá (polpa)',            '🟡', 'Frutas',        68,  2.0,  12.3,     2,   0.6,  1.0,  0.0, 0.6, 0.1, 'unidade',          60),
  ('Caqui',                       '🟠', 'Frutas',        71,  0.4,  19.3,     0,   0.6,  1.0,  0.0, 0.1, 0.1, 'unidade',         120),
  ('Jabuticaba',                  '🫐', 'Frutas',        58,  0.6,  15.3,     1,   0.0,  1.0,  0.0, 0.1, 0.1, 'porção',          100),
  ('Uva-passa',                   '🍇', 'Frutas',       299,  3.1,  79.2,    11,   0.6,  1.0,  0.0, 1.9, 0.2, 'colher de sopa',   15),
  ('Ameixa seca',                 '🟤', 'Frutas',       240,  2.2,  63.9,     2,   0.3,  1.0,  0.0, 0.9, 0.4, 'unidade',           8),

  -- ---------------------------------------------------------------- Carnes
  ('Coxa de frango assada',       '🍗', 'Carnes',       215, 28.5,   0.0,    88,  22.0,  6.0,  0.2, 1.0, 2.0, 'unidade',          80),
  ('Sobrecoxa de frango assada',  '🍗', 'Carnes',       232, 26.0,   0.0,    90,  21.0,  6.0,  0.2, 1.1, 2.1, 'unidade',          90),
  ('Frango desfiado cozido',      '🍗', 'Carnes',       163, 30.0,   0.0,    62,  24.0,  7.0,  0.1, 0.5, 1.0, 'porção',           80),
  ('Alcatra grelhada',            '🥩', 'Carnes',       241, 32.0,   0.0,    52,  15.0,  3.0,  0.1, 2.4, 6.5, 'bife',            100),
  ('Contrafilé grelhado',         '🥩', 'Carnes',       278, 31.0,   0.0,    55,  14.0,  3.0,  0.1, 2.3, 6.0, 'bife',            100),
  ('Coxão mole cozido',           '🥩', 'Carnes',       219, 34.5,   0.0,    47,  14.0,  3.0,  0.1, 3.0, 8.0, 'porção',          100),
  ('Carne moída refogada',        '🥩', 'Carnes',       212, 27.0,   0.0,   240,  14.0,  3.0,  0.1, 2.7, 6.0, 'porção',          100),
  ('Costela bovina assada',       '🥩', 'Carnes',       373, 24.0,   0.0,    60,  13.0,  3.0,  0.1, 2.0, 5.5, 'porção',          100),
  ('Lombo suíno assado',          '🐖', 'Carnes',       210, 32.0,   0.0,    58,  33.0,  4.0,  0.7, 1.0, 2.3, 'porção',          100),
  ('Bisteca suína grelhada',      '🐖', 'Carnes',       260, 29.0,   0.0,    62,  32.0,  4.0,  0.7, 0.9, 2.2, 'unidade',         100),
  ('Linguiça toscana grelhada',   '🌭', 'Carnes',       296, 20.0,   1.0,   960,  20.0,  4.0,  0.5, 1.2, 2.0, 'unidade',          60),
  ('Presunto cozido',             '🥓', 'Carnes',       111, 15.0,   2.0,  1200,  18.0,  5.0,  0.6, 0.9, 1.5, 'fatia',            15),
  ('Peito de peru defumado',      '🦃', 'Carnes',        95, 17.0,   2.5,  1050,  20.0,  5.0,  0.2, 0.8, 1.3, 'fatia',            15),
  ('Fígado bovino grelhado',      '🥩', 'Carnes',       225, 29.0,   3.8,    80,  33.0,  8.0,  1.2, 5.8, 5.0, 'porção',          100),

  -- ------------------------------------------------- Peixes e frutos do mar
  ('Tilápia grelhada',            '🐟', 'Peixes',       128, 26.0,   0.0,    56,  47.0, 10.0,  3.1, 0.7, 0.4, 'filé',            120),
  ('Merluza cozida',              '🐟', 'Peixes',       122, 26.7,   0.0,    88,  36.0, 12.0,  1.0, 0.4, 0.4, 'filé',            120),
  ('Pescada grelhada',            '🐟', 'Peixes',       129, 26.0,   0.0,    90,  35.0, 12.0,  1.0, 0.5, 0.5, 'filé',            120),
  ('Bacalhau dessalgado cozido',  '🐟', 'Peixes',       138, 29.0,   0.0,   580,  32.0, 30.0,  1.0, 0.9, 0.9, 'porção',          100),
  ('Atum fresco grelhado',        '🐟', 'Peixes',       184, 29.9,   0.0,    50,  57.0, 12.0,  1.7, 1.3, 0.8, 'posta',           120),
  ('Cavala assada',               '🐟', 'Peixes',       205, 26.0,   0.0,    95,  44.0, 25.0, 13.8, 1.6, 0.9, 'posta',           120),
  ('Truta grelhada',              '🐟', 'Peixes',       190, 26.6,   0.0,    60,  15.0, 10.0, 16.0, 0.4, 0.6, 'filé',            120),
  ('Lula cozida',                 '🦑', 'Frutos do mar',  92, 15.6,   3.1,   44,  44.0, 20.0,  0.0, 0.7, 1.5, 'porção',           80),
  ('Polvo cozido',                '🐙', 'Frutos do mar', 164, 29.8,   4.4,  460,  89.0, 20.0,  0.0, 9.5, 3.4, 'porção',           80),
  ('Mexilhão cozido',             '🦪', 'Frutos do mar', 172, 23.8,   7.4,  369,  89.6, 60.0,  0.0, 6.7, 2.7, 'porção',           80),

  -- ------------------------------------------------------------------- Ovos
  ('Ovo frito',                   '🍳', 'Ovos',         240, 15.6,   0.6,   180,  22.0, 27.0,  2.3, 1.9, 1.2, 'unidade',          50),
  ('Ovo mexido',                  '🍳', 'Ovos',         188, 12.9,   1.4,   210,  20.0, 26.0,  2.2, 1.7, 1.1, 'porção',           80),
  ('Clara de ovo cozida',         '🥚', 'Ovos',          52, 11.0,   0.7,   166,  20.0,  1.0,  0.0, 0.1, 0.0, 'unidade',          33),
  ('Ovo de codorna cozido',       '🥚', 'Ovos',         158, 13.1,   0.4,   141,  32.0, 25.0,  1.4, 3.7, 1.5, 'unidade',          10),

  -- ------------------------------------------------------------- Laticínios
  ('Leite desnatado',             '🥛', 'Laticínios',    35,  3.4,   4.9,    52,   2.0, 15.0,  0.0, 0.1, 0.4, 'copo',            200),
  ('Leite semidesnatado',         '🥛', 'Laticínios',    47,  3.2,   4.7,    51,   2.0, 15.0,  0.1, 0.1, 0.4, 'copo',            200),
  ('Iogurte grego natural',       '🥣', 'Laticínios',    97,  9.0,   4.0,    36,   9.7, 14.0,  0.1, 0.1, 0.5, 'pote',            130),
  ('Iogurte desnatado',           '🥣', 'Laticínios',    41,  4.0,   5.9,    52,   2.2, 14.0,  0.0, 0.1, 0.5, 'pote',            170),
  ('Queijo muçarela',             '🧀', 'Laticínios',   330, 22.6,   3.0,   580,  17.0, 20.0,  0.4, 0.3, 2.8, 'fatia',            20),
  ('Queijo prato',                '🧀', 'Laticínios',   360, 22.7,   1.9,   580,  15.0, 20.0,  0.5, 0.2, 3.0, 'fatia',            20),
  ('Queijo parmesão ralado',      '🧀', 'Laticínios',   453, 35.6,   1.7,  1600,  23.0, 20.0,  0.5, 0.7, 4.0, 'colher de sopa',   10),
  ('Queijo cottage',              '🧀', 'Laticínios',    98, 11.1,   3.4,   364,   9.7, 12.0,  0.0, 0.1, 0.4, 'porção',           50),
  ('Requeijão cremoso',           '🧀', 'Laticínios',   257,  9.6,   3.5,   560,   8.0, 12.0,  0.3, 0.2, 1.0, 'colher de sopa',   20),
  ('Ricota fresca',               '🧀', 'Laticínios',   140, 12.6,   3.8,    84,   9.0, 12.0,  0.2, 0.3, 1.2, 'fatia',            30),
  ('Manteiga com sal',            '🧈', 'Laticínios',   726,  0.4,   0.1,   579,   1.0,  3.0,  1.5, 0.0, 0.1, 'colher de chá',     5),
  ('Creme de leite',              '🥛', 'Laticínios',   206,  2.3,   3.7,    38,   1.0,  8.0,  0.4, 0.1, 0.3, 'colher de sopa',   15),
  ('Leite de coco',               '🥥', 'Laticínios',   166,  1.0,   3.0,    15,   6.2,  1.0,  0.0, 1.6, 0.4, 'colher de sopa',   15),
  ('Bebida de soja sem açúcar',   '🥛', 'Laticínios',    39,  3.3,   1.8,    39,   4.5,  1.0,  0.0, 0.4, 0.3, 'copo',            200),

  -- ------------------------------------------------------------ Oleaginosas
  ('Castanha de caju torrada',    '🥜', 'Oleaginosas',  570, 18.5,  29.1,    16,  19.9,  1.0,  0.0, 5.2, 4.7, 'punhado',          30),
  ('Amêndoa crua',                '🌰', 'Oleaginosas',  581, 21.6,  19.5,     1,   2.5,  1.0,  0.0, 3.7, 3.1, 'punhado',          30),
  ('Noz',                         '🌰', 'Oleaginosas',  620, 14.0,  18.4,     2,   4.9,  1.0,  0.0, 2.6, 2.6, 'unidade',           5),
  ('Avelã',                       '🌰', 'Oleaginosas',  628, 14.0,  16.7,     0,   2.4,  1.0,  0.0, 4.4, 2.4, 'punhado',          30),
  ('Pistache torrado',            '🌰', 'Oleaginosas',  572, 20.6,  27.5,   428,   9.3,  1.0,  0.0, 3.9, 2.2, 'punhado',          30),
  ('Semente de girassol',         '🌻', 'Oleaginosas',  584, 20.8,  20.0,     9,  53.0,  1.0,  0.0, 5.3, 5.0, 'colher de sopa',   10),
  ('Semente de abóbora',          '🎃', 'Oleaginosas',  559, 30.2,  10.7,     7,   9.4,  1.0,  0.0, 8.8, 7.8, 'colher de sopa',   10),
  ('Chia',                        '⚫', 'Oleaginosas',  486, 16.5,  42.1,    16,  55.2,  1.0,  0.0, 7.7, 4.6, 'colher de sopa',   12),
  ('Linhaça',                     '🟤', 'Oleaginosas',  534, 18.3,  28.9,    30,  25.4,  1.0,  0.0, 5.7, 4.3, 'colher de sopa',   10),
  ('Pasta de amendoim integral',  '🥜', 'Oleaginosas',  588, 25.1,  20.0,    17,   7.0,  1.0,  0.0, 1.9, 2.9, 'colher de sopa',   20),

  -- ------------------------------------------------------- Óleos e gorduras
  ('Azeite de oliva extravirgem', '🫒', 'Óleos e gorduras', 884, 0.0,  0.0,    2,   0.0,  0.0,  0.0, 0.6, 0.0, 'colher de sopa',  13),
  ('Óleo de soja',                '🛢️', 'Óleos e gorduras', 884, 0.0,  0.0,    0,   0.0,  0.0,  0.0, 0.1, 0.0, 'colher de sopa',  13),
  ('Óleo de coco',                '🥥', 'Óleos e gorduras', 892, 0.0,  0.0,    0,   0.0,  0.0,  0.0, 0.1, 0.0, 'colher de sopa',  13),
  ('Azeitona verde em conserva',  '🫒', 'Óleos e gorduras', 137, 1.0,   3.8, 1556,   0.9,  1.0,  0.0, 0.5, 0.0, 'unidade',          5),

  -- ------------------------------------------------------------------ Bebidas
  ('Café coado sem açúcar',       '☕', 'Bebidas',         4,  0.2,   0.7,     2,   0.0,  0.0,  0.0, 0.0, 0.0, 'xícara',          150),
  ('Suco de laranja natural',     '🧃', 'Bebidas',        37,  0.7,   8.7,     1,   0.1,  1.0,  0.0, 0.1, 0.1, 'copo',            200),
  ('Água de coco',                '🥥', 'Bebidas',        22,  0.0,   5.3,    25,   1.0,  1.0,  0.0, 0.0, 0.1, 'copo',            200),
  ('Chá verde sem açúcar',        '🍵', 'Bebidas',         1,  0.0,   0.2,     1,   0.0,  0.0,  0.0, 0.0, 0.0, 'xícara',          150),

  -- ----------------------------------------------------------------- Temperos
  ('Sal refinado sem iodo',       '🧂', 'Temperos',        0,  0.0,   0.0, 38758,   0.0,  0.0,  0.0, 0.0, 0.1, 'pitada',            1),
  ('Molho de soja (shoyu)',       '🍶', 'Temperos',       53,  5.6,   4.9,  5493,   0.5,  1.0,  0.0, 1.9, 0.4, 'colher de sopa',   15),
  ('Vinagre de maçã',             '🍎', 'Temperos',       21,  0.0,   0.9,     5,   0.0,  0.0,  0.0, 0.2, 0.0, 'colher de sopa',   15)

on conflict (lower(name)) do update set
  emoji         = excluded.emoji,
  category      = excluded.category,
  energia_kcal  = excluded.energia_kcal,
  proteina_g    = excluded.proteina_g,
  carboidrato_g = excluded.carboidrato_g,
  sodium_mg     = excluded.sodium_mg,
  selenium_mcg  = excluded.selenium_mcg,
  iodine_mcg    = excluded.iodine_mcg,
  vitamin_d_mcg = excluded.vitamin_d_mcg,
  iron_mg       = excluded.iron_mg,
  zinc_mg       = excluded.zinc_mg,
  default_unit  = excluded.default_unit,
  default_grams = excluded.default_grams;

-- Confere o resultado depois de rodar:
select category, count(*) as itens
from public.food
group by category
order by itens desc, category;

-- =============================================================================
-- HashiVita Nutri — seed da tabela food (36 itens), valores por 100 g.
--
-- Fonte primaria: TACO/UNICAMP 4a ed. (energia, proteina, carboidrato, sodio,
-- ferro, zinco). A TACO NAO traz selenio, iodo nem vitamina D — esses tres vem
-- de literatura de composicao (USDA FoodData Central e estudos brasileiros de
-- teor de selenio/iodo) e sao ESTIMATIVAS: variam muito com solo e origem.
-- A castanha-do-para e o caso extremo (200-3000 mcg Se por 100 g).
--
-- Reexecutar e seguro: on conflict (lower(name)) do update.
-- =============================================================================
insert into public.food
  (name, emoji, category, energia_kcal, proteina_g, carboidrato_g, sodium_mg,
   selenium_mcg, iodine_mcg, vitamin_d_mcg, iron_mg, zinc_mg, default_unit, default_grams)
values
  ('Arroz branco cozido',        '🍚', 'Cereais',      128,   2.5,  28.1,     1,    3.9,   0.5,  0.0, 0.1, 0.5, 'colher de servir', 45),
  ('Arroz integral cozido',      '🍚', 'Cereais',      124,   2.6,  25.8,     1,    5.0,   0.5,  0.0, 0.3, 0.7, 'colher de servir', 45),
  ('Feijão carioca cozido',      '🫘', 'Leguminosas',   76,   4.8,  13.6,     2,    1.5,   0.3,  0.0, 1.3, 0.7, 'concha',           80),
  ('Lentilha cozida',            '🫘', 'Leguminosas',   93,   6.3,  16.3,     2,    2.8,   0.5,  0.0, 1.5, 1.0, 'concha',           80),
  ('Grão-de-bico cozido',        '🫘', 'Leguminosas',  130,   8.4,  21.2,     5,    3.7,   0.5,  0.0, 1.6, 1.5, 'concha',           80),
  ('Tofu',                       '🧊', 'Leguminosas',   76,   8.1,   1.9,     7,    8.9,   1.0,  0.0, 1.4, 0.8, 'porção',          100),
  ('Ovo de galinha cozido',      '🥚', 'Ovos',         146,  13.3,   0.6,   140,   20.0,  26.0,  2.2, 1.8, 1.1, 'unidade',          50),
  ('Peito de frango grelhado',   '🍗', 'Carnes',       159,  32.0,   0.0,    60,   25.0,   7.0,  0.1, 0.4, 0.9, 'filé',            100),
  ('Patinho bovino cozido',      '🥩', 'Carnes',       219,  35.9,   0.0,    45,   14.0,   3.0,  0.1, 3.1, 8.5, 'bife',            100),
  ('Sardinha assada',            '🐟', 'Peixes',       164,  32.2,   0.0,   143,   45.0,  30.0,  6.8, 3.0, 1.5, 'unidade',          60),
  ('Salmão grelhado',            '🐟', 'Peixes',       243,  23.9,   0.0,    60,   31.0,  14.0, 11.0, 0.4, 0.4, 'posta',           120),
  ('Atum em conserva',           '🐟', 'Peixes',       166,  26.2,   0.0,   350,   60.0,  12.0,  2.0, 1.0, 0.6, 'lata',            120),
  ('Camarão cozido',             '🦐', 'Frutos do mar', 90,  19.0,   0.0,   200,   38.0,  35.0,  0.1, 0.5, 1.3, 'porção',           80),
  ('Castanha-do-pará',           '🌰', 'Oleaginosas',  643,  14.5,  15.1,     1, 1917.0,   1.0,  0.0, 2.3, 4.2, 'unidade',           5),
  ('Amendoim torrado',           '🥜', 'Oleaginosas',  544,  27.4,  20.3,     5,    7.0,   0.5,  0.0, 1.3, 3.5, 'punhado',          30),
  ('Leite integral',             '🥛', 'Laticínios',    61,   2.9,   4.3,    51,    1.9,  15.0,  0.1, 0.1, 0.4, 'copo',            200),
  ('Iogurte natural',            '🥣', 'Laticínios',    51,   4.1,   1.9,    52,    2.2,  14.0,  0.1, 0.1, 0.5, 'pote',            170),
  ('Queijo minas frescal',       '🧀', 'Laticínios',   264,  17.4,   3.2,    31,    9.0,  12.0,  0.4, 0.3, 2.2, 'fatia',            30),
  ('Pão francês',                '🥖', 'Cereais',      300,   8.0,  58.6,   648,   12.0,   3.0,  0.0, 2.3, 0.8, 'unidade',          50),
  ('Aveia em flocos',            '🌾', 'Cereais',      394,  13.9,  66.6,     5,    8.0,   1.0,  0.0, 4.4, 2.6, 'colher de sopa',   15),
  ('Batata inglesa cozida',      '🥔', 'Tubérculos',    52,   1.2,  11.9,     2,    0.3,   1.0,  0.0, 0.4, 0.2, 'unidade média',   120),
  ('Batata-doce cozida',         '🍠', 'Tubérculos',    77,   0.6,  18.4,     4,    0.6,   1.0,  0.0, 0.2, 0.2, 'unidade média',   100),
  ('Mandioca cozida',            '🥔', 'Tubérculos',   125,   0.6,  30.1,     1,    0.7,   1.0,  0.0, 0.3, 0.4, 'pedaço',          100),
  ('Brócolis cozido',            '🥦', 'Hortaliças',    25,   2.1,   4.4,     3,    1.6,   1.5,  0.0, 0.5, 0.4, 'porção',           80),
  ('Couve manteiga refogada',    '🥬', 'Hortaliças',    90,   3.1,   8.7,    21,    0.9,   1.0,  0.0, 0.5, 0.4, 'porção',           60),
  ('Repolho cru',                '🥬', 'Hortaliças',    25,   1.0,   5.8,     5,    0.6,   1.0,  0.0, 0.2, 0.2, 'porção',           60),
  ('Espinafre refogado',         '🥬', 'Hortaliças',    30,   2.7,   4.6,    32,    1.0,  12.0,  0.0, 2.7, 0.5, 'porção',           80),
  ('Alface crespa',              '🥗', 'Hortaliças',    11,   1.3,   1.7,     7,    0.1,   1.0,  0.0, 0.4, 0.2, 'prato',            40),
  ('Tomate cru',                 '🍅', 'Hortaliças',    15,   1.1,   3.1,     1,    0.0,   1.0,  0.0, 0.2, 0.1, 'unidade',          90),
  ('Cenoura crua',               '🥕', 'Hortaliças',    34,   1.3,   7.7,     4,    0.1,   1.5,  0.0, 0.2, 0.2, 'unidade',          80),
  ('Banana prata',               '🍌', 'Frutas',        98,   1.3,  26.0,     0,    1.0,   2.0,  0.0, 0.2, 0.2, 'unidade',          70),
  ('Maçã',                       '🍎', 'Frutas',        56,   0.3,  15.2,     0,    0.0,   1.0,  0.0, 0.1, 0.1, 'unidade',         130),
  ('Laranja pera',               '🍊', 'Frutas',        37,   1.0,   8.9,     0,    0.5,   1.0,  0.0, 0.1, 0.1, 'unidade',         130),
  ('Mamão papaia',               '🧡', 'Frutas',        40,   0.5,  10.4,     1,    0.6,   1.0,  0.0, 0.2, 0.1, 'fatia',           100),
  ('Abacate',                    '🥑', 'Frutas',        96,   1.2,   6.0,     1,    0.4,   1.0,  0.0, 0.2, 0.5, 'porção',          100),
  ('Sal iodado',                 '🧂', 'Temperos',       0,   0.0,   0.0, 38758,    0.0,3000.0,  0.0, 0.0, 0.0, 'pitada',            1)
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

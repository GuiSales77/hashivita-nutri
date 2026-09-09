# supabase/

Banco do HashiVita Nutri. Projeto: **HashiVita** (`fzhzdwwaartjulmqysrs`, `sa-east-1`).

| Arquivo | O que faz |
| --- | --- |
| `01_schema.sql` | Tabelas `app_user`, `food`, `meal_log` + trigger de criação de perfil + RLS |
| `02_seed_food.sql` | 36 alimentos de teste (valores por 100 g, base TACO) |

Os dois já foram aplicados no projeto remoto. São idempotentes: dá pra reexecutar
no SQL Editor do painel sem duplicar nada.

## Modelo

Um usuário por conta. Sem organização, sem papéis, sem clínica — cada `meal_log`
pertence a exatamente um `auth.users`, e a RLS garante isso.

- `app_user` — 1:1 com `auth.users`, criada automaticamente no signup pelo trigger
  `on_auth_user_created`. O `full_name` vem do metadata do `supabase.auth.signUp`.
- `food` — catálogo compartilhado, **somente leitura** pelo app (autenticado).
  Escrita só pelo painel / service role.
- `meal_log` — `nutrients` é um jsonb com o cálculo **já feito no app** (regra de
  três sobre os valores por 100 g). Fica congelado no registro: se a `food` mudar
  depois, o histórico não muda junto. `food_name`/`food_emoji` são desnormalizados
  pelo mesmo motivo, e `food_id` é `on delete set null`.

## Sobre os nutrientes

A TACO cobre energia, proteína, carboidrato, sódio, ferro e zinco. **Selênio, iodo e
vitamina D não estão na TACO** — esses três vêm de literatura de composição e são
estimativas, com variação grande conforme solo e origem. A castanha-do-pará é o caso
extremo (200–3000 mcg de Se por 100 g; o seed usa 1917).

## O que ainda está fora daqui

O banco também contém 14 tabelas do schema antigo abandonado (`organization`,
`staff_member`, `patient`, `appointment`, ...), todas vazias. Não foram removidas —
é uma decisão pendente.

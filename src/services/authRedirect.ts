/**
 * URL para onde o Supabase manda o usuário depois que ele clica no link de
 * confirmação de e-mail.
 *
 * É uma página HTTPS intermediária (docs/auth-callback.html, servida pelo GitHub
 * Pages), e não o scheme do app direto. Motivo: um link `hashivitanutri://` não
 * abre nada quando o e-mail é aberto no navegador do desktop — o usuário via só
 * uma aba em branco. A página HTTPS abre em qualquer lugar, repassa a query e o
 * fragmento intactos para `hashivitanutri://auth-callback` e ainda oferece um
 * botão manual se o app não abrir sozinho.
 *
 * ⚠️ Esta URL precisa estar na allow-list de Redirect URLs do painel do Supabase.
 * Se não estiver, o Supabase ignora silenciosamente e usa o Site URL no lugar —
 * sem erro nenhum, o link só leva para o lugar errado.
 */
export const AUTH_CALLBACK_URL = 'https://guisales77.github.io/hashivita-nutri/auth-callback.html';

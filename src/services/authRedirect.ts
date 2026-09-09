import * as Linking from 'expo-linking';

/**
 * URL para onde o Supabase manda o usuário depois que ele clica no link de
 * confirmação de e-mail.
 *
 * Sem passar isso no signUp, o Supabase usa o "Site URL" configurado no painel —
 * que por padrão é http://localhost:3000. O usuário confirmaria o e-mail e cairia
 * numa página quebrada, sem caminho de volta pro app.
 *
 * `createURL` resolve para o scheme do app (`hashivitanutri://auth-callback`) num
 * build real, e para `exp://.../--/auth-callback` dentro do Expo Go. Os DOIS
 * precisam estar na allow-list de Redirect URLs do painel do Supabase, senão o
 * link volta pro Site URL em vez de abrir o app.
 */
export const AUTH_CALLBACK_URL = Linking.createURL('/auth-callback');

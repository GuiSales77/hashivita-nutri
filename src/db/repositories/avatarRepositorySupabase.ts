import { supabase } from '../../services/supabaseClient';
import { base64ToBytes } from '../../services/base64';

const BUCKET = 'avatars';

/**
 * Envia a foto para o bucket `avatars` e grava a URL pública em app_user.
 *
 * O arquivo é sempre `{user_id}.png` — é isso que a policy de Storage confere,
 * garantindo que ninguém sobrescreve o avatar de outro usuário. Como o nome é
 * fixo por usuário, o upload usa `upsert` e a URL guardada leva um
 * `?v=timestamp`: sem isso a foto antiga continuaria aparecendo, servida do
 * cache do CDN e do <Image>.
 */
export async function uploadAvatar(userId: string, base64: string, mimeType: string): Promise<string> {
  const path = `${userId}.png`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, base64ToBytes(base64), { contentType: mimeType, upsert: true });
  if (uploadError) throw new Error(uploadError.message);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  const avatarUrl = `${data.publicUrl}?v=${Date.now()}`;

  const { error: updateError } = await supabase
    .from('app_user')
    .update({ avatar_url: avatarUrl })
    .eq('id', userId);
  if (updateError) throw new Error(updateError.message);

  return avatarUrl;
}

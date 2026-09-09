import * as SecureStore from 'expo-secure-store';

// expo-secure-store tem limite de 2048 bytes por chave e não aceita todos os
// caracteres em nomes de chave — o SDK do Supabase já usa chaves simples,
// então isso funciona direto, sem precisar de adaptação extra de nome.
export const secureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

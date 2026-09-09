const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

const LOOKUP = (() => {
  const table = new Uint8Array(256);
  for (let i = 0; i < ALPHABET.length; i++) table[ALPHABET.charCodeAt(i)] = i;
  return table;
})();

/**
 * Decodifica base64 para bytes.
 *
 * O React Native não garante `atob` global nem `Blob.arrayBuffer()`, e o
 * `fetch(uri).arrayBuffer()` também não é confiável aqui — por isso o upload de
 * avatar pede `base64: true` ao ImagePicker e converte com esta função, sem
 * depender de nenhuma biblioteca extra.
 */
export function base64ToBytes(base64: string): Uint8Array {
  const clean = base64.replace(/[^A-Za-z0-9+/]/g, '');
  const bytesLength = Math.floor((clean.length * 3) / 4);
  const bytes = new Uint8Array(bytesLength);

  let byteIndex = 0;
  for (let i = 0; i < clean.length; i += 4) {
    const c0 = LOOKUP[clean.charCodeAt(i)];
    const c1 = LOOKUP[clean.charCodeAt(i + 1)];
    const c2 = LOOKUP[clean.charCodeAt(i + 2)];
    const c3 = LOOKUP[clean.charCodeAt(i + 3)];

    if (byteIndex < bytesLength) bytes[byteIndex++] = (c0 << 2) | (c1 >> 4);
    if (byteIndex < bytesLength) bytes[byteIndex++] = ((c1 & 15) << 4) | (c2 >> 2);
    if (byteIndex < bytesLength) bytes[byteIndex++] = ((c2 & 3) << 6) | c3;
  }

  return bytes;
}

/**
 * Regra de senha única do app.
 *
 * Antes só o cadastro validava, e só o comprimento mínimo. Cadastro e
 * redefinição precisam concordar: se a redefinição fosse mais rígida, o usuário
 * criaria uma senha no cadastro que a própria tela de troca recusaria depois.
 */
export const SENHA_MIN_CARACTERES = 8;

export type ResultadoSenha = { ok: true } | { ok: false; titulo: string; mensagem: string };

export function validarSenha(senha: string, confirmacao?: string): ResultadoSenha {
  if (senha.length < SENHA_MIN_CARACTERES) {
    return {
      ok: false,
      titulo: 'Senha fraca',
      mensagem: `Use pelo menos ${SENHA_MIN_CARACTERES} caracteres.`,
    };
  }
  if (!/\d/.test(senha)) {
    return {
      ok: false,
      titulo: 'Senha fraca',
      mensagem: 'Inclua pelo menos um número.',
    };
  }
  if (confirmacao !== undefined && senha !== confirmacao) {
    return {
      ok: false,
      titulo: 'As senhas não coincidem',
      mensagem: 'Confira e tente novamente.',
    };
  }
  return { ok: true };
}

/** Formato de e-mail — checagem simples, só para evitar erro de digitação óbvio. */
export function emailParecaValido(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

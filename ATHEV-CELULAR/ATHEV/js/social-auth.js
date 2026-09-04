export async function startSocialAuth(provider, { client, url, key, origin, fetcher = fetch }) {
  if (!['google', 'apple'].includes(provider)) throw new Error('Provedor de login inválido.');
  const response = await fetcher(`${url}/auth/v1/settings`, { headers: { apikey: key } });
  if (!response.ok) throw new Error('Não foi possível verificar o login. Tente novamente em instantes.');
  const settings = await response.json();
  if (!settings.external?.[provider]) throw new Error(`O login com ${provider === 'google' ? 'Google' : 'Apple'} ainda não está disponível. Use e-mail e senha por enquanto.`);
  // Always finish OAuth on the canonical production site; preview deployments may expire.
  const redirectTo = 'https://athev-gym.vercel.app/';
  const { error } = await client.auth.signInWithOAuth({ provider, options: { redirectTo } });
  if (error) throw new Error('Não foi possível iniciar o login. Tente novamente em instantes.');
}

export function socialCallbackError(hash, search) {
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  const query = new URLSearchParams(search);
  const error = params.get('error') || query.get('error');
  if (!error) return null;
  return error === 'access_denied' ? 'O login foi cancelado ou não foi autorizado. Você pode tentar novamente.' : 'Não foi possível concluir o login social. Tente novamente.';
}

export function socialButtons() {
  const google = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.9-1.75 2.98-4.33 2.98-7.36Z"/><path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.62-2.41l-3.24-2.51c-.9.6-2.05.97-3.38.97-2.6 0-4.8-1.76-5.59-4.12H3.07v2.59A10 10 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.41 13.93a6 6 0 0 1 0-3.86V7.48H3.07a10 10 0 0 0 0 9.04l3.34-2.59Z"/><path fill="#EA4335" d="M12 5.95c1.47 0 2.79.51 3.83 1.51L18.7 4.6A9.6 9.6 0 0 0 12 2a10 10 0 0 0-8.93 5.48l3.34 2.59C7.2 7.71 9.4 5.95 12 5.95Z"/></svg>';
  const apple = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M17.05 12.54c.03 3.24 2.84 4.32 2.87 4.33-.02.08-.45 1.54-1.48 3.05-.9 1.3-1.83 2.6-3.3 2.62-1.44.03-1.9-.85-3.55-.85-1.64 0-2.15.82-3.52.88-1.42.05-2.5-1.41-3.4-2.7-1.85-2.68-3.26-7.57-1.36-10.87a5.3 5.3 0 0 1 4.47-2.72c1.4-.03 2.72.94 3.56.94.83 0 2.4-1.16 4.05-.99.69.03 2.62.28 3.86 2.1-.1.07-2.3 1.35-2.2 4.21ZM14.34 4.5c.75-.91 1.26-2.17 1.12-3.43-1.08.04-2.39.72-3.16 1.63-.7.8-1.31 2.09-1.15 3.32 1.2.09 2.43-.62 3.19-1.52Z"/></svg>';
  return `<div class="social-auth"><div class="social-divider">ou continue com</div><div class="social-buttons"><button type="button" class="social-button social-google" data-action="social-login" data-id="google">${google}<span>Continuar com Google</span></button><button type="button" class="social-button social-apple" data-action="social-login" data-id="apple">${apple}<span>Continuar com Apple</span></button></div><p class="tiny muted">Seu primeiro acesso cria uma conta. Complete seu perfil depois de entrar.</p></div>`;
}

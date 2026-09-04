import { createClient } from '@supabase/supabase-js';
import { sessionFetch } from './session-fetch.js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
if (!url || !key) throw new Error('Configure VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY no ambiente do site.');

// The publishable key is public. Database authorization is enforced by RLS.
const storage = {
  getItem: key => sessionStorage.getItem(key) ?? localStorage.getItem(key),
  setItem: (key, value) => {
    const persistent = localStorage.getItem('athev-remember') !== 'false';
    (persistent ? sessionStorage : localStorage).removeItem(key);
    (persistent ? localStorage : sessionStorage).setItem(key, value);
  },
  removeItem: key => { localStorage.removeItem(key); sessionStorage.removeItem(key); },
};
export const supabase = createClient(url, key, {
  global: { fetch: sessionFetch(url) },
  auth: { storage, storageKey: 'athev-auth', persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});

export async function result(query) {
  const { data, error } = await query;
  if (error) {
    const message = ['PGRST205','42P01','PGRST202'].includes(error.code) ? 'A configuração do banco do ATHEV ainda precisa ser concluída. A migração do Supabase está pendente.'
      : error.code === '42501' ? 'Você não tem permissão para acessar ou alterar este registro.'
      : error.code === '23505' ? 'Este registro já existe. Atualize a página antes de continuar.'
      : error.code === 'PGRST303' && error.message === 'JWT issued at future' ? 'O servidor ainda está sincronizando sua sessão. Aguarde alguns segundos e tente entrar novamente.'
      : error.message;
    throw new Error(message);
  }
  return data;
}

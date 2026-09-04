# ATHEV — nova interface conectada ao Supabase

O comando principal `npm run dev`, executado na raiz do repositório, agora abre esta interface na porta 8000. `npm run build` gera esta versão em `dist`, inclusive as imagens. O React anterior está disponível em `npm run dev:legacy` e `npm run build:legacy`.

## Configuração

Usa `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` do `.env` da raiz. Nunca coloque uma chave `service_role` no frontend. O projeto identificado no ambiente é `yhbznenzvqrqyzgxikwg`.

**Aplicada em 03/09/2026:** `supabase/migrations/20260903224735_mobile_supabase_integration.sql`, após aprovação explícita do usuário. Confirmadas as duas tabelas com RLS, três colunas adicionais e duas funções com SECURITY INVOKER. Acesso anônimo às novas tabelas está bloqueado.

Cadastre as URLs de retorno do aplicativo (localhost e domínio publicado) na configuração de URLs permitidas do Supabase Auth para confirmação de cadastro e recuperação de senha. Nenhuma configuração remota de Auth foi alterada. O envio desses e-mails depende da configuração de e-mail do projeto.

## Dados

- Login, cadastro, sessão e recuperação: Supabase Auth.
- Perfis, permissões, exercícios, fichas, séries e histórico: tabelas existentes.
- Medidas, agenda, alimentação, fotos, preferências, favoritos e sessões em andamento: `athev_records`, com regras de acesso por usuário.
- Unidades, planos e aulas: `athev_catalog`, escrita restrita à administração.
- Fichas e conclusão de treino: funções transacionais para não salvar metade de uma ficha ou duplicar o mesmo treino.
- Não importa usuários, senhas, planos ou histórico fictício do SQLite. O arquivo local permanece preservado.

## Limites atuais

Reserva de aulas, contratação/cancelamento de planos, QR/catraca, criação/bloqueio administrativo de contas e exclusão de conta precisam de fluxos adicionais. A interface não executa esses atos: retorna mensagem explícita. A exclusão deve ser solicitada à administração. Pagamentos não processam cobranças; IA generativa não foi conectada. Avisos administrativos são gravados na central interna.

As regras existentes do projeto permitem algumas leituras amplas de perfis e fichas; esta migração não as altera. As novas tabelas habilitam RLS e restringem o acesso. Professor só obtém novos registros privados de acompanhamento quando há um vínculo aceito em `trainer_chat_requests`. Antes de liberar o site publicamente, revisar também as políticas antigas do projeto.

## Verificação

`npm run test:mobile` verifica UUIDs e cálculos. O teste de templates existente verifica 70 renderizações. `npm run build` valida o bundle. A migração foi aplicada e sua estrutura/permissões foram verificadas no banco remoto. O teste transacional de escrita com rollback não pôde executar porque a ferramenta SQL oferece uma transação somente de leitura. O teste completo de gravação e de isolamento com dois usuários ainda está pendente; não foram criados registros fictícios nesse teste.

Documentação consultada: [Supabase Auth](https://supabase.com/docs/reference/javascript/auth-signinwithpassword), [recuperação por e-mail](https://supabase.com/docs/reference/javascript/auth-resetpasswordforemail), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).

O advisor remoto, consultado antes de qualquer migração, também reportou avisos preexistentes: [search_path mutável em update_updated_at_column](https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable), [funções SECURITY DEFINER executáveis por anon](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable), [execução por authenticated](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable) e [proteção contra senhas vazadas desativada](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection). Nenhuma dessas configurações foi alterada.

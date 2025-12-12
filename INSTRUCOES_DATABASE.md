# Instruções para Configurar o Database

## Status Atual

✅ **Servidor de Desenvolvimento:** Rodando em http://localhost:8085
✅ **Código TypeScript:** Sem erros de compilação
✅ **Componentes:** Todos criados e importados corretamente
⚠️ **Database:** Precisa executar o SQL para criar as tabelas

## Passo a Passo para Resolver

### 1. Abrir Supabase SQL Editor

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto VisionFit
3. No menu lateral, clique em **SQL Editor**

### 2. Executar o SQL de Criação das Tabelas

1. Abra o arquivo `create_all_tables.sql` (na raiz do projeto)
2. **Copie TODO o conteúdo** do arquivo
3. No Supabase SQL Editor, cole o SQL
4. Clique em **Run** (ou pressione Ctrl+Enter)

### 3. Verificar se as Tabelas Foram Criadas

Após executar o SQL, verifique se as tabelas foram criadas:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

Você deve ver estas 11 tabelas:
- exercises
- notifications
- profiles
- trainer_chat
- trainer_chat_requests
- user_goals
- user_roles
- workout_exercises
- workout_logs
- workout_plans
- workout_programs

### 4. Testar o App

1. O servidor já está rodando em http://localhost:8085
2. Abra o navegador e acesse o app
3. Faça login com sua conta
4. Teste as funcionalidades:
   - ✅ Perfil do usuário
   - ✅ Onboarding
   - ✅ Página Admin (se você for admin/master)
   - ✅ VisionTrainer (se você for trainer)
   - ✅ VisionNutri (se você for nutritionist)

## O Que Foi Criado/Modificado

### Componentes Criados
- `StudentDetailCard.tsx` - Card para exibir detalhes dos alunos
- `TrainerChat.tsx` - Chat em tempo real entre trainers e alunos

### Componentes Modificados
- `UserDetailCard.tsx` - Adicionado gerenciamento de treinos do usuário
- `AssignWorkoutModal.tsx` - Adicionado sistema de notificações
- `Admin.tsx` - Importado StudentDetailCard
- `VisionTrainer.tsx` - Importado StudentDetailCard
- `VisionNutri.tsx` - Importado StudentDetailCard

### Arquivos SQL Criados
- `create_all_tables.sql` - SQL completo para criar todas as tabelas
- `apply_notifications_chat.sql` - SQL específico para notificações e chat (não é mais necessário, use o create_all_tables.sql)

## Recursos Implementados

### Sistema de Notificações
Quando um treino é atribuído a um usuário, ele recebe uma notificação automática.

### Chat Trainer-Aluno
Sistema de chat em tempo real para comunicação entre trainers/nutritionists e alunos.

### Gerenciamento de Treinos
Admins podem:
- Ver todos os treinos de um usuário
- Remover treinos (soft delete com is_active=false)
- Atribuir novos treinos

### Cards de Alunos
Exibição completa dos dados dos alunos:
- Fotos (frente, costas, lateral esquerda, lateral direita)
- Dados corporais (peso, altura, idade)
- Objetivos fitness
- Nível de treinamento
- Programa atual

## Troubleshooting

### Se ainda tiver erros após executar o SQL:

1. **Verificar se o usuário tem as roles corretas:**
```sql
SELECT * FROM user_roles WHERE user_id = 'SEU_USER_ID';
```

2. **Adicionar role de master/admin manualmente:**
```sql
INSERT INTO user_roles (user_id, role)
VALUES ('SEU_USER_ID', 'master')
ON CONFLICT (user_id, role) DO NOTHING;
```

3. **Verificar RLS policies:**
As policies já estão criadas no SQL, mas se tiver problemas de acesso, verifique se estão ativas:
```sql
SELECT tablename, policyname
FROM pg_policies
WHERE schemaname = 'public';
```

## Próximos Passos

Após executar o SQL e verificar que tudo funciona:

1. Teste o fluxo completo de onboarding
2. Teste atribuir treinos aos usuários
3. Teste o sistema de notificações
4. Teste o chat entre trainer e aluno
5. Verifique se os admins conseguem gerenciar usuários

## Contato

Se encontrar algum erro específico, anote:
- A mensagem de erro completa
- Em qual tela/ação o erro ocorreu
- O que você estava tentando fazer

Isso ajudará a diagnosticar e resolver o problema rapidamente.

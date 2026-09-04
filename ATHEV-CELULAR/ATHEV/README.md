# Integração Supabase

Esta pasta agora é a interface principal do site. Leia [SUPABASE.md](SUPABASE.md) para configuração, migração pendente e limites atuais. Inicie pela raiz com `npm run dev`.

---

## Documentação da versão SQLite anterior

O conteúdo abaixo descreve a versão anterior, preservada como referência; os recursos abaixo ainda não foram todos migrados.

# ATHEV · versão local para celular

Aplicativo de academia com o tema preto e dourado e as imagens fornecidas. A interface prioriza o celular, com navegação inferior, controles de toque, área segura para iPhone e formulários adaptados. No computador, usa menu lateral.

O frontend é **HTML + CSS + JavaScript puro**. O servidor é **Python + SQLite**, sem instalação de pacotes. Isso permite login, permissões e registros reais no banco local; abrir somente o HTML ou usar Live Server não executa o backend.

## Começar no computador

1. Extraia o ZIP e abra a pasta **ATHEV** no VS Code.
2. Execute **iniciar.bat**. Também pode executar no terminal:

   ```powershell
   python server.py
   ```

3. Acesse **http://localhost:8000** no navegador.
4. Na tela de entrada, toque em **Aluno**, **Professor** ou **Administração** para explorar as contas demonstrativas.

Mantenha o terminal aberto enquanto usa o app. Para encerrar, pressione `Ctrl+C`. Os dados são preservados para a próxima execução.

Requer Python 3.10 ou superior. O iniciador procura Python instalado e, neste computador, também o runtime já disponível no Codex. Em outro computador sem Python, instale-o e habilite a opção de adicionar ao PATH. Node.js é opcional, apenas para os testes de templates.

## Abrir no celular de verdade

1. Conecte o computador e o celular à **mesma rede Wi-Fi**.
2. Se o servidor comum estiver rodando, encerre-o com `Ctrl+C`.
3. No computador, execute **iniciar-celular.bat**. Equivale a:

   ```powershell
   python server.py --host 0.0.0.0 --port 8000
   ```

4. O terminal exibirá um endereço como **http://192.168.1.20:8000**. Abra o endereço que aparecer no seu terminal no Chrome ou Safari do celular.
5. Se o Windows solicitar autorização de rede, permita Python na sua rede privada de confiança. Não altere o firewall se já estiver funcionando.

O endereço `localhost` no celular aponta para o próprio celular, por isso use o IP exibido pelo computador. O PC precisa permanecer ligado e com o servidor aberto. Algumas redes de convidados isolam os dispositivos; use a rede principal. Para acesso fora desse Wi-Fi será necessário hospedar o backend com HTTPS.

Esta entrega é um aplicativo web responsivo; não é um APK ou um aplicativo publicado nas lojas. No teste por Wi-Fi o tráfego usa HTTP: utilize os dados de demonstração. A configuração padrão continua restrita ao próprio computador.

## Contas de demonstração

Senha das contas abaixo: **Athev@123**.

| Perfil | E-mail |
|---|---|
| Aluno | aluno@athev.local |
| Professor | professor@athev.local |
| Administrador | admin@athev.local |
| Recepcionista | recepcao@athev.local |
| Gerente | gerente@athev.local |
| Aluno adicional | ana@athev.local |
| Aluno adicional | pedro@athev.local |

Código de recuperação das contas iniciais: **ATHEV-DEMO-2026**. Contas criadas pela interface recebem um código aleatório exibido uma única vez. A recuperação invalida o código anterior e encerra as sessões existentes. A versão local não envia e-mails. O login Google não é exibido porque não há OAuth configurado.

## Recursos conectados ao banco

- **Conta:** cadastro, login persistente opcional, logout, alteração de senha, recuperação por código, edição de perfil e foto.
- **Treinos A–E:** fichas iniciais, criação, edição, duplicação, exclusão, grupos musculares, séries, repetições, carga, descanso, técnicas e observações.
- **Execução:** cronômetro, séries editáveis, conclusão/desmarcação, descanso automático, inclusão/remoção de séries, substituição de exercício, observações e retomada após atualizar a página. As alterações são salvas ao sair do campo e ao concluir ações.
- **Finalização:** dificuldade, tempo, séries, repetições, volume, recordes e conquistas calculados. Finalizações repetidas não duplicam o histórico.
- **Biblioteca:** 26 exercícios pesquisáveis, filtros de grupos, favoritos, instruções, dicas, erros comuns e guia textual animado. Não há vídeos biomecânicos gravados.
- **Evolução:** histórico, gráficos de volume, frequência, peso e carga; filtros de 7 dias a todo o período; medidas corporais e comparação de fotos por data/ângulo.
- **Agenda:** calendário mensal/semanal, treinos concluídos, atividades pessoais editáveis, avaliações e consultas, reservas de aulas, limite de vagas e prazo de cancelamento.
- **Acesso:** carteira digital, QR verdadeiro com token opaco de 60 segundos, uso único e validação pela recepção; histórico de acessos. A lotação aparece como indisponível, sem valores inventados.
- **Planos:** escolha de plano e unidade, forma de pagamento preferida, histórico, fatura imprimível, pagamento explicitamente simulado e solicitação de cancelamento para análise da administração.
- **Nutrição:** diário de refeições, calorias/macros informados, água, metas editáveis e identificação opcional do profissional responsável.
- **Gamificação:** XP, níveis, sequências, medalhas, desafios e progresso calculados a partir dos registros.
- **Notificações:** central interna, leitura, preferências, avisos próximos de aulas/atividades, cobrança demonstrativa, recordes, conquistas, meta e inatividade. Atualização ao consultar o app; não há push em segundo plano.
- **Professor:** alunos vinculados, consulta a treino/histórico/evolução, edição de fichas, templates, avaliações, observações e agendamento para o aluno.
- **Gestão:** alunos/equipe, vínculos entre professor e aluno, bloqueio/desbloqueio, unidades, planos, aulas, catálogo de exercícios, faturas locais, avisos internos, validação de acesso, relatórios CSV e auditoria.
- **Privacidade:** consentimento, exportação de dados próprios e exclusão definitiva da conta no banco ativo, confirmada por senha. Professores só consultam alunos vinculados.
- **Assistente:** respostas locais por regras sobre exercícios, alternativas e os dados do histórico. A função `assistant()` centraliza o ponto para uma futura integração generativa.

### Testar o QR pelo celular

Entre como aluno no telefone, abra **Perfil → Acesso à academia** e gere o QR. No computador, entre como `recepcao@athev.local`, abra **Acessos** e cole o token antes de 60 segundos. Um leitor de QR que digite o conteúdo no campo também funciona. O sistema registra o acesso uma única vez. A câmera do navegador não é utilizada.

### O que depende de serviços externos

Pagamentos bancários, catraca física, ocupação ao vivo, e-mail, Google OAuth, push e IA generativa precisam de provedores e credenciais. Esses serviços **não estão conectados**, e a interface não apresenta simulações como operações reais. As metas alimentares são exemplos editáveis; não há prescrição clínica. As calorias do treino não são estimadas sem dados suficientes.

## Onde editar

```text
ATHEV/
  index.html              Entrada HTML
  css/styles.css          Tema, componentes e regras de celular
  js/state.js             Estado e cliente da API
  js/ui.js                Componentes, ícones, gráficos e helpers
  js/views.js             Telas do aluno, professor e administração
  js/forms.js             Formulários e diálogos
  js/app.js               Eventos, navegação e ações
  assets/                 Suas imagens originais
  server.py               Servidor HTTP e segurança de requisições
  backend/api.py          Regras de negócio e permissões
  backend/db.py           Conexão, senhas e dados demonstrativos
  backend/schema.sql      Tabelas, vínculos e índices
  backend/catalog.py      Conteúdo de exercícios e fichas iniciais
  backend/qrencoder.py    Gerador QR incorporado, licença MIT
  data/athev.db           Banco criado automaticamente no primeiro uso
  tests/                  Testes de integração e templates
  iniciar.bat             Iniciador para o computador
  iniciar-celular.bat     Iniciador para testar pelo Wi-Fi
```

A cor principal fica em `--gold` no início do CSS. As regras mobile estão nos blocos de até 700 px e 370 px. Não há CDN, fontes remotas nem dependência de internet para usar o app na rede local.

O banco inicial é criado apenas quando não existem usuários. Depois disso, editar os dados de demonstração no código não substitui seus registros. Para começar outra base sem apagar a atual, defina um caminho diferente:

```powershell
$env:ATHEV_DB = "data\outra-base.db"
python server.py
```

## Verificação

```powershell
python tests/test_api.py
```

Os testes usam um banco temporário separado: login/CSRF, acesso a arquivos, permissões, fluxo de treino e retomada, validação, duplicação, concorrência de reservas, QR de uso único, diário, fotos, exportação, recuperação, exclusão, bloqueio, pagamentos simulados e notificações.

Teste opcional dos templates, com Node 18+ e Python no PATH:

```powershell
node tests/test_frontend.mjs
```

Foram verificados 15 cenários de integração e 70 gerações de telas/formulários, incluindo estados vazios, escape de conteúdo e ligações de ações. Também foi verificada a sintaxe dos módulos JavaScript e Python. Não houve teste visual/interativo em navegador nem teste em aparelho físico nesta entrega.

O módulo opcional `js/webmcp.js` registra consulta de fichas e registro de água quando o navegador oferece WebMCP. Não havia contexto WebMCP compatível para validar essa extensão; ela é detectada por recurso e sua ausência não interfere no aplicativo.

## Uso além da demonstração

O backend usa PBKDF2-HMAC-SHA256 com salt e 600.000 iterações, cookies HttpOnly/SameSite, CSRF, tokens aleatórios com hash no banco, controle de perfis, validação no servidor, limitação de tentativas, transações e arquivos privados fora das rotas públicas.

O servidor padrão da biblioteca Python foi escolhido para execução simples no computador. Para operar comercialmente: substitua as contas de demonstração, use hospedagem com HTTPS e cookies Secure, configure servidores e backups adequados, provedores reais, monitoramento, regras comerciais e a política de privacidade da academia. O texto de privacidade fornecido descreve a versão local e não constitui uma certificação de conformidade com a LGPD. Não exponha diretamente este servidor demonstrativo à internet.

Para backup, encerre o servidor e copie a pasta `data` para um local protegido. A exclusão pelo app atua no banco ativo; backups externos são responsabilidade de quem administra a implantação.

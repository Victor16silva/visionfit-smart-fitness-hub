# VisionFit no celular (iOS) — PWA e app nativo (Capacitor)

O VisionFit continua sendo um app **web** (roda no navegador) e agora também pode ser
instalado no celular de duas formas. O foco é iOS, mas os dois caminhos funcionam
também em Android.

---

## Caminho 1 — PWA (mais rápido, sem Mac, de graça) ✅ recomendado para começar

Uma PWA é o próprio site instalado como app na tela inicial do iPhone (tela cheia,
com ícone próprio). É a forma mais rápida de você e seus amigos usarem **agora**.

### Pré-requisito: publicar o site num link público (HTTPS)
Hoje o app roda só em `localhost`. Para instalar no celular ele precisa estar num
endereço público. Opções gratuitas (qualquer uma serve):

- **Lovable** → botão **Share → Publish** (o jeito mais rápido, o projeto já é Lovable).
- **Vercel** / **Netlify** / **Cloudflare Pages**: conecte este repositório do GitHub.
  O projeto já vem com `vercel.json`, `netlify.toml` e `public/_redirects` prontos —
  é só conectar; o build é `npm run build` e a pasta publicada é `dist/`.

> As chaves do Supabase usadas no build ficam em `.env` (chave pública/anon, segura
> para o cliente). Se o host pedir variáveis de ambiente, use as mesmas do `.env`.

### Instalar no iPhone (depois de publicado)
1. Abra o link público no **Safari** (precisa ser Safari no iOS).
2. Toque no botão **Compartilhar** (quadrado com seta).
3. Toque em **Adicionar à Tela de Início**.
4. Pronto: o ícone do VisionFit aparece como um app. Seus amigos fazem o mesmo com o
   mesmo link.

Vantagens: instantâneo, sem Mac, sem App Store, sem custo. Atualiza sozinho quando
você publica de novo.

---

## Caminho 2 — App iOS nativo (Capacitor) para App Store / TestFlight

Para um app **nativo** de verdade (instalável via TestFlight/App Store), a Apple exige
compilar num **Mac com Xcode**. O projeto Capacitor já está configurado neste repo
(pasta `ios/`).

### Requisitos
- Um **Mac** com **Xcode** instalado.
- Uma conta **Apple Developer** ($99/ano) para distribuir aos amigos via **TestFlight**
  (até 100 testadores por link). Sem a conta paga, dá para instalar só no seu próprio
  iPhone via cabo, e o app expira em 7 dias.

### Passos no Mac
```sh
# 1. Clonar o repo e instalar dependências
npm install

# 2. Gerar o build web + sincronizar para o projeto iOS
npm run ios:build      # = vite build && cap sync ios

# 3. Abrir no Xcode
npx cap open ios
```
No Xcode:
1. Selecione o target **App** → aba **Signing & Capabilities** → escolha seu **Team**
   (sua conta Apple). O Bundle Identifier padrão é `com.visionfit.app` (pode trocar).
2. Conecte o iPhone via cabo, selecione-o como destino e clique em **Run** (▶) para
   instalar direto no seu aparelho.
3. Para os amigos: **Product → Archive** → **Distribute App → TestFlight** e convide
   por email/link.

### Sempre que mudar o código web
```sh
npm run ios:build      # rebuild + cap sync
```
Depois rode/arquive de novo no Xcode.

### Observação sobre login por email no app nativo
No app nativo a origem é `capacitor://localhost`. Se você deixar a confirmação de
email **ligada** no Supabase, o link de confirmação precisa de deep link configurado.
O mais simples enquanto testa: **Authentication → Providers → Email → desativar
"Confirm email"** no painel do Supabase (a conta admin já vem confirmada).

---

## Resumo
- Quer usar **hoje, rápido, sem Mac** → **PWA** (Caminho 1): publique e "Adicionar à
  Tela de Início".
- Quer app **nativo na App Store/TestFlight** → **Capacitor** (Caminho 2): precisa de
  Mac + conta Apple Developer.

# Segurança Escolar

Aplicativo multiplataforma de monitoramento de ambientes escolares, migrado da base funcional de `Rafael11100/my-app` para este repositório Expo.

## Funcionalidades

- Login administrativo conectado ao JazzSecurity, com sessão autenticada e expiração automática.
- Persistência segura da sessão no dispositivo e armazenamento compatível com a versão web.
- Consulta autenticada de `/sensores` e `/eventos`, com atualização automática a cada 10 segundos.
- Estado de conexão, erros da API, última sincronização e indicador de sensores offline/desatualizados.
- Painel com resumo de alertas, planta baixa interativa e detalhes dos sensores.
- Agrupamento visual dos marcadores por tipo e localização no mapa; os cartões da tela de sensores continuam exibindo os dispositivos individualmente.
- Histórico de eventos em modo somente leitura. Os dados reais não são simulados nem apagados localmente.

## Design

A interface usa uma linguagem visual inspirada no Material Design 3: cores organizadas por função (primária, superfícies e estados semânticos), elevação tonal, hierarquia tipográfica, componentes arredondados, feedback de estado e alvos de toque acessíveis. A experiência é responsiva para Android, iOS e web.

O painel e os cartões de áreas usam fotografias reais do Unsplash:
- Corredor escolar: Lutz Stallknecht / Unsplash.
- Sala de aula: Nathan Cima / Unsplash.

As imagens são carregadas por `expo-image`, que oferece cache em memória e disco. É necessária conexão com a internet no primeiro carregamento.

## API e autenticação

O aplicativo utiliza o JazzSecurity como fonte de verdade. Não há cadastro no cliente nem usuários administrativos criados localmente.

Copie `.env.example` para `.env.local`. A URL de produção já está preenchida:

```env
EXPO_PUBLIC_JAZZSECURITY_URL=https://jazz-security.vercel.app
```

Para desenvolvimento local:
- Android Emulator: `http://10.0.2.2:3001`
- iOS Simulator ou Expo Web na mesma máquina: `http://localhost:3001`
- Celular físico: use o IP da máquina que hospeda a API, por exemplo `http://192.168.1.20:3001`

No backend JazzSecurity, configure `JWT_SECRET`, `ADMIN_OPERACAO_PASSWORD` e `ADMIN_COORDENACAO_PASSWORD`. Não coloque senhas, JWT secrets ou outros segredos em variáveis `EXPO_PUBLIC_*`.

O contrato consumido pelo app é:
- `POST /auth/login`
- `GET /sensores`
- `GET /eventos?limit=100`

As rotas protegidas recebem o token em `Authorization: Bearer <token>`. Para Expo Web, inclua a origem local/publicada em `CORS_ORIGINS` no backend.

## Desenvolvimento

Requisitos do projeto: Expo SDK 58, React Native 0.88 e Node.js 22.13 ou superior.

```bash
npm ci
npx expo install --fix
npx expo-doctor
npx expo start --clear
```

Verificações:

```bash
npx tsc --noEmit
npx expo lint
```

O Expo Router mantém as rotas em `src/app/`; componentes, contexto, tema e utilitários ficam fora da pasta de rotas.

## Android

Para gerar um APK de teste:

```bash
npx eas-cli@latest build --platform android --profile preview
```

Para um pacote AAB:

```bash
npx eas-cli@latest build --platform android --profile production
```

A primeira execução do EAS pode solicitar autenticação e vínculo do projeto Expo.

## Referências de design e plataforma

- [Material Design 3 — sistema de cores, tipografia, formas e acessibilidade](https://developer.android.com/codelabs/m3-design-theming)
- [Google Android — acessibilidade](https://developer.android.com/design/ui/mobile/guides/foundations/accessibility)
- [Expo SDK 58 — Expo Router](https://docs.expo.dev/versions/v58.0.0/sdk/router/)
- [Expo SDK 58 — Expo Image](https://docs.expo.dev/versions/v58.0.0/sdk/image/)

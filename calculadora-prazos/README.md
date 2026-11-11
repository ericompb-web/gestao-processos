# Calculadora de Prazos PGE-AC

Aplicativo de desktop para calcular o vencimento de prazos processuais, materiais e personalizados, com o
calendário de feriados do Acre e do TJAC, prazo em dobro da Fazenda Pública (CPC, art. 183), suspensão de fim
de ano (CPC, art. 220) e memória de cálculo dia a dia. Funciona localmente; os dados ficam no `localStorage`.
A única chamada de rede é a leitura da página pública do calendário do TJAC.

## Uso rápido (sem instalar)
Abra `src/index.html` no navegador. A leitura automática do calendário do TJAC pode ser bloqueada pelo navegador
(CORS); no aplicativo instalado ela é feita pelo processo principal e não sofre essa restrição.

## Instalador para Windows
Aba **Actions** do GitHub → **Gerar instalador - Calculadora de Prazos PGE-AC** → **Run workflow**.
Ao final, baixe o artefato `calculadora-prazos-instalador`. O instalador não é assinado: o Windows pode
exibir o aviso do SmartScreen (Mais informações → Executar assim mesmo).

## Desenvolvimento
```
npm ci
npm test      # testes do núcleo (node:test, sem dependências)
npm start     # abre no Electron
npm run dist  # gera o instalador em dist_instalador/
```

Estrutura: `src/nucleo.js` (datas, feriados, leitura do TJAC, `calcularPrazo`), `src/app.js` (interface),
`main.cjs`/`preload.cjs` (Electron; única chamada de rede, restrita ao calendário do TJAC).

## Premissas a conferir
- Modo envio: ciência presumida em *envio + 9 dias* (10º dia corrido contando o dia do envio).
- A leitura da página do TJAC segue a estrutura descrita (h1 = mês, h3 = dia, p = linhas) e deve ser
  validada contra a página real a cada ano; se a estrutura mudar, nada é gravado e o aplicativo usa a base padrão.
- Fundamentos legais dos feriados padrão foram transcritos da especificação e não foram verificados em fonte oficial.

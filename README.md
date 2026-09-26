# BetTracker

Tracker pessoal de apostas de futebol, inspirado na UI do projeto original BetTracker, com SQLite persistente para Docker/Portainer.

Inclui apostas, casas de apostas, condições/bónus semanais, depósitos/levantamentos/ajustes, dashboard, P&L/ROI/win rate e exportação CSV.

## Portainer / PostgreSQL

A aplicação suporta PostgreSQL através de `DATABASE_URL`. Sem essa variável, o desenvolvimento local continua a usar SQLite.

Para testes no Portainer, o repositório inclui `compose.yaml` com **todos os valores definidos diretamente** (sem `.env` e sem variáveis externas). As credenciais atuais são deliberadamente simples e devem ser alteradas antes de produção:

- PostgreSQL: `bettracker`
- Utilizador: `bettracker`
- Password de teste: `bettracker_test`
- App: `http://<servidor>:3080`

O Stack inclui:
1. PostgreSQL 17 com volume persistente.
2. Um serviço de migração que, se existir `/app/data/betting.db`, copia os dados SQLite para PostgreSQL.
3. A aplicação, que só arranca depois de PostgreSQL estar saudável e a migração terminar.

O serviço de migração é idempotente para os dados existentes e o volume SQLite **não deve ser apagado** até a migração ser validada.

Para produção, substitui as credenciais de teste por credenciais/segredos próprios. A imagem oficial do PostgreSQL requer uma password na inicialização e suporta `POSTGRES_DB`, `POSTGRES_USER` e `POSTGRES_PASSWORD`.


## Autenticação

A aplicação agora exige autenticação. O primeiro ecrã permite **Entrar** ou **Criar conta**. As passwords das contas são armazenadas com hash `scrypt`, as sessões usam cookies HttpOnly e os dados (apostas, casas, movimentos e bónus) ficam isolados por utilizador. O cookie `Secure` pode ser ativado com `COOKIE_SECURE=true` quando a aplicação estiver atrás de HTTPS.

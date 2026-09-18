# BetTracker

Tracker pessoal de apostas de futebol, inspirado na UI do projeto original BetTracker, com SQLite persistente para Docker/Portainer.

Inclui apostas, casas de apostas, condições/bónus semanais, depósitos/levantamentos/ajustes, dashboard, P&L/ROI/win rate e exportação CSV.

## Portainer
O GitHub Actions publica `ghcr.io/vitornobrega/bettingdashboard:latest`.

```yaml
services:
  bettingdashboard:
    image: ghcr.io/vitornobrega/bettingdashboard:latest
    container_name: bettingdashboard
    restart: unless-stopped
    ports:
      - "3080:3000"
    environment:
      TZ: Europe/Lisbon
    volumes:
      - bettingdashboard_data:/app/data
volumes:
  bettingdashboard_data:
```

A password da casa é guardada na base de dados local do servidor e não é devolvida pelo endpoint de listagem. Para produção, recomendo acrescentar encriptação com uma chave/secret do Docker.

## Autenticação

A aplicação agora exige autenticação. O primeiro ecrã permite **Entrar** ou **Criar conta**. As passwords das contas são armazenadas com hash `scrypt`, as sessões usam cookies HttpOnly e os dados (apostas, casas, movimentos e bónus) ficam isolados por utilizador. O cookie `Secure` pode ser ativado com `COOKIE_SECURE=true` quando a aplicação estiver atrás de HTTPS.

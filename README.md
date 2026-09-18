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
.PHONY: deploy up down logs clean restart

# Executa o script completo de deploy
deploy:
	@bash deploy.sh

# Apenas liga o sistema rápido (sem rebuildar)
up:
	docker compose up -d

# Desliga o sistema
down:
	docker compose down

# Mostra os logs ao vivo de todos os containers
logs:
	docker compose logs -f

# Limpeza profunda (CUIDADO: o parâmetro -v apaga o banco de dados!)
clean-all:
	docker compose down -v
	docker system prune -f

# Apenas reinicia o sistema rapidamente
restart: down up

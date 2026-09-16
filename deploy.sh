#!/bin/bash

# Cores para melhorar a legibilidade no terminal
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # Sem Cor

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}      🚀 Iniciando Deploy - Ronda Security      ${NC}"
echo -e "${BLUE}================================================${NC}"

# 1. Derruba a infraestrutura atual
echo -e "\n${YELLOW}[1/4] Parando os containers antigos...${NC}"
docker compose down

# 2. Opcional: Limpeza de sistema (Remove containers parados e redes não usadas)
echo -e "\n${YELLOW}[2/4] Limpando resíduos antigos do Docker...${NC}"
docker system prune -f

# 3. Reconstrói as imagens para pegar as últimas alterações de código
echo -e "\n${YELLOW}[3/4] Construindo novas imagens (Web e Backend)...${NC}"
# Usar --no-cache se quiser forçar um build do zero (demora mais)
docker compose build 

# 4. Inicia o sistema
echo -e "\n${YELLOW}[4/4] Subindo o sistema em background...${NC}"
docker compose up -d

# 5. Verifica se os containers subiram com sucesso
if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}================================================${NC}"
    echo -e "${GREEN}   ✅ Deploy concluído com sucesso!             ${NC}"
    echo -e "${GREEN}================================================${NC}"
    echo -e "Para acompanhar os logs ao vivo, digite: ${YELLOW}make logs${NC}"
    echo -e "Ou acesse via navegador a porta configurada no docker-compose.yml.\n"
else
    echo -e "\n${RED}❌ Ocorreu um erro ao subir os containers.${NC}"
    echo -e "Verifique os logs acima.\n"
fi

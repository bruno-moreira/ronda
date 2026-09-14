# Estágio 1: Build da aplicação React
FROM node:22-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

# Estágio 2: Nginx
FROM nginx:alpine

# Remove configuração padrão
RUN rm /etc/nginx/conf.d/default.conf

# Copia arquivo de configuração customizado
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copia os arquivos buildados
COPY --from=build /app/dist /usr/share/nginx/html

# Instala openssl e gera certificado autoassinado para HTTPS (PWA Scanner)
RUN apk add --no-cache openssl && \
    mkdir -p /etc/nginx/ssl && \
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/nginx-selfsigned.key \
    -out /etc/nginx/ssl/nginx-selfsigned.crt \
    -subj "/C=BR/ST=SP/L=SaoPaulo/O=Ronda/OU=IT/CN=localhost"

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]

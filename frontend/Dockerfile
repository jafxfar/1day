# Этап 1: Сборка приложения
FROM node:22-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

# Установка зависимостей и сборка
COPY package.json ./

RUN pnpm install --no-frozen-lockfile

COPY . .
RUN pnpm build

# Этап 2: Раздача через Nginx
FROM nginx:alpine

# Копируем скомпилированный билд из первого этапа в папку Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Копируем наш собственный nginx.conf (который мы обсуждали в самом начале для поддержки SPA роутинга)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
# 1. Базовый образ Node.js
FROM node:20-alpine

# 2. Рабочая директория
WORKDIR /app

# 3. Установка pnpm и зависимостей
RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml ./
RUN pnpm install

# 4. Копирование кода и сборка
COPY . .
RUN pnpm build

# 5. Запуск приложения
CMD ["sh", "-c", "ls -R dist && node dist/server.js"]
# Используем официальный образ Node.js LTS на базе Alpine Linux
# Он маленький и безопасный
FROM node:20-alpine

# Устанавливаем рабочую директорию
WORKDIR /app

ARG PUBLIC_API_BASE_URL
ENV PUBLIC_API_BASE_URL=$PUBLIC_API_BASE_URL

# Копируем package.json и package-lock.json для кэширования зависимостей
COPY package*.json ./

# Устанавливаем зависимости
RUN npm ci

# Копируем весь остальной код
COPY . .

# Собираем приложение
RUN npm run build

# Устанавливаем переменные окружения, которые требует Cloud Run
ENV HOST=0.0.0.0
ENV PORT=8080

# Сообщаем Docker, что контейнер будет слушать этот порт
EXPOSE 8080

# Команда для запуска сервера
CMD ["node", "./dist/server/entry.mjs"]
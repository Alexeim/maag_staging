# 1. Используем официальный образ Node.js версии 20
FROM node:20-slim

# 2. Устанавливаем рабочую директорию внутри контейнера
WORKDIR /usr/src/app

# 3. Копируем package.json и package-lock.json
COPY package*.json ./

# 4. Устанавливаем только production-зависимости
RUN npm ci --only=production

# 5. Копируем исходный код TypeScript
COPY . .

# 6. Компилируем TypeScript в JavaScript
RUN npm run build

# 7. Указываем команду для запуска приложения
CMD [ "npm", "start" ]

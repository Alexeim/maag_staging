# Этап 1: "Мастерская" для сборки проекта
# Мы даем этому этапу имя "builder", чтобы потом на него сослаться
FROM node:20 AS builder

# Устанавливаем рабочую директорию
WORKDIR /usr/src/app

# Копируем package.json и устанавливаем ВСЕ зависимости (включая dev)
COPY package*.json ./
RUN npm ci

# Копируем весь остальной код
COPY . .

# Собираем проект (компилируем TS в JS)
RUN npm run build

# Оставляем только production-зависимости для чистоты
RUN npm prune --production

# --- На этом этапе у нас есть готовые папки 'dist' и 'node_modules' ---


# Этап 2: "Чистовик" для запуска приложения
FROM node:20-slim

# Устанавливаем рабочую директорию
WORKDIR /usr/src/app

# Копируем package.json (он нужен для npm start)
COPY package*.json ./

# !!! МАГИЯ !!!
# Копируем готовые артефакты из "Мастерской" (этапа "builder")
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/node_modules ./node_modules

# Указываем команду для запуска готового JS кода
CMD [ "npm", "start" ]
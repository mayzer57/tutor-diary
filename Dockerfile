FROM node:18

# Создаем рабочую директорию
WORKDIR /app

# Копируем весь код
COPY . .

# Установка зависимостей backend
WORKDIR /app/server
RUN npm install

# Открываем порт
EXPOSE 5001

# Запуск сервера
CMD ["node", "server.js"]
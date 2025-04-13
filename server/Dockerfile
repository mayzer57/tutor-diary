FROM node:18

# Создаем рабочую папку
WORKDIR /app

# Копируем весь код
COPY . .

# Переходим в папку backend и устанавливаем зависимости
RUN npm install --prefix server

# Указываем порт
EXPOSE 5001

# Стартуем сервер
CMD ["node", "server/server.js"]
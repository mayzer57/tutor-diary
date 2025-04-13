FROM node:18

WORKDIR /opt/build

# Клонируем проект
RUN git clone https://github.com/mayzer57/tutor-diary.git -b main .

# Удаляем origin, чтобы не было конфликтов
RUN git remote remove origin

# Переходим в папку server и устанавливаем зависимости
WORKDIR /opt/build/server
RUN npm install

# Открываем порт (если нужно)
EXPOSE 5001

# Запускаем сервер
CMD ["node", "server.js"]
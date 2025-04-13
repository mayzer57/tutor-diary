# 1. Базовый образ
FROM node:18

# 2. Рабочая директория
WORKDIR /opt/build

# 3. Установим git и подготовим ssh
RUN apt update && apt install -y git
RUN mkdir -p /root/.ssh && ssh-keyscan -t rsa github.com > /root/.ssh/known_hosts

# 4. Клонируем проект
RUN git clone "https://github.com/mayzer57/tutor-diary.git" -b main .

# 5. Переключаемся на нужный коммит
WORKDIR /opt/build
RUN git checkout b372542c5e337d6ab7721ff4641e8b595a7ebf63
RUN git remote rm origin

# 6. Переходим в папку сервера и устанавливаем зависимости
WORKDIR /opt/build/server
RUN npm install

# 7. Устанавливаем pm2 глобально (если хочешь через pm2)
RUN npm install -g pm2

# 8. Указываем команду запуска
CMD ["pm2-runtime", "server.js"]
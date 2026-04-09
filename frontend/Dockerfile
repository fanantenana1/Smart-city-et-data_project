FROM node:20-alpine

WORKDIR /app

# Copier package.json et package-lock.json
COPY package*.json ./

# Installer les dépendances
RUN npm ci

# Copier l'application
COPY . .

EXPOSE 3000

CMD ["npm", "start"]

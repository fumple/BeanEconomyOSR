FROM node:18

LABEL org.opencontainers.image.source=https://github.com/fumple/beaneconomyosr
LABEL org.opencontainers.image.description="BeanEconomyOSR"
LABEL org.opencontainers.image.licenses=AGPL-3.0-only

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm ci
# If you are building your code for production
# RUN npm ci --only=production

# Bundle app source
COPY . .

CMD [ "node", "index.js" ]

FROM node:10

# Create app directory
WORKDIR /usr/src/app

RUN npm i -g @edenjs/cli

# Install app dependencies
COPY package*.json ./
RUN npm install 

# Bundle app source
COPY . .

EXPOSE 1337
CMD [ "edenjs", "start" ]

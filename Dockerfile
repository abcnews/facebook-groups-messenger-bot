FROM node:boron

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json /usr/src/app/
RUN npm install

# Bundle app source
COPY . /usr/src/app

ARG LOGGLY_KEY
RUN node_modules/gulp/bin/gulp.js build

EXPOSE 3000

CMD [ "npm", "start" ]

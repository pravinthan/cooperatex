FROM ubuntu:18.04

RUN apt-get update -yq

RUN apt-get install curl gnupg -yq

RUN curl -sL https://deb.nodesource.com/setup_12.x | bash -

RUN apt-get install nodejs -yq

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get install texlive-latex-extra -yq

RUN useradd -ms /bin/bash node

RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app

WORKDIR /home/node/app

COPY package*.json ./

USER node

RUN npm install --only=prod

COPY --chown=node:node . .

EXPOSE 3000

RUN npm run build-prod

CMD [ "npm", "run", "start-server" ]

FROM node:18-buster-slim

ENV NODE_ENV production
WORKDIR /sln-booking
COPY ./package.json ./
COPY ./node_modules ./node_modules
COPY ./build ./build

EXPOSE 3000

CMD node build 
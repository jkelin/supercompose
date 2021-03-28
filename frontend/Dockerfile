FROM node:lts-alpine AS deps

WORKDIR /opt/app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

FROM node:lts-alpine AS builder

ENV NODE_ENV=production
WORKDIR /opt/app
COPY . .
COPY --from=deps /opt/app/node_modules ./node_modules
RUN yarn build

# Production image, copy all the files and run next
FROM node:lts-alpine AS runner

WORKDIR /opt/app
ENV NODE_ENV=production

COPY . .
COPY --from=builder /opt/app/.next ./.next
RUN yarn install --frozen-lockfile --production

CMD ["node_modules/.bin/next", "start"]
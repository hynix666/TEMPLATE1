# The base image is pinned by digest as well as tag: a tag can be repointed at a different image.
# Dependabot updates both together.
FROM node:26-alpine@sha256:ef24c5053d50fdc3e4e56eb4e7ddb7861874ab0fdc797046ba897581deb8e868
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
# Node 24 runs TypeScript directly by stripping types, so the sources ship as they are.
COPY src ./src
USER node
EXPOSE 8080
CMD ["node", "src/main.ts"]

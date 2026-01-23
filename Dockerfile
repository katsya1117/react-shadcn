FROM node:22-alpine

RUN apk add --no-cache git

WORKDIR /app

# Corepackを有効にしてyarnを使えるようにする
RUN corepack enable

# 先に依存関係だけコピーしてインストール（ビルド高速化）
COPY package.json yarn.lock* ./
RUN yarn install

# 残りのファイルをコピー
COPY . .

# Viteのデフォルトポートは5173
EXPOSE 5173

CMD ["yarn", "dev"]
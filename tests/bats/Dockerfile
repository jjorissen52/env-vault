FROM node:16
WORKDIR /app

RUN wget -O /usr/bin/jq https://github.com/stedolan/jq/releases/download/jq-1.6/jq-linux64 \
    && chmod +x /usr/bin/jq
RUN git clone https://github.com/sstephenson/bats.git \
    && cd bats  \
    && ./install.sh /usr/local \
    && cd /app && rm -rf bats

RUN git init .

ADD ["package.json", "yarn.lock", "tsconfig.json", "./"]
RUN yarn install

FROM node:16
WORKDIR /build

RUN wget -O jq https://github.com/stedolan/jq/releases/download/jq-1.6/jq-linux64 \
    && chmod +x jq
RUN git clone https://github.com/sstephenson/bats.git

RUN git init .
ADD ["package.json", "yarn.lock", "tsconfig.json", "./"]
ADD scripts scripts
RUN yarn install
ADD src src
RUN yarn build  \
    && yarn compile  \
    && chmod +x ev

FROM buildpack-deps:buster
WORKDIR /app
COPY --from=0 /build/ev /usr/bin/ev
COPY --from=0 /build/jq /usr/bin/jq
COPY --from=0 /build/bats /tmp/bats
RUN cd /tmp/bats  \
    && ./install.sh /usr/local

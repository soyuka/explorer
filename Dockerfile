FROM node:onbuild
MAINTAINER "Antoine Bluchet <soyuka@gmail.com>"
ENV EXPLORER_CONFIG="/opt/explorer"
RUN npm rebuild -q

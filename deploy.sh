#!/bin/bash
DEBUG=''
cmd=$1
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

babelize() {
  babel routes/*.js lib/**/*.js lib/*.js middlewares/*.js plugins/**/*.js index.js server.js --out-dir build/ &>/dev/null
  mv lib lib.bak 
  mv routes routes.bak
  mv middlewares middlewares.bak
  mv plugins plugins.bak
  mv build/* ./
  cp -r ./plugins.bak/upload/views ./plugins/upload/views
  rm -r build
}

if [[ $cmd == 'postinstall' ]]; then

  if [ ! -z $HOME ]; then
    config_path="$HOME/.config/explorer"
  else
    config_path="./"
  fi

  [ ! -d $config_path ] && mkdir -p $config_path/data
  [ ! -f $config_path/data/users ] && cp users.default $config_path/data/users
  [ ! -f $config_path/config.yml ] && cp config.example.yml $config_path/config.yml
  [ ! -d $config_path/certs ] && cp -r ./certs $config_path/certs
  [ ! -d $config_path/trash ] && mkdir $config_path/trash

  [ -d $NVM_BIN ] && ln -sf $DIR/bin/explorer $NVM_BIN/explorer
  [ ! -d $NVM_BIN ] && echo "Failed to link binary. Add $DIR/bin to you PATH"

  exit 0
fi

if [[ $cmd == 'prepublish' ]]; then
  babelize && exit 0 || exit 1
fi

if [[ $cmd != 'tag' ]]; then
  exit 1
fi

version=$2
previous=$(jq -r .version package.json)

if [ ! -d bower_components ]; then
  echo "Run bower"
  exit 1
fi

if [ ! -d node_modules ]; then
  echo "Run npm"
  exit 1
fi

if [ ! -f client/css/app.css ]; then
  echo "Run gulp"
  exit 1
fi

if [ -z $version ]; then
  version='patch'
fi

git checkout -b deploy

jq -r '.dependencies|keys[]|.|= "node_modules/" + .' package.json|xargs git add -f
babelize
rm -r lib.bak routes.bak middlewares.bak plugins.bak
git add .
git add client/css -f
git commit -q -m 'Compile dependencies'

tag=$(npm version $version)

git push --tags
git reset -q HEAD~2
git stash -q

git checkout master
git branch -D deploy

jq --arg tag $tag '.version |= $tag' package.json > package.tmp.json
mv package.tmp.json package.json

#v0.0.1 => 0.0.1
previous="${previous:1:${#previous}}"
tag="${tag:1:${#tag}}"

perl -pi -e "s,$previous,$tag,g" README.md

git add package.json README.md

git commit -q -m "v$tag"

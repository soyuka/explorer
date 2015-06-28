#!/bin/bash
DEBUG=''
cmd=$1

babelize() {
  babel routes/* lib/* index.js server.js --out-dir build/ &>/dev/null
  mv lib lib.bak 
  mv routes routes.bak
  mv build/* ./
  rm -r build
}

if [[ $cmd == 'postinstall' ]]; then
  [ ! -f data/users ] && cp users.default data/
  [ ! -f config.yml ] && cp config.example.yml config.yml
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
fi

if [ -z $version ]; then
  version='patch'
fi

git checkout -b deploy

jq -r '.dependencies|keys[]|.|= "node_modules/" + .' package.json|xargs git add -f
babelize
rm -r lib.bak routes.bak
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

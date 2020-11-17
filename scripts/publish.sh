#!/bin/sh

if [ -z "$1" ]
  then
    echo "ERROR: No argument supplied"
    exit 1
fi

node -e "require('fs').writeFileSync('./package.json', JSON.stringify(Object.assign(require('./package.json'), {repository:{type:'git',url:'$GITHUB_URL'}}), null, 2), 'utf8')"
npm publish --tag $1

#!/bin/bash

git stash
git pull origin master
npm install

if [ $? -eq 0 ];then
    pm2 restart opp
    if [ $? -ne 0 ];
        then NODE_ENV=production npm run run
    fi
fi
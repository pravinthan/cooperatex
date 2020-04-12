cd /home/pravinthan/cooperatex

git reset --hard
git clean --force
git pull

docker-compose stop nodejs
docker system prune -af

npm i --only=prod
npm run build-prod

docker-compose up -d

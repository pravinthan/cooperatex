cd /home/pravinthan/project-c09-prav-tommy/cooperatex

git reset --hard
git pull

docker-compose stop nodejs
docker system prune -af

npm i --only=prod
npm run build-prod

docker-compose up -d

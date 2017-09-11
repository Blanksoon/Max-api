# react-docker
react-docker with centos7

init
```
> npm install -g create-react-app
> create-react-app app

> git clone https://github.com/yoky-ja/react-docker.git
```

run build docker
```
> docker-compose --build -d
```

start app
```
> docker exec -it yoky-react-nginx bash
> cd /usr/share/nginx/html
> npm start
```

go to browser
```
localhost:3003
```

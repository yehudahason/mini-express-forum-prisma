### Mini Forum with Express js POSTGRES DB and pgAdmin Panel

- Create .env file like env.example with your own credentials
- Bulid docker containers

```
 docker compose up -d
```

- At first you have to Wait a minute or so for containers to get up
- Check out logs to see if database up and connected

```
docker logs forum_app
```

- Open http://localhost:3333/

- After every node js addition of packages run

```
 docker compose down
 docker compose build --no-cache
 docker compose up -d
```

- For pgAdmin dashboard open http://localhost:2020/

- In DB forum table add rows for your own forums

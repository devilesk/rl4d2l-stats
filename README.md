# RL4D2 Stats

Stats processor and static site generator

## Requirements

MySQL with `~/.my.cnf` containing:
```[client]
user=<db_user>
password=<db_pass>
```

## Setup and run

```
$ npm install

$ ./init.sh

$ node index.js
```

Give ownership of project directory to the user running the dedicated server process so sourcemod plugin can run site update script
`$ sudo chown -R steam .`

`public/` is the site directory
Stats page output to `public/index.html` and stats json data output to `public/data/`

## Admin page setup

```
$ mkdir adminconfig

$ node node_modules/express-admin/app.js adminconfig
```
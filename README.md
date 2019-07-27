# RL4D2L Stats

Stats for Reddit Left 4 Dead 2 League

Stats aggregation and RL4D2LBUFF static site generation

## Requirements

MySQL with `~/.my.cnf` containing:
```
[client]
user=<db_user>
password=<db_pass>
```

## Installation

```
$ npm install
```

Initialize and seed database, create public data directories
```
$ ./init.sh
```

Run stats aggregation, generate stats data, generate static site
```
$ node index.js
```

`public/` is the site root directory.

Website homepage output to `public/index.html`

All stats json data output to `public/data/`

Give ownership of project directory to the user running the dedicated server process so sourcemod plugin can run site update script
`$ sudo chown -R steam .`

## Administration Site

Database admin site runs a modified [express-admin](https://github.com/simov/express-admin).

```
$ git submodule update --init --recursive

$ node express-admin/app.js express-admin/admin/config
```

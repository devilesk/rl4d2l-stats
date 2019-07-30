<h1 align="center">
    <img width="75" src="https://github.com/devilesk/rl4d2l-stats/tree/master/src/public/img/cowtank.png?raw=true">
    <br>
    rl4d2l-stats
</h1>

<h4 align="center">Stats for Reddit Left 4 Dead 2 League.</h4>

Stats aggregation and RL4D2LBUFF static site generation

## Installation

```
$ npm install https://github.com/devilesk/rl4d2l-stats
```

Setup a `.env` file with database credentials
```
$ cp .env.example .env
```

Initialize and seed database
```
$ npx rl4d2l-stats --init-database --seed
```

One liner to generate data and website
```
$ npx rl4d2l-stats --init -dbtp
```

See [CLI](#cli) and [Usage Examples](#usage-examples) for details on options.

## Developing

```
$ git clone https://github.com/devilesk/rl4d2l-stats
$ cd rl4d2l-stats
$ npm install
```

Build js, css, and html in watch mode. Changes to `src` files will automatically trigger builds.
```
$ ./cli.js -w
```

## CLI

```
$ rl4d2l-stats -h
Usage: rl4d2l-stats [options]

Options:
  -V, --version        output the version number
  --init               Initialize public directory assets
  --init-database      Initialize database
  --seed               Seed database
  -b, --build          Build js and css
  -w, --watch          Watch source files and rebuild on change
  --build-css          Build css
  --build-js           Build js
  --public-dir <path>  Public output directory
  --data-dir <path>    Data output directory
  -p, --production     Production mode. Use hashed js/css files
  -i, --increment      Incremental data update
  -d, --data           Generate data
  -t, --template       Render template
  -h, --help           output usage information

```

### Usage Examples

Initialize website directory
```
$ npx rl4d2l-stats --init
```

Generate stats json data
```
$ npx rl4d2l-stats -d
```

Build js and css bundles
```
$ npx rl4d2l-stats -b
```

Render [pug](https://github.com/pugjs/pug) template to html file
```
$ npx rl4d2l-stats -t
```

Production (revisioned) js, css, and html build
```
$ npx rl4d2l-stats -b -t -p
```

## Administration Site

Database admin site runs a modified [express-admin](https://github.com/simov/express-admin).

```
$ git submodule update --init --recursive

$ node express-admin/app.js express-admin/admin/config
```

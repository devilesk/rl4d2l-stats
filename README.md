<h1 align="center">
    <img width="75" src="https://github.com/devilesk/rl4d2l-stats/raw/master/src/public/img/cowtank.png?raw=true">
    <br>
    rl4d2l-stats
</h1>

<p align="center">
    <a href="https://nodejs.org">
        <img alt="node" src="https://img.shields.io/badge/node-%3E%3D%208.10.0-brightgreen.svg">
    </a>
    <a href="https://david-dm.org/devilesk/rl4d2l-stats">
        <img alt="David" src="https://img.shields.io/david/devilesk/rl4d2l-stats.svg">
    </a>
    <a href="LICENSE">
        <img alt="GitHub" src="https://img.shields.io/github/license/devilesk/rl4d2l-stats.svg">
    </a>
</p>
<h4 align="center">Stats for Reddit Left 4 Dead 2 League.</h4>

Stats aggregation and static site generator for [RL4D2LBUFF](http://stats.rl4d2l.xyz).

## Installation

Install npm package.
```
$ npm install https://github.com/devilesk/rl4d2l-stats
```

Initialize website directory.
```
$ npx rl4d2l-stats --init
```

Create database.
```
$ npx rl4d2l-stats --init-database
```

Seed database.
```
$ npx rl4d2l-stats --seed
```

Generate data and build website.
```
$ npx rl4d2l-stats -dbpt
```

See [CLI](#cli) and [Usage Examples](#usage-examples) for details on options.

## CLI

```
$ npx rl4d2l-stats -h
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

## Developing

```
$ git clone https://github.com/devilesk/rl4d2l-stats
$ cd rl4d2l-stats
$ npm install
```

CLI is run with `./cli.js` instead of `npx rl4d2l-stats`

Build website js, css, and html in watch mode. Changes to files in `src/` will automatically trigger builds.
```
$ ./cli.js -w
```

## Administration Site

Database admin site runs a modified [express-admin](https://github.com/devilesk/rl4d2l-express-admin).

```
$ git submodule update --init --recursive

$ node express-admin/app.js express-admin/admin/config
```

## Discord Bot

```
$ git clone https://github.com/devilesk/rl4d2l-stats
$ cd rl4d2l-stats
$ npm install
```

Set TOKEN in `.env` file to your discord bot token.

`botConfig.default.json` - Default bot settings.
`botConfig.json` - Setting overrides merged with default bot settings.

```
$ node src/discord/index.js
```

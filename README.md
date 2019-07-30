# RL4D2L Stats

Stats for Reddit Left 4 Dead 2 League

Stats aggregation and RL4D2LBUFF static site generation

## Installation

```
$ git clone https://github.com/devilesk/rl4d2l-stats
$ cd rl4d2l-stats
$ npm -g install
```

Setup a `.env` file with database credentials
```
$ cp .env.example .env
```

Initialize and seed database
```
$ rl4d2l-stats --init-database --seed
```

One liner to generate data and website
```
$ rl4d2l-stats --init -dbtp
```

See [CLI](#cli) and [Usage Examples](#usage-examples) for details on options.

## Developing

Build js, css, and html in watch mode. Changes to `src` files will automatically trigger builds.
```
$ rl4d2l-stats -w
```

## Site Folder Structure

`public/` is the website root directory.

Website homepage output to `public/index.html`

Stats json data files output to `public/data/`

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
$ rl4d2l-stats --init
```

Generate stats json data
```
$ rl4d2l-stats -d
```

Build js and css bundles
```
$ rl4d2l-stats -b
```

Render [pug](https://github.com/pugjs/pug) template to html file
```
$ rl4d2l-stats -t
```

Production (revisioned) js, css, and html build
```
$ rl4d2l-stats -b -t -p
```

## Administration Site

Database admin site runs a modified [express-admin](https://github.com/simov/express-admin).

```
$ git submodule update --init --recursive

$ node express-admin/app.js express-admin/admin/config
```

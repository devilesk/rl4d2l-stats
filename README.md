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

Initialize and seed test database, create data directories
```
$ ./init.sh
```

Run stats aggregation, write stats to json files, and render static site html from [pug](https://github.com/pugjs/pug) template
```
$ node index.js
```

Build js, css, and html files
```
$ npm run build
```

`public/` is the website root directory.

Website homepage output to `public/index.html`

Stats json data files output to `public/data/`

## CLI

```
$ node index.js --help

Usage: index [options]

Options:
  -V, --version             output the version number
  -d, --data-dir <dataDir>  Data output directory
  -p, --production          Production mode. Use hashed js/css files
  -i, --increment           Incremental data update
  -t, --template            Render template only
  -h, --help                output usage information
```

### Usage Examples

`node index.js -d test` - Generate json data and output to test directory.

`node index.js -t` - Skip json data generation and only render template.

`node index.js -p` - Generate json data and render template with revisioned js and css filenames.

`node index.js -tp` - Skip json data generation and render template with revisioned js and css filenames.

## Build Scripts

Build, watch, and revision [npm scripts](https://docs.npmjs.com/misc/scripts) are defined in `package.json`

`npm run build` - Build js, css, and template

`npm run build:prod` - Build js, css, revision js and css filenames, and build template in production mode (using revisioned filenames)

`npm run build:js`, `npm run build:css`, `npm run build:template` - Individual builds for js, css, and template

`npm run watch` - Watch for js, css, and template file changes. Run build scripts on change

`npm run watch:js`, `npm run watch:css`, `npm run watch:template` - Individual watch for js, css, and template changes

`npm run rev` - Revision js and css filenames

## Administration Site

Database admin site runs a modified [express-admin](https://github.com/simov/express-admin).

```
$ git submodule update --init --recursive

$ node express-admin/app.js express-admin/admin/config
```

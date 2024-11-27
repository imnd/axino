# axino: tiny node.js MVC framework

## Description

Uses sequelize as DBAL

## Installation

```bash
$ npm i @imndzy/axino
```

## Usage

Create file index.js at root directory with such code:

```code
import app from '@imndzy/axino';
app.start();
```

Create folder domains at root directory with subfolders containing files row-row-model.js, controller.js (and view.js, if your app is not REST API)

Create file routes.js at root directory with description of your app routes. for example:

```code
export default {
  "get": () => "home!",
}
```
or:
```code
import ArticlesController from './domains/articles/controller.js';

const controller = new ArticlesController();

const routes = {
  "get": () => "home!",
  "get:articles" = [controller, 'index'];
  "post:articles/create" = [controller, 'create'];
  "get:articles/{id}" = [controller, 'show'];
  "post:articles/{id}" = [controller, 'update'];
  "delete:articles/{id}" = [controller, 'destroy'];
}

export default routes;

```

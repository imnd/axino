# axino: tiny node.js MVC framework

## Description

Uses sequelize as DBAL

## Installation

```bash
$ npm i @imnd/axino
```

## Usage

Create file index.js at root directory with such code:

```code
import { go } from '@imnd/axino';
import routes from "./routes.js";

go(routes);
```

Create folder domains at root directory with subfolders containing files model.js, controller.js (and view.js, if your app is not REST API)



Create file routes.js at root directory with description of your app routes. for example:

```code
import ArticlesController from './domains/articles/controller.js';

const controller = new ArticlesController();

{
  "get": () => "home!",
  "get:articles" = [controller, 'index'];
  "post:articles/create" = [controller, 'create'];
  "get:articles/{id}" = [controller, 'show'];
  "post:articles/{id}" = [controller, 'update'];
  "delete:articles/{id}" = [controller, 'destroy'];
}

```

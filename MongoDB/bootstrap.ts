import 'reflect-metadata';
// import * as mongoose from 'mongoose';
import { InversifyExpressServer } from 'inversify-express-utils';
import { Container } from 'inversify';
import { makeLoggerMiddleware } from 'inversify-logger-middleware';
import * as bodyParser from 'body-parser';
import * as helmet from 'helmet';
import * as config from 'config';
import TYPES from './constant/types';
import { UserService } from './service/user';
import { MongoDBClient } from './utils/mongodb/client';
import './controller/home';
import './controller/user';
import {params} from './utils/params';
const { port } = config.get('appConfig') as { port: number };

// load everything needed to the Container
let container = new Container();

if (process.env.NODE_ENV === 'development') {
    let logger = makeLoggerMiddleware();
    container.applyMiddleware(logger);
}

container.bind<MongoDBClient>(TYPES.MongoDBClient).to(MongoDBClient);
container.bind<UserService>(TYPES.UserService).to(UserService);

// start the server
let server = new InversifyExpressServer(container);
server.setConfig((app) => {
  app.use(bodyParser.urlencoded({
    extended: true
  }));
  app.use(bodyParser.json());
  app.use(helmet());
});

let app = server.build();
app.listen(3000);
console.log(`Server started on port ${params.port || port} :)`);

exports = module.exports = app;

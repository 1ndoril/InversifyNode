import * as mongoose from 'mongoose';
import * as config from 'config';

/* tslint:disable */
export const connectToDb: (cb?: any) => void = (cb: any = () => {}): void => {
  const { host } = config.get('dbConfig') as { host: string };
  const dbConnection: mongoose.Connection = mongoose.connection;
  mongoose.connect(host, { useMongoClient: true });
  (mongoose as any).Promise = Promise;
  // TODO need cb err
  dbConnection.on('error', (err: Error) => console.log(`db connect error  ${err}`));
  dbConnection.once('open', () => {
    console.log(`db open connection`);
    cb(dbConnection);
  });
  dbConnection.once('close', () => console.log(`db close connection`));
  /* tslint:enable */
};

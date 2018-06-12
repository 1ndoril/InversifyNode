import * as mongoose from 'mongoose';
import { JWTService } from '../services/jwt.service';
import {  injectable } from 'inversify';
const jwtService: JWTService = new JWTService();
@injectable()
export class UsersModel {
  // tslint:disable-next-line
  public async getUserWithToken(query: any, update?: any): Promise<UserData> {
    // TODO need some refactoring for this logic when user doesn't exist in db
    // we shouldn't use jwtService
    const usersModel: mongoose.Model<mongoose.Document> = mongoose.model('Users');
    let user: User;
    if (update) {
      user = await usersModel.findOneAndUpdate(query, update,
        { new: true })
        .lean() as User;
    } else {
      user = await usersModel.findOne(query)
        .lean() as User;
    }

    return jwtService.getToken(user, 'name', 'password', 'surname', 'login');
  }

  // tslint:disable-next-line
  public async isUserExists(query: any): Promise<boolean> {
    const usersModel: mongoose.Model<mongoose.Document> = mongoose.model('Users');
    let user: User[] | null;
    try {
      user = await usersModel.find(query)
        .lean()
        .exec() as User[];
    } catch (err) {
      // tslint:disable-next-line
      console.log(err);
      user = null;
    }
    if (user && user[0]) {
      return Promise.resolve(true);
    }
    return Promise.resolve(false);
  }

  // tslint:disable-next-line
  public async getUser(query: any): Promise<User[] | null> {
    const usersModel: mongoose.Model<mongoose.Document> = mongoose.model('Users');
    let user: User[] | null;
    try {
      user = await usersModel.find(query)
        .lean() as User[];
    } catch (err) {
      // tslint:disable-next-line
      console.log(err);
      user = null;
    }
    return Promise.resolve(user);
  }

  public async createUser(userData: User): Promise<UserData | null> {
    const usersModel: mongoose.Model<mongoose.Document> = mongoose.model('Users');
    const newUser: mongoose.Document = new usersModel(userData);
    let user: User | null;
    try {
      user = await newUser.save()
        .then((userDoc: mongoose.Document) => userDoc.toObject()) as User;
    } catch (err) {
      // tslint:disable-next-line
      console.log(err);
      user = null;
    }
    if (user) {
      return jwtService.getToken(user, 'name');
    }
    return Promise.resolve(null);

  }
  // tslint:disable-next-line
  public async updateUser(query: any, updateQuery: any): Promise<User> {
    const usersModel: mongoose.Model<mongoose.Document> = mongoose.model('Users');
    await usersModel.findOneAndUpdate(query, updateQuery);
    // TODO need refactor
    delete updateQuery.password;
    return Promise.resolve({ ...query, ...updateQuery });
  }

  public async getUsersWithRole(): Promise<User[]> {
    const usersModel: mongoose.Model<mongoose.Document> = mongoose.model('Users');
    let user: User[];
    try {
      user = await usersModel.find(
        {},
        {
          _id: 1,
          role: 1
        }
      )
        .lean() as User[];
    } catch (err) {
      // tslint:disable-next-line
      console.log(err);
      user = [];
    }
    return Promise.resolve(user);

  }


  public async addMailHashForUser(
    query: { login: string, hash: string, timeOfHashLife: string }
  ): Promise<User | null> {
    const usersModel: mongoose.Model<mongoose.Document> = mongoose.model('Users');
    let user: User | null;
    try {
      user = await usersModel.findOneAndUpdate(
        { login: query.login },
        {
          hash: query.hash,
          timeOfHashLife: query.timeOfHashLife
        }
      )
        .lean() as User;
    } catch (err) {
      // tslint:disable-next-line
      console.log(err);
      user = null;
    }
    return Promise.resolve(user);
  }
  // tslint:disable-next-line
  public async updateUserRole(query: any, updateQuery: string[]): Promise<User> {
    const usersModel: mongoose.Model<mongoose.Document> = mongoose.model('Users');
    await usersModel.update(query,  { $addToSet: { role: { $each: updateQuery } } });
    return Promise.resolve({ ...query, ...updateQuery });
  }

  // tslint:disable-next-line
  public async removeUserRole(query: any, updateQuery: string[]): Promise<User> {
    const usersModel: mongoose.Model<mongoose.Document> = mongoose.model('Users');
    await usersModel.update(query,  { $pull: { role: { $in: updateQuery } } });
    return Promise.resolve({ ...query, ...updateQuery });
  }

}

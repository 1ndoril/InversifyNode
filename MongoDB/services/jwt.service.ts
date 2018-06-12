import * as config from 'config';
import * as jwt from 'jwt-simple';
const { time } = config.get('expireTime') as { time: number };
const { secret } = config.get('jwtConf') as { secret: string };
export class JWTService {
  public getToken(user: User, ...keys: (keyof User)[]): Promise<UserData> {
    const payload: { login: string | undefined, expDate: number, isRemembered: boolean | undefined } = {
      login: user.login,
      expDate: Date.now() + time,
      isRemembered: user.remember
    };
    const resultData: UserData = {
      ...keys.reduce((result: UserData, key: keyof User) => {
        return {
          ...result,
          [key]: user[key]
        };
      }, {}),
      token: jwt.encode(payload, secret)
    };
    return Promise.resolve(resultData);
  }
}

type User = {
  _id?: string;
  name: string;
  surname?: string;
  login: string;
  password: string;
  role: string[],
  hash?: string,
  remember?: boolean,
  timeOfHashLife?: number,
};

type UserData = {
  login?: string;
  name?: string;
  surname?: string;
  token?: string;
  password?: string;
  hash?: string,
  timeOfHashLife?: number,
};

type PermissionsData = {
  [key: string]: string[]
}
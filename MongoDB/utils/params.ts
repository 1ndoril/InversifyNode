// tslint:disable-next-line
export const params: any = {};
process.argv.forEach((param: string) => {
  const item: string[] = param.split('=');
  if (item[1]) {
    params[item[0]] = item[1];
  }
});

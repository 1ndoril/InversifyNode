import * as config from 'config';
import * as crypto from 'crypto';
import * as nodemailer from 'nodemailer';
const { pass, user, port, host } = config.get('mailer');
export class MailerService {


  private _transporter: nodemailer.Transporter;

  public constructor() {
    this._transporter = nodemailer.createTransport({
      host,
      port,
      secure: true,
      auth: {
        user,
        pass
      }
    });
  }


  public async sendMail(mailOptions: { [key: string]: string | number }): Promise<{}> {
    return new Promise((res: Function, rej: Function) => {
      this._transporter.sendMail({
        ...mailOptions,
        subject: 'Planarsys , cмена пароля',
        from: `<${user}>`
      }, (err: Error | null, info: nodemailer.SentMessageInfo) => {
        if (err) {
          return rej(err);
        }
        return res(info);
      });
    });
  }

  public generateHash(secrete: string): string {
    return crypto.createHash('sha256')
      .update(`${Date.now()}
        .toString()${secrete}`)
      .digest('hex');
  }
}

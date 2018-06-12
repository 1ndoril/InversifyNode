import * as socketio from 'socket.io-client';
import * as config from 'config';

export class SocketService {
  private static _socket: SocketIOClient.Socket;

  public async connect(): Promise<void> {
    const { url, prefix } = config.get('ws');
    const cliIdentification: string = config.get('cliIdentification');

    SocketService._socket = socketio.connect(`${url}`, {
      path: `${prefix}`,
      query: `token=${cliIdentification}`
    });
    SocketService._socket.on('connect', () => this.listen());
  }

  public listen(): void {
    SocketService._socket.on('cliUpdated', () => {
      // tslint:disable-next-line
      console.log('Success');
      this.disconnect();
      return process.exit();
    });
  }

  public disconnect(): void {
    SocketService._socket.disconnect();
  }

  // tslint:disable-next-line
  public emit(action: {userLogin?: string, type: string, payload: any}) {
    SocketService._socket.emit('cliUpdate', action);
  }
}

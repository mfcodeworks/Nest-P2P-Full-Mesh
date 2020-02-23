import { SubscribeMessage, WebSocketGateway, WebSocketServer, MessageBody } from '@nestjs/websockets';
import { P2pService } from '../services/p2p.service';
import { Server } from 'socket.io';
import config from 'config';

@WebSocketGateway()
export class P2pGateway {
    constructor(private readonly p2p: P2pService) {}

    @WebSocketServer()
    private server: Server;

    afterInit() {
        this.p2p.root(this.server);
        console.log(`Running p2p demo! Open http://localhost:${config.get('port')} for client app`);
    }

    @SubscribeMessage('testing')
    handleMessage(@MessageBody() data: string): void {
        console.log('Received testing message:', data);
    }
}

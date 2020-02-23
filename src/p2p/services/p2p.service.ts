import { Injectable } from '@nestjs/common';
import SimpleSignalServer from 'simple-signal-server';
import { Server, Socket } from 'socket.io';

@Injectable()
export class P2pService {
    public seeds: Set<string> = new Set();
    private signal: SimpleSignalServer;

    root(socket: Server) {
        // Create Signall Server
        this.signal = new SimpleSignalServer(socket);
        console.log('P2P Socket Established', socket, this.signal);

        // Set Signal listeners
        this.signal.on('discover', this.discover.bind(this));
        this.signal.on('disconnect', this.disconnect.bind(this));
        this.signal.on('request', this.request.bind(this));
    }

    discover(request: any) {
        const client = request.socket.id;
        this.seeds.add(client);
        request.discover(client, { peers: Array.from(this.seeds) });
    }

    disconnect(socket: Socket) {
        const client = socket.id;
        this.seeds.delete(client);
    }

    request(request: any) {
        request.forward();
    }
}

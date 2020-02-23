import { Module } from '@nestjs/common';
import { P2pGateway } from './gateways/p2p.gateway';
import { P2pService } from './services/p2p.service';

@Module({
    providers: [
        P2pGateway,
        P2pService
    ],
})
export class P2pModule {}

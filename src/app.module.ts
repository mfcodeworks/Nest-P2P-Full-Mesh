import { Module } from '@nestjs/common';
import { P2pModule } from './p2p/p2p.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
    imports: [
        ServeStaticModule.forRoot({
            rootPath: join(__dirname, '..', 'app')
        }),
        P2pModule
    ]
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { Global } from '@nestjs/common/decorators/modules/global.decorator';
import { PubSub } from 'graphql-subscriptions';
import { PUB_SUB } from './common.constant';

@Global()
@Module({
    providers: [
        {
            provide: PUB_SUB,
            useValue: new PubSub(),
        }
    ],
    exports: [PUB_SUB]
})
export class CommonModule { }

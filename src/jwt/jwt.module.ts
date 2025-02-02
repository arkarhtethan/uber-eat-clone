import { DynamicModule, Global, Module } from '@nestjs/common';
import { CONFIG_OPTIONS } from 'src/common/common.constant';
import { JwtModuleOptions } from './jwt.interfaes';
import { JwtService } from './jwt.service';

@Module({})
@Global()
export class JwtModule {
    static forRoot (options: JwtModuleOptions): DynamicModule {
        return {
            module: JwtModule,
            exports: [
                JwtService
            ],
            providers: [
                {
                    provide: CONFIG_OPTIONS,
                    useValue: options,
                }
                , JwtService,
            ]
        }
    }
}

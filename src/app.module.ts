import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { RestaurantsModule } from './restaurants/restaurants.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === "dev" ? ".dev.env" : ".test.env"
    }),
    GraphQLModule.forRoot({
      autoSchemaFile: true,
    }),
    TypeOrmModule.forRoot({
      "type": "postgres",
      "host": "localhost",
      "port": 5432,
      "username": "root",
      "password": "root",
      "database": "nuber-eat",
      "synchronize": true,
      "logging": true,
    }),
    RestaurantsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }

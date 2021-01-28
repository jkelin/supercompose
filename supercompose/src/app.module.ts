import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { DirectorController } from './director/director.controller';
import { DirectorService } from './director/director.service';
import { SSHPoolService } from './sshConnectionPool/sshpool.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.POSTGRES_CONNECTION_STRING,
      synchronize: true,
      autoLoadEntities: true,
    }),
  ],
  controllers: [DirectorController],
  providers: [SSHPoolService, DirectorService],
})
export class AppModule {}

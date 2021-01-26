import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DirectorService } from './director/director.service';
import { DB } from './sshConnectionPool/db.service';
import { SSHPoolService } from './sshConnectionPool/sshpool.service';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  controllers: [AppController],
  providers: [AppService, SSHPoolService, DB, DirectorService],
})
export class AppModule {}

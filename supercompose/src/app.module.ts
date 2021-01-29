import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { DirectorController } from './director/director.controller';
import { DirectorService } from './director/director.service';
import { NodeAuthConfigEntity } from './node/nodeAuthConfing.entity';
import { NodeComposeConfigEntity } from './node/nodeComposeConfig.entity';
import { NodeConfigEntity } from './node/nodeConfig.entity';
import { NodeServiceConfigEntity } from './node/nodeServiceConfig.entity';
import { SuperComposeNodeEntity } from './node/SuperComposeNode.entity';
import { SSHPoolService } from './sshConnectionPool/sshpool.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.POSTGRES_CONNECTION_STRING,
      synchronize: true,
      entities: [join(__dirname, '/**/*.entity{.ts,.js}')],
      autoLoadEntities: true,
    }),
    TypeOrmModule.forFeature([
      NodeAuthConfigEntity,
      NodeComposeConfigEntity,
      NodeConfigEntity,
      NodeServiceConfigEntity,
      SuperComposeNodeEntity,
    ]),
  ],
  controllers: [DirectorController],
  providers: [SSHPoolService, DirectorService],
})
export class AppModule {}

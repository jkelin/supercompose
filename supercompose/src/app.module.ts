import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { DirectorController } from './director/director.controller';
import { DirectorService } from './director/director.service';
import { NodeController } from './node/node.controller';
import { NodeService } from './node/node.service';
import { AuthConfigEntity } from './node/authConfig.entity';
import { ComposeConfigEntity } from './node/composeConfig.entity';
import { NodeConfigEntity } from './node/nodeConfig.entity';
import { ServiceConfigEntity } from './node/nodeServiceConfig.entity';
import { NodeEntity } from './node/node.entity';
import { SSHPoolService } from './sshConnectionPool/sshpool.service';
import { ComposeResolver } from './node/compose.resolver';
import { NodeResolver } from './node/node.resolver';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    GraphQLModule.forRoot({ autoSchemaFile: true }),
    TypeOrmModule.forRoot({
      logging: 'all',
      type: 'postgres',
      url: process.env.POSTGRES_CONNECTION_STRING,
      synchronize: true,
      entities: [join(__dirname, '/**/*.entity{.ts,.js}')],
      autoLoadEntities: true,
    }),
    TypeOrmModule.forFeature([
      AuthConfigEntity,
      ComposeConfigEntity,
      NodeConfigEntity,
      ServiceConfigEntity,
      NodeEntity,
    ]),
  ],
  controllers: [DirectorController, NodeController],
  providers: [
    SSHPoolService,
    DirectorService,
    NodeService,
    ComposeResolver,
    NodeResolver,
  ],
})
export class AppModule {}

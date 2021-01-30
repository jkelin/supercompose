import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { DirectorController } from './director/director.controller';
import { DirectorService } from './director/director.service';
import { NodeController } from './node/node.controller';
import { NodeService } from './node/node.service';
import { NodeEntity } from './node/node.entity';
import { SSHPoolService } from './sshConnectionPool/sshpool.service';
import { ComposeResolver } from './node/compose.resolver';
import { NodeResolver } from './node/node.resolver';
import { ComposeEntity } from './node/compose.entity';
import { ComposeVersionEntity } from './node/composeVersion.entity';
import { NodeVersionEntity } from './node/nodeVersion.entity';
import { TenantEntity } from './node/tenant.entity';
import { CryptoService } from './crypto/crypto.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    GraphQLModule.forRoot({ autoSchemaFile: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.POSTGRES_CONNECTION_STRING,
      synchronize: true,
      entities: [join(__dirname, '/**/*.entity{.ts,.js}')],
      autoLoadEntities: true,
    }),
    TypeOrmModule.forFeature([
      ComposeEntity,
      ComposeVersionEntity,
      NodeEntity,
      NodeVersionEntity,
      TenantEntity,
    ]),
  ],
  controllers: [DirectorController, NodeController],
  providers: [
    SSHPoolService,
    DirectorService,
    NodeService,
    ComposeResolver,
    NodeResolver,
    CryptoService,
  ],
})
export class AppModule {}

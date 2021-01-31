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
import { NodeResolver } from './node/node.resolver';
import { CryptoService } from './crypto/crypto.service';
import { ComposeEntity } from './compose/compose.entity';
import { ComposeResolver } from './compose/compose.resolver';
import { ComposeVersionEntity } from './compose/composeVersion.entity';
import { TenantEntity } from './tenant/tenant.entity';
import { DeploymentEntity } from './deployment/deployment.entity';
import { DeploymentResolver } from './deployment/deployment.resolver';

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
      DeploymentEntity,
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
    DeploymentResolver,
  ],
})
export class AppModule {}

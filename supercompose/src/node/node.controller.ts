import { Body, Controller, Get, Post } from '@nestjs/common';
import { IsNotEmpty } from 'class-validator';
import { NodeService } from './node.service';

class CreateNodeDTO {
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  host: string;

  @IsNotEmpty()
  port: number;

  @IsNotEmpty()
  username: string;

  password: string;
  pkey: string;
}

@Controller('/nodes')
export class NodeController {
  constructor(private readonly nodes: NodeService) {}

  @Post('/')
  async create(@Body() body: CreateNodeDTO) {
    const nodeId = await this.nodes.createNode({
      name: body.name,
      host: body.host,
      port: body.port,
      username: body.username,
      password: body.password,
      privateKey: body.pkey,
    });
    return { nodeId };
  }
}

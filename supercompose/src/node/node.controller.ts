import { Body, Controller, Get, Post } from '@nestjs/common';
import { NodeService } from './node.service';
import { AuthDefinition } from './nodeAuthConfing.entity';

interface CreateNodeDTO {
  name: string;
  auth: AuthDefinition;
}

@Controller('/nodes')
export class NodeController {
  constructor(private readonly nodes: NodeService) {}

  @Post('/')
  async create(@Body() body: CreateNodeDTO) {
    console.warn(body.name, body.auth);
    const nodeId = await this.nodes.createNode(body.name, body.auth);
    return { nodeId };
  }
}

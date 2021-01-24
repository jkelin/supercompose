import { ConnectConfig } from "ssh2";

export interface NodeConfig {
  id: string;
  auth: ConnectConfig;
  composes: ComposeConfig[];
}

export interface ServiceConfig {
  enabled: boolean;
  serviceName: string;
}

export interface ComposeConfig {
  id: string;
  name: string;
  directory: string;
  content: string;
  serviceConfig: ServiceConfig;
}

const testCompose = `
version: "3.9"
services:
  redis:
    image: "redis:alpine"
    network_mode: host
`;

const testNode: NodeConfig = {
  id: "e35e3427-a80c-475c-9011-8cf606d5d636",
  auth: {
    host: process.env.SERVER_HOST,
    port: parseInt(process.env.SERVER_PORT!),
    username: process.env.SERVER_USERNAME,
    password: process.env.SERVER_PASSWORD,
    // privateKey: require("fs").readFileSync("/here/is/my/key"),
    // privateKey: Buffer.from(process.env.SERVER_PKEY!, "utf-8"),
  },
  composes: [
    {
      id: "2827a9e8-a5ac-4ba9-9fb8-47bb7826a8d3",
      directory: "/etc/docker/compose/testicek",
      name: "Testicek",
      content: testCompose,
      serviceConfig: {
        enabled: true,
        serviceName: "compose-testicek",
      },
    },
  ],
};

export class DB {
  async getNodes(): Promise<NodeConfig[]> {
    return [testNode];
  }

  async getNodeById(id: string): Promise<NodeConfig> {
    if (id === testNode.id) {
      return testNode;
    } else {
      throw new Error(`Node by id ${id} not found`);
    }
  }
}

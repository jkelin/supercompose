import { ConnectConfig } from "ssh2";

interface NodeConfig {
  id: string;
  auth: ConnectConfig;
}

export class DB {
  async getEnabledNodes(): Promise<NodeConfig[]> {
    return [
      {
        id: "e35e3427-a80c-475c-9011-8cf606d5d636",
        auth: {
          host: process.env.SERVER_HOST,
          port: parseInt(process.env.SERVER_PORT!),
          username: process.env.SERVER_USERNAME,
          password: process.env.SERVER_PASSWORD,
          // privateKey: require("fs").readFileSync("/here/is/my/key"),
          // privateKey: Buffer.from(process.env.SERVER_PKEY!, "utf-8"),
        },
      },
    ];
  }

  async getNode(id: string): Promise<NodeConfig> {
    return {
      id: "e35e3427-a80c-475c-9011-8cf606d5d636",
      auth: {
        host: process.env.SERVER_HOST,
        port: parseInt(process.env.SERVER_PORT!),
        username: process.env.SERVER_USERNAME,
        password: process.env.SERVER_PASSWORD,
        // privateKey: require("fs").readFileSync("/here/is/my/key"),
        // privateKey: Buffer.from(process.env.SERVER_PKEY!, "utf-8"),
      },
    };
  }
}

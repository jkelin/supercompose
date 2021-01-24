import { DB } from "./db";
import { NodeManager } from "./nodeManager";

require("dotenv").config();

async function main() {
  const db = new DB();
  const mgr = new NodeManager(db);
  await mgr.start();

  process.once("SIGINT", async () => {
    return mgr.stop();
  });

  while (true) {
    try {
      const resp = await mgr.runCommandOn(
        "e35e3427-a80c-475c-9011-8cf606d5d636",
        "uptime"
      );
      console.warn(resp.stdout);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (ex) {
      console.error("Exception in main loop", ex);
    }
  }
}

process.on("SIGINT", function () {
  console.log("SIGINT");
});

process.on("SIGKILL", function () {
  console.log("SIGKILL");
});

process
  .on("unhandledRejection", (reason, p) => {
    console.error(reason, "Unhandled Rejection at Promise", p);
  })
  .on("uncaughtException", (err) => {
    console.error(err, "Uncaught Exception thrown");
    process.exit(1);
  });

main()
  .then(() => {
    console.info("All done");
  })
  .catch((ex) => {
    console.error("Fatal", ex);
    process.exit(1);
  });

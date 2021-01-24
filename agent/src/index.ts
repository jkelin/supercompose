import { DB } from "./db";
import { Director } from "./director";
import { NodeManager } from "./nodeManager";

async function main() {
  const db = new DB();
  const mgr = new NodeManager(db);
  const director = new Director(db, mgr);

  await mgr.start();
  await director.start();

  await Promise.race([
    new Promise((resolve) => process.once("SIGINT", resolve)),
    new Promise((resolve) => process.once("SIGKILL", resolve)),
  ]);

  await director.stop();
  await mgr.stop();
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

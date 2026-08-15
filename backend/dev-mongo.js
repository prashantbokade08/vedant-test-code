import { mkdirSync } from "node:fs";
import { MongoMemoryServer } from "mongodb-memory-server";
import { startServer } from "./server.js";

const dbPath = "./.mongo-data";
mkdirSync(dbPath, { recursive: true });

const mongod = await MongoMemoryServer.create({
  instance: {
    port: 27017,
    dbName: "todo-prod",
    dbPath,
  },
});

const uri = mongod.getUri("todo-prod");
console.log(`Memory MongoDB running at ${uri}`);
startServer(uri);

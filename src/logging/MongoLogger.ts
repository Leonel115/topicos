import { Collection, MongoClient } from "mongodb";
import { ILogger, LogEntry } from "./ILogger";

// Logger que persiste entradas en una colección de MongoDB.
export class MongoLogger implements ILogger {
  private collection?: Collection<LogEntry>;

  constructor(private readonly uri: string, private readonly dbName = "image_api", private readonly collectionName = "logs") {}

  async init(): Promise<void> {
    if (this.collection) return;
    const client = new MongoClient(this.uri);
    await client.connect();
    this.collection = client.db(this.dbName).collection<LogEntry>(this.collectionName);
  }

  async log(entry: LogEntry): Promise<void> {
    if (!this.collection) {
      await this.init();
    }
    await this.collection!.insertOne(entry);
  }
}

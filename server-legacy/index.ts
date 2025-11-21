import "dotenv/config";
import express from "express";
import cors from "cors";
import mongodb from "mongodb";
import type { MongoClient as MongoClientType, Db as DbType, Collection as CollectionType, Document } from "mongodb";

const { MongoClient } = mongodb;
import { requireAuth } from "@clerk/express";

// Environment variables (configure these in a .env file or your hosting provider)
const mongoUri = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || "mamacare";
const PORT = process.env.PORT || 4000;

if (!mongoUri) {
  throw new Error("MONGODB_URI environment variable is not set");
}
const resolvedMongoUri = mongoUri as string;

let mongoClient: MongoClientType | null = null;
let mongoDb: DbType | null = null;

async function connectToMongo() {
  if (mongoDb && mongoClient) {
    return { client: mongoClient, db: mongoDb };
  }

  mongoClient = new MongoClient(resolvedMongoUri);
  await mongoClient.connect();
  mongoDb = mongoClient.db(MONGODB_DB);
  return { client: mongoClient, db: mongoDb };
}

async function getCollection<T extends Document = Document>(
  name: string
): Promise<CollectionType<T>> {
  const { db } = await connectToMongo();
  return db.collection<T>(name);
}

const app = express();

app.use(
  cors({
    origin: "*", // tighten this in production
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Example protected route using Clerk + MongoDB
app.post(
  "/api/pregnancy-profile",
  requireAuth(),
  async (req, res) => {
    try {
      const userId = (req as any).auth.userId as string | undefined;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const profile = req.body;

      if (!profile?.email) {
        return res.status(400).json({ error: "Email is required" });
      }

      const collection = await getCollection("pregnancy_profiles");

      const doc = {
        ...profile,
        userId,
        createdAt: new Date(),
      };

      const result = await collection.insertOne(doc);

      return res.status(200).json({
        success: true,
        message: "Pregnancy profile saved successfully",
        data: {
          id: result.insertedId,
          ...doc,
        },
      });
    } catch (error) {
      console.error("Error saving pregnancy profile:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Fallback 404 for unknown /api routes
app.use("/api", (_req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.listen(PORT, () => {
  console.log(`API server listening on http://localhost:${PORT}`);
});



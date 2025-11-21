import "dotenv/config";
import express, { type Request, type Response } from "express";
import cors from "cors";
import { MongoClient, Collection, Document } from "mongodb";
import { requireAuth } from "@clerk/express";

const PORT = Number(process.env.PORT) || 4000;
const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || "mamacare";

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is not defined in environment variables");
}

const client = new MongoClient(MONGODB_URI);
let cachedDb: Promise<Collection<Document>> | null = null;

async function getProfilesCollection() {
  if (!cachedDb) {
    cachedDb = client.connect().then(() => client.db(MONGODB_DB).collection<Document>("pregnancy_profiles"));
  }

  return cachedDb;
}

const app = express();

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

app.post("/api/pregnancy-profile", requireAuth(), async (req: Request, res: Response) => {
  try {
    const authUserId = (req as any).auth.userId as string | undefined;
    if (!authUserId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const profile = req.body ?? {};
    if (!profile.email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const collection = await getProfilesCollection();
    const doc = {
      ...profile,
      userId: authUserId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await collection.insertOne(doc);
    return res.status(201).json({
      success: true,
      message: "Pregnancy profile saved successfully",
      data: { id: result.insertedId, ...doc },
    });
  } catch (error) {
    console.error("Failed to save pregnancy profile:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.use("/api", (_req: Request, res: Response) => {
  res.status(404).json({ error: "Not found" });
});

app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});


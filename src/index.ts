import express, { Request, Response } from "express";
import dotenv from "dotenv";
// Update the path below to the correct relative path where getRecentTransfers is defined, e.g.:
import { getRecentTransfers } from "./getRecentTransfers";

dotenv.config();

const app = express();
const PORT = 3000;

app.get("/rwa/recent-transfers", async (req: Request, res: Response) => {
  try {
    const transfers = await getRecentTransfers();
    res.json(transfers);
  } catch (error) {
    console.error("Erro ao buscar transfers:", error);
    res.status(500).json({ error: "Erro interno ao buscar transfers" });
  }
});

app.listen(PORT, () => {
  console.log(`✅ RWA Tracker API rodando em http://localhost:${PORT}`);
});

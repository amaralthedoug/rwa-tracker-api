// src/routes/latestRWA.ts
import express from "express";
import { getLatestContractsOnPolygon } from "../controllers/getLatestContractsOnPolygon";

const router = express.Router();

router.get("/rwa/latest", async (req, res) => {
  try {
    const contracts = await getLatestContractsOnPolygon();
    res.json(contracts);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar contratos." });
  }
});

export default router;

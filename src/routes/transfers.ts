import { Router } from "express";
import { getRecentTransfers } from "../getRecentTransfers";
const router = Router();

router.get("/", async (_req, res) => {
  try {
    const transfers = await getRecentTransfers();
    res.json(transfers);
  } catch (error) {
    console.error("Erro no endpoint /transfers:", error);
    res.status(500).json({ error: "Erro interno no servidor" });
  }
});

export default router;

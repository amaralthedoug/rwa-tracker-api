// src/index.ts
import express from "express";
import dotenv from "dotenv";
import transfersRoute from "./routes/transfers";
import latestRWA from "./routes/latestRWA";

dotenv.config();
const app = express();
const PORT = 3000;

app.use("/transfers", transfersRoute); // <-- Está correto assim

app.use(latestRWA);

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});

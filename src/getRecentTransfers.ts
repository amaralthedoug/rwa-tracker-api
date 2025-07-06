import { ethers } from "ethers";
import * as fs from "fs";
import * as path from "path";
import dotenv from "dotenv";

dotenv.config(); // Garante que as variáveis .env sejam carregadas

// Tipagem para os contratos RWA
interface ContractInfo {
  address: string;
  name: string;
  symbol: string;
  chain: string;
  metadata?: any;
}

// Garante que a RPC_URL está presente
if (!process.env.RPC_URL) {
  throw new Error("RPC_URL não definida no .env");
}

console.log("Conectando à RPC_URL:", process.env.RPC_URL); // Debug opcional

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);

// Caminho absoluto do arquivo contracts.json
const contractsPath = path.resolve(__dirname, "../contracts.json");

let rwaContracts: ContractInfo[] = [];

try {
  const rawData = fs.readFileSync(contractsPath, "utf-8");
  const parsed = JSON.parse(rawData);

  if (Array.isArray(parsed)) {
    rwaContracts = parsed;
  } else if (parsed && parsed.address) {
    rwaContracts = [parsed]; // Suporta um único contrato no arquivo
  } else {
    console.warn("contracts.json não é um array ou objeto válido.");
  }
} catch (err) {
  console.error("Erro ao carregar contracts.json:", err);
}

const ERC721_ABI = [
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
];

// Buscar últimas transferências dos contratos RWA
export async function getRecentTransfers() {
  const results: any[] = [];

  if (!rwaContracts.length) {
    console.warn("Nenhum contrato válido carregado. Retornando lista vazia.");
    return results;
  }

  const latestBlock = await provider.getBlockNumber();
  const fromBlock = latestBlock - 5000;

  for (const contractInfo of rwaContracts) {
    try {
      const contract = new ethers.Contract(contractInfo.address, ERC721_ABI, provider);

      const events = await contract.queryFilter(
        contract.filters.Transfer(),
        fromBlock,
        latestBlock
      );

      const enriched = events
        .filter((event): event is ethers.EventLog => "args" in event)
        .map((event) => {
          const from = event.args?.from;
          const to = event.args?.to;

          return {
            token: contractInfo.address,
            collectionName: contractInfo.name,
            symbol: contractInfo.symbol,
            lastTxHash: event.transactionHash,
            timestamp: new Date().toISOString(),
            from,
            to,
            chain: contractInfo.chain,
            estimatedValueUSD: 1450.0,
            metadata: contractInfo.metadata,
          };
        });

      results.push(...enriched);
    } catch (err) {
      console.error(`Erro ao processar contrato ${contractInfo.address}:`, err);
    }
  }

  return results;
}

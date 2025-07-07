import { ethers } from "ethers";
import dotenv from "dotenv";

dotenv.config();

const provider = new ethers.JsonRpcProvider(process.env.POLYGON_RPC_URL);

const MINIMAL_ABI = [
  "function supportsInterface(bytes4 interfaceID) external view returns (bool)",
  "function name() view returns (string)",
  "function symbol() view returns (string)"
];

const ERC721_INTERFACE_ID = "0x80ac58cd";
const ERC1155_INTERFACE_ID = "0xd9b67a26";

// Palavras-chave associadas a RWAs reais
const rwaKeywords = [
  "residential",
  "property",
  "real estate",
  "vehicle",
  "art",
  "ownership",
  "asset",
  "land",
  "building",
  "house",
];

export async function getRecentTransfers() {
  const latestBlock = await provider.getBlockNumber();
  const blocksToCheck = 150; // Últimos blocos (~5 minutos)
  const fromBlock = latestBlock - blocksToCheck;
  const toBlock = latestBlock;

  console.log(`🔎 Buscando contratos entre blocos ${fromBlock} e ${toBlock}...`);

  const events = await provider.getLogs({
    fromBlock,
    toBlock,
    topics: [
      ethers.id("ContractCreated(address,address,string,string,uint256)").slice(0, 66)
    ]
  });

  const creations: any[] = [];

  for (let i = 0; i < events.length; i++) {
    const log = events[i];
    const address = log.address;

    console.log(`🔍 Verificando contrato ${address}`);

    try {
      const contract = new ethers.Contract(address, MINIMAL_ABI, provider);

      const [is721, is1155] = await Promise.all([
        contract.supportsInterface(ERC721_INTERFACE_ID).catch(() => false),
        contract.supportsInterface(ERC1155_INTERFACE_ID).catch(() => false),
      ]);

      if (!is721 && !is1155) {
        console.log(`❌ ${address} não é ERC721 nem ERC1155`);
        continue;
      }

      const [name, symbol] = await Promise.all([
        contract.name().catch(() => "Unknown"),
        contract.symbol().catch(() => "UNK")
      ]);

      const metadata = `${name} ${symbol}`.toLowerCase();
      const isRWA = rwaKeywords.some(keyword => metadata.includes(keyword));

      if (isRWA) {
        console.log(`✅ RWA encontrado: ${name} (${symbol})`);
        creations.push({
          address,
          standard: is721 ? "ERC721" : "ERC1155",
          name,
          symbol,
          chain: "Polygon",
        });
      } else {
        console.log(`ℹ️ Ignorado: ${name} (${symbol}) não é RWA`);
      }

      if (creations.length >= 10) {
        console.log("🎯 Limite de 10 contratos RWA atingido.");
        break;
      }

    } catch (err) {
      console.warn(`⚠️ Erro ao verificar contrato ${address}:`, err);
    }
  }

  console.log(`📦 Total de contratos RWA retornados: ${creations.length}`);
  return creations;
}

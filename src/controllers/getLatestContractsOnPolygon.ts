import { ethers } from "ethers";
import dotenv from "dotenv";
import { fetchContractMetadata } from "../utils/fetchContractMetadata";

dotenv.config();

const provider = new ethers.JsonRpcProvider(process.env.POLYGON_RPC_URL);

const MINIMAL_ABI = [
  "function supportsInterface(bytes4 interfaceID) external view returns (bool)",
  "function name() view returns (string)",
  "function symbol() view returns (string)",
];

const ERC721_INTERFACE_ID = "0x80ac58cd";
const ERC1155_INTERFACE_ID = "0xd9b67a26";

const rwaKeywordsByCategory = {
  realEstate: [
    "residential",
    "property",
    "real estate",
    "land",
    "building",
    "house",
    "home",
    "estate",
    "unit",
    "plot",
  ],
  vehicles: ["car", "vehicle", "truck", "boat", "yacht"],
  art: ["art", "artwork", "painting", "gallery"],
  fractional: ["ownership", "fraction", "share", "divided"],
  assets: ["asset", "tokenized", "certificate", "bond"],
};

const rwaEventKeywords = ["registered", "mint", "asset", "created"];

function matchCategories(text: string) {
  const matchedCategories: string[] = [];
  for (const [category, keywords] of Object.entries(rwaKeywordsByCategory)) {
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        matchedCategories.push(category);
        break;
      }
    }
  }
  return matchedCategories;
}

export async function getLatestContractsOnPolygon() {
  console.log("🚀 Iniciando busca por contratos RWA na Polygon");

  const latestBlock = await provider.getBlockNumber();
  const blocksToCheck = 500;
  const fromBlock = latestBlock - blocksToCheck;

  console.log(
    `🔍 Buscando logs de criação de contratos entre os blocos ${fromBlock} - ${latestBlock}`
  );

  const logs = await provider.getLogs({
    fromBlock,
    toBlock: latestBlock,
    address: undefined,
    topics: [null],
  });

  const creations: any[] = [];
  const seenContracts = new Set();

  for (const log of logs) {
    const address = log.address;
    if (seenContracts.has(address)) continue;
    seenContracts.add(address);

    try {
      const contract = new ethers.Contract(address, MINIMAL_ABI, provider);

      const [is721, is1155] = await Promise.all([
        contract.supportsInterface(ERC721_INTERFACE_ID).catch(() => false),
        contract.supportsInterface(ERC1155_INTERFACE_ID).catch(() => false),
      ]);

      if (!is721 && !is1155) continue;

      const [name, symbol] = await Promise.all([
        contract.name().catch(() => null),
        contract.symbol().catch(() => null),
      ]);

      const metadataText = `${name || ""} ${symbol || ""}`.toLowerCase();
      const matchedCategories = matchCategories(metadataText);

      const enrichedMetadata = await fetchContractMetadata(address);
      let hasRwaEvent = false;

      if (enrichedMetadata?.abi) {
        try {
          const fullContract = new ethers.Contract(
            address,
            enrichedMetadata.abi,
            provider
          );
          hasRwaEvent = fullContract.interface.fragments.some(
            (f) =>
              f.type === "event" &&
              rwaEventKeywords.some((kw) =>
                (
                  (f as ethers.EventFragment).name?.toLowerCase() || ""
                ).includes(kw)
              )
          );
        } catch {}
      }

      const metadataIsValid =
        enrichedMetadata &&
        Object.values(enrichedMetadata).some(
          (val) => val !== undefined && val !== null
        );
      const isRwa = matchedCategories.length > 0 || hasRwaEvent;

      if (isRwa && metadataIsValid) {
        console.log(
          `✅ RWA detectado: ${name || "Sem nome"} (${
            symbol || "Sem símbolo"
          }) | Categorias: ${matchedCategories.join(", ")}`
        );

        creations.push({
          address,
          standard: is721 ? "ERC721" : "ERC1155",
          name: name || null,
          symbol: symbol || null,
          chain: "Polygon",
          categories: matchedCategories,
          metadata: enrichedMetadata || null,
        });

        if (creations.length >= 10) break;
      }
    } catch (err) {
      console.warn(`⚠️ Erro ao verificar contrato ${address}`);
    }
  }

  console.log(
    `🏁 Busca concluída. Total de contratos RWA retornados: ${creations.length}`
  );
  return creations;
}

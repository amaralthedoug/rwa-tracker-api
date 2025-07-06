import { config } from 'dotenv';
import { Alchemy, Network, Nft } from 'alchemy-sdk';
import contracts from '../contracts.json';

config();

// Tipagem para o contrato no JSON
interface RWAContract {
  address: string;
  name: string;
  symbol: string;
  chain: string;
  metadata: {
    assetType: string;
    location: string;
    fractionSize: string;
    issuer: string;
  };
}

// Configuração do Alchemy
const settings = {
  apiKey: process.env.ALCHEMY_API_KEY,
  network: Network.MATIC_MAINNET,
};

const alchemy = new Alchemy(settings);

async function fetchAndFilterNFTs() {
  try {
    const rwaContracts: RWAContract[] = contracts;

    const result: {
      contract: RWAContract;
      nfts: Nft[];
    }[] = [];

    for (const contract of rwaContracts) {
      const response = await alchemy.nft.getNftsForContract(contract.address);
      const filtered = response.nfts.filter((nft) =>
        nft.rawMetadata?.assetType === 'Imóvel'
      );

      if (filtered.length > 0) {
        result.push({ contract, nfts: filtered });
      }
    }

    // Mostra os resultados com formatação
    console.dir(
      result.map((r) => ({
        contract: r.contract.name,
        address: r.contract.address,
        total: r.nfts.length,
        samples: r.nfts.map((n) => ({
          name: n.title,
          id: n.tokenId,
          metadata: n.rawMetadata,
        })),
      })),
      { depth: null }
    );
  } catch (err) {
    console.error('❌ Error fetching NFTs', err);
  }
}

fetchAndFilterNFTs();

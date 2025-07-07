// src/utils/fetchNFTsForContract.ts
import axios from "axios";

export async function fetchNFTsForContract(address: string): Promise<any> {
  const apiKey = process.env.ALCHEMY_API_KEY;
  const url = `https://polygon-mainnet.g.alchemy.com/nft/v3/${apiKey}/getNFTsForContract?contractAddress=${address}&withMetadata=true&limit=1`;

  try {
    const response = await axios.get(url);
    return response.data.nfts?.[0]?.rawMetadata || null;
  } catch (error) {
    console.warn(`❌ Erro ao buscar NFTs do contrato ${address}:`, error);
    return null;
  }
}

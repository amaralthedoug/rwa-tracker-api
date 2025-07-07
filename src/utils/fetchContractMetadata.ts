import axios from "axios";

export async function fetchContractMetadata(address: string): Promise<any> {
  const apiKey = process.env.ALCHEMY_API_KEY;
  const baseUrl = `https://polygon-mainnet.g.alchemy.com/nft/v3/${apiKey}/getContractMetadata`;

  try {
    const response = await axios.get(`${baseUrl}?contractAddress=${address}`);
    return response.data?.contractMetadata || null;
  } catch (error) {
    if (error instanceof Error) {
      console.warn(`❌ Erro ao buscar metadata do contrato ${address}:`, error.message);
    } else {
      console.warn(`❌ Erro ao buscar metadata do contrato ${address}:`, error);
    }
    return null;
  }
}

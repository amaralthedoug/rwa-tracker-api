"use strict";
// src/rwaFetcher.js
require("dotenv").config();
const { Alchemy, Network } = require("alchemy-sdk");
const settings = {
    apiKey: process.env.ALCHEMY_API_KEY,
    network: Network.MATIC_MAINNET, // Polygon
};
const alchemy = new Alchemy(settings);
// Exemplo de endereço de contrato de NFT em Polygon com metadata visível
const exampleContract = "0x2953399124F0cBB46d2CbACD8A89cF0599974963"; // OpenSea shared store
async function fetchAndFilterNFTs() {
    try {
        const response = await alchemy.nft.getNftsForContract(exampleContract, {
            withMetadata: true,
            pageSize: 10, // ou 100
        });
        const nfts = response.nfts;
        const filtered = nfts.filter(nft => {
            const metadata = nft?.rawMetadata;
            return metadata && metadata.assetType === "Imóvel";
        });
        console.log(`Found ${filtered.length} RWAs`);
        console.dir(filtered.map(n => ({
            tokenId: n.tokenId,
            name: n.rawMetadata.name,
            assetType: n.rawMetadata.assetType,
        })), { depth: null });
    }
    catch (err) {
        console.error("Error fetching NFTs", err);
    }
}
fetchAndFilterNFTs();

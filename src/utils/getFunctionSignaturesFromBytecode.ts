import { ethers } from "ethers";

export async function getFunctionSignaturesFromBytecode(
  address: string,
  provider: ethers.Provider
): Promise<string[]> {
  const code = await provider.getCode(address);
  const selectorRegex = /(?<=63)([0-9a-f]{8})/g; // captura opcodes PUSH4 (function selectors)

  const matches = code.match(selectorRegex) || [];
  return [...new Set(matches.map(s => "0x" + s))]; // remove duplicatas
}

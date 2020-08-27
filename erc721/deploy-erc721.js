const { ethers, providers } = require('ethers');
const config = require('./../config');
const fs = require('fs');
const path = require('path');
const appRootPath = require('app-root-path');

const ethProvider = new providers.JsonRpcProvider(
  config.eth_provider,
);

const getERC721Abi = () => {
  const json = fs.readFileSync(path.join(appRootPath.path, './erc721/build/_ERC721_sol_ERC721.abi'));
  return JSON.parse(json.toString());
};

const getERC721Bin = () => {
  let bin = ''
  try {
    bin = fs.readFileSync(path.join(appRootPath.path, './erc721/build/_ERC721_sol_ERC721.bin'));
  } catch (e) { console.error('ERC721 compile bin file missing'); }
  return bin.toString();
};

const getERC721RemixBin = () => {
  let json = '{}';
  try {
    json = fs.readFileSync(path.join(appRootPath.path, './erc721/build/ERC721.json'));
  } catch (e) { console.error('ERC721 remix bin file missing'); }
  return JSON.parse(json.toString());
};

async function main() {
  const abi = getERC721Abi();
  const bin = getERC721Bin();
  const remixBin = getERC721RemixBin();
  if (!bin && !remixBin) {
    console.error('No bin file found');
    return;
  }  

  let wallet = new ethers.Wallet(config.privateKey, ethProvider);
  const contractFactory = new ethers.ContractFactory(abi, bin || remixBin.object, wallet);
  const result = await contractFactory.deploy('SAILOR_MOON_WAND', 'SMW');
  if (result && result.deployTransaction) {
    delete result.deployTransaction.data;
  }
  console.info(result);
}

main();
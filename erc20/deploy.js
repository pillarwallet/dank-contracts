const { ethers, providers } = require('ethers');
const config = require('./../config');
const fs = require('fs');
const path = require('path');
const appRootPath = require('app-root-path');

const ethProvider = new providers.JsonRpcProvider(
  config.eth_provider,
);

const getAbi = () => {
  const json = fs.readFileSync(path.join(appRootPath.path, './erc20/build/_ERC20_sol_ERC20.abi'));
  return JSON.parse(json.toString());
};

const getBin = () => {
  let bin = ''
  try {
    bin = fs.readFileSync(path.join(appRootPath.path, './erc20/build/_ERC20_sol_ERC20.bin'));
  } catch (e) { console.error('ERC20 compile bin file missing'); }
  return bin.toString();
};

const getRemixBin = () => {
  let json = '{}';
  try {
    json = fs.readFileSync(path.join(appRootPath.path, './erc20/build/ERC20.json'));
  } catch (e) { console.error('ERC20 remix bin file missing'); }
  return JSON.parse(json.toString());
};

async function main() {
  const abi = getAbi();
  const bin = getBin();
  const remixBin = getRemixBin();
  if (!bin && !remixBin) {
    console.error('No bin file found');
    return;
  }  

  let wallet = new ethers.Wallet(config.ownerPrivateKey, ethProvider);
  const contractFactory = new ethers.ContractFactory(abi, bin || remixBin.object, wallet);
  const result = await contractFactory.deploy('Stonk', 'STNK');
  if (result && result.deployTransaction) {
    delete result.deployTransaction.data;
  }
  console.info(result);
}

main();
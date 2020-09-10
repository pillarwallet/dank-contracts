const { ethers, providers } = require('ethers');
const config = require('../../../config');
const fs = require('fs');
const path = require('path');
const appRootPath = require('app-root-path');

const ethProvider = new providers.JsonRpcProvider(
  config.eth_provider,
);

const getAbi = () => {
  const json = fs.readFileSync(path.join(appRootPath.path, './build/__build_UniswapV2Router_sol_UniswapV2Router.abi'));
  return JSON.parse(json.toString());
};

const getBin = () => {
  let bin = ''
  try {
    bin = fs.readFileSync(path.join(appRootPath.path, './build/__build_UniswapV2Router_sol_UniswapV2Router.bin'));
  } catch (e) { console.error('Uniswap factory compile bin file missing'); }
  return bin.toString();
};

const getRemixBin = () => {
  let json = '{}';
  try {
    json = fs.readFileSync(path.join(appRootPath.path, './build/UniswapRouter.json'));
  } catch (e) { console.error('Uniswap factory remix bin file missing'); }
  return JSON.parse(json.toString());
};

async function main () {
  const abi = getAbi();
  const bin = getBin();
  const remixBin = getRemixBin();
  if (!bin && !remixBin) {
    console.error('No bin file found');
    return;
  }  


  let wallet = new ethers.Wallet(config.ownerPrivateKey, ethProvider);
  const contractFactory = new ethers.ContractFactory(abi, bin || remixBin.object, wallet);
  const result = await contractFactory.deploy(config.uniswapFactory);
  if (result && result.deployTransaction) {
    delete result.deployTransaction.data;
  }
  console.info(result);
}

main();
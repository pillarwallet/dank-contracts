const {
  config,
  ethers,
  ethers: {
    utils: { formatEther, parseEther },
    provider,
  },
} = require('hardhat');

const { chainId } = config.networks.hardhat;
const TYPED_DATA_DOMAIN_NAME = 'test';
const TYPED_DATA_DOMAIN_VERSION = '1';
const EIP712_DOMAIN_TYPE_NAME = 'EIP712Domain';
const EIP712_DOMAIN_TYPE_PROPERTIES = [
  {
    name: 'name',
    type: 'string',
  },
  {
    name: 'version',
    type: 'string',
  },
  {
    name: 'chainId',
    type: 'uint256',
  },
  {
    name: 'verifyingContract',
    type: 'address',
  },
];

async function processTx(txPromise) {
  const tx = await txPromise;
  const { gasPrice } = tx;
  const receipt = await tx.wait();
  const { gasUsed } = receipt;

  return {
    ...receipt,
    totalCost: gasPrice.mul(gasUsed),
  };
}

function buildTypedData(domain, primaryType, types, message) {
  return {
    primaryType,
    domain,
    types: Object.assign(
      { [EIP712_DOMAIN_TYPE_NAME]: EIP712_DOMAIN_TYPE_PROPERTIES },
      Array.isArray(types) ? { [primaryType]: types } : types,
    ),
    message,
  };
}

function createTypedDataFactory(contract, primaryType, types) {
  return {
    createTypedData(message) {
      return buildTypedData(
        {
          name: TYPED_DATA_DOMAIN_NAME,
          version: TYPED_DATA_DOMAIN_VERSION,
          chainId,
          verifyingContract: contract.address,
        },
        primaryType,
        types,
        message,
      );
    },
    signTypeData(signer, message) {
      // console.log(this.createTypedData(message).types);
      return provider.send('eth_signTypedData', [signer, this.createTypedData(message)]);
    },
  };
}

async function deployContract(name, args = [], deployer = null) {
  let factory = await ethers.getContractFactory(name);

  if (deployer) {
    factory = factory.connect(deployer);
  }

  return await factory.deploy(...(args || []));
}

function getMemeTokenHash(ERC721ContractAddress, memeId) {
  const packedParams = ethers.utils.solidityPack(['address', 'uint256'], [ERC721ContractAddress, memeId]);
  return ethers.utils.keccak256(packedParams);
}

function setDeadline(addMinutes) {
  return Math.round((+new Date() + 1000 * 60 * addMinutes) / 1000);
}

function fromWei(number) {
  return formatEther(number);
}

function toWei(number) {
  return parseEther(number.toString());
}

module.exports = {
  ZERO_ADDRESS: `0x${'0'.repeat(40)}`,
  processTx,
  createTypedDataFactory,
  deployContract,
  getMemeTokenHash,
  setDeadline,
  fromWei,
  toWei,
};

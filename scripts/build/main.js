const { resolve, join } = require('path');
const { readdir, readJSON, writeFile } = require('fs-extra');
const { utils: { solidityKeccak256 } } = require('ethers');
const templates = require('./templates');

const ROOT_PATH = resolve(__dirname, '../..');
const BUILD_ROOT_PATH = join(ROOT_PATH, 'build');
const COMPILED_ROOT_PATH = join(ROOT_PATH, 'compiled');
const CONTRACTS_BUILD_PATH = join(BUILD_ROOT_PATH, 'contracts');
const CONSTANTS_BUILD_PATH = join(BUILD_ROOT_PATH, 'constants');

async function main() {
  const files = await readdir(COMPILED_ROOT_PATH);
  let contractsOldMap;

  try {
    // eslint-disable-next-line global-require,import/no-dynamic-require
    contractsOldMap = require(`${CONTRACTS_BUILD_PATH}.js`);
  } catch (err) {
    contractsOldMap = {};
  }

  const contracts = (
    await Promise.all(
      files
        .map((file) => (async () => {
          const {
            abi,
            networks,
            bytecode,
            contractName: name,
          } = await readJSON(join(COMPILED_ROOT_PATH, file));

          const addressesOld = contractsOldMap[name]
            ? contractsOldMap[name].addresses
            : {};

          const byteCodeHash = solidityKeccak256(['bytes'], [bytecode]);

          const addresses = {
            ...addressesOld,
            ...Object
              .entries(networks)
              .reduce((result, [id, { address }]) => ({
                ...result,
                [id]: address,
              }), {}),
          };

          return {
            name,
            abi,
            byteCodeHash,
            addresses,
          };
        })()),
    )
  );

  const contractNames = contracts.map(({ name }) => name);

  {
    const filePath = `${CONTRACTS_BUILD_PATH}.js`;

    await writeFile(
      filePath,
      templates.contractsJs(
        contracts
          .reduce((result, { name, ...rest }) => ({
            ...result,
            [name]: rest,
          }), {}),
      ),
    );
  }

  {
    const filePath = `${CONSTANTS_BUILD_PATH}.js`;
    await writeFile(
      filePath,
      templates.constantsJs(contractNames),
    );
  }
}

module.exports = main;

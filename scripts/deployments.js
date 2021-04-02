const { resolve, join } = require('path');
const { readdir, readJSON } = require('fs-extra');

const ROOT_PATH = resolve(__dirname, '..');
const BUILD_ROOT_PATH = join(ROOT_PATH, 'build');

async function main() {
  let files = await readdir(BUILD_ROOT_PATH);
  files = files.filter((file) => file.endsWith('.json'));

  for (const file of files) {
    const { contracts, name, chainId } = await readJSON(join(BUILD_ROOT_PATH, file));

    console.log(`${name} (chainId: ${chainId})`);
    console.log('-'.repeat(64));

    Object.entries(contracts).forEach(([contractName, contractData]) => {
      console.log(`${contractName.padStart(20, ' ')}  ${contractData.address}`);
    });

    console.log(' ');
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

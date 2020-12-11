const { deployments } = require('hardhat');
const fsExtra = require('fs-extra');
const path = require('path');
const config = require('../config');

async function main() {
  const all = await deployments.all();
  await fsExtra.remove(config.artifactsPath);
  await fsExtra.ensureDir(config.artifactsPath);

  for (const contractName of Object.keys(all)) {
    const artifact = await deployments.getArtifact(contractName);
    const artifactPath = path.join(config.artifactsPath, `${contractName}.json`);
    await fsExtra.writeJSON(artifactPath, artifact, {
      spaces: 2,
    });
  }

  // eslint-disable-next-line no-console
  console.log('artifacts saved');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

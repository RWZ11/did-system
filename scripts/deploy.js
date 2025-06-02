const hre = require("hardhat");

async function main() {
  // 部署DID注册表合约
  const DIDRegistry = await hre.ethers.getContractFactory("DIDRegistry");
  const registry = await DIDRegistry.deploy();
  await registry.waitForDeployment();
  console.log("DID Registry deployed to:", await registry.getAddress());
  
  // 将合约地址保存到配置文件中
  const fs = require('fs');
  const config = {
    contractAddress: await registry.getAddress()
  };
  
  fs.writeFileSync('contract-config.json', JSON.stringify(config, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

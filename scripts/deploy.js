async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  const DID = await ethers.getContractFactory("DecentralizedID");
  
  // 修改部署方式
  const deployment = await DID.deploy();
  const did = await deployment.waitForDeployment();
  const txReceipt = await deployment.deploymentTransaction().wait();

  console.log("Contract address:", await did.getAddress());
  console.log("Transaction hash:", txReceipt.hash);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
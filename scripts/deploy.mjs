import fs from "fs";
import { uploadToIPFS } from "@3rdweb/sdk";

//load all the files in ./dist/
const files = fs.readdirSync("./dist");

//loop over each file and upload to IPFS
for(const file of files){
  const filePath = `./dist/${file}`;
  const fileBuffer = fs.readFileSync(filePath);
  const fileHash = await uploadToIPFS(fileBuffer);
  console.log(`${file} ipfs hash: ${fileHash}`);
}


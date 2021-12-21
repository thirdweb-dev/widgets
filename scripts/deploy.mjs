import fs from "fs";
import { uploadToIPFS } from "@3rdweb/sdk";
import followRedirects from 'follow-redirects';


//load all the files in ./dist/
const files = fs.readdirSync("./dist");

const EMBED_GATEWAY = "https://cloudflare-ipfs.com/ipfs/";


 


//loop over each file and upload to IPFS

for(const file of files){
  const filePath = `./dist/${file}`;
  const fileBuffer = fs.readFileSync(filePath);
  const fileHash = await uploadToIPFS(fileBuffer);
  
  
  console.log("");
  console.log("|------------------------------------- "+file+" -------------------------------------|");
  console.log("");
  console.log(fileHash);
  console.log("");
  console.log(`warming up ipfs storage...`);
  followRedirects.https.get(fileHash.replace("ipfs://", EMBED_GATEWAY), (res) => {
    console.log(`warmed up ipfs storage`);
    console.log("|------------------------------------- "+file+" -------------------------------------|");
    console.log("");
    
  });
  
}


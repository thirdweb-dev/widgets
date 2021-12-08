import fs from "fs";
import { uploadToIPFS } from "@3rdweb/sdk";

const file = fs.readFileSync("./dist/drop.html");

uploadToIPFS(file)
  .then((hash) => {
    console.log("*** hash", hash);
  })
  .catch((err) => {
    console.error("*** err", err);
    process.exit(1);
  });

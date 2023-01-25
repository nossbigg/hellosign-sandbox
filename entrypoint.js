const fs = require("fs");
// see more: https://github.com/daraosn/node-zip
const nodeZip = require("node-zip");
// see more: https://github.com/hellosign/hellosign-nodejs-sdk
const hellosignSdk = require("hellosign-sdk");

const HELLOSIGN_API_KEY = process.env.HELLOSIGN_API_KEY;
const hellosign = hellosignSdk({ key: HELLOSIGN_API_KEY });

const sigRequestDownloadZip = (sigRequestId) => {
  return new Promise((resolve, reject) => {
    hellosign.signatureRequest.download(
      sigRequestId,
      {
        file_type: "zip",
      },
      (err, response) => {
        if (err) {
          reject(err);
          return;
        }

        var file = fs.createWriteStream("files.zip");
        response.pipe(file);

        file.on("finish", function () {
          file.close();

          const fileContents = fs.readFileSync("files.zip", {
            encoding: "binary",
          });
          resolve(fileContents);

          fs.unlink("files.zip", () => {});
        });
      }
    );
  });
};

const run = async () => {
  const sigRequestListResponse = await hellosign.signatureRequest.list();

  const { signature_requests } = sigRequestListResponse;
  const [firstSignatureRequest] = signature_requests;
  const { signature_request_id } = firstSignatureRequest;

  const zipBinary = await sigRequestDownloadZip(signature_request_id);
  const zip = nodeZip(zipBinary, { binary: true });

  const zipFileNames = Object.keys(zip.files);
  for (const zipFileName of zipFileNames) {
    const zipFile = zip.files[zipFileName];
    const fileContent = await zipFile._data.getContent();
    fs.writeFileSync(`./output/${zipFileName}`, fileContent);
  }
};

run();

import * as fs from 'fs';
import * as path from 'path';

const isWin = process.platform === "win32";
const path_sep = isWin ? "\\" : path.sep;

const ABI_DIR = 'build/abi/';

const getAllFiles = function (dirPath: string, arrayOfFiles: string[]) {
    let files = fs.readdirSync(dirPath)

    arrayOfFiles = arrayOfFiles || []

    files.forEach(function (file) {
        if (fs.statSync(dirPath + path_sep + file).isDirectory()) {
            arrayOfFiles = getAllFiles(dirPath + path_sep + file, arrayOfFiles)
        } else {
            arrayOfFiles.push(path.join(dirPath, path_sep, file))
        }
    })

    return arrayOfFiles
}

// Store ABIs of all generated artifacts separately, they will be used by the
// maven-web3j-plugin to generate java source code files
// First prepare the output directory and create it if it does not exist
fs.mkdirSync('./' + ABI_DIR, { recursive: true });

// go through all compiled contract artifacts (the intermediate contracts will be compiled as
// well and might be needed by other projects, so we cannot simply pick the contracts that
// were required above)
function prepareAbis(dir: string) {
    getAllFiles(dir, [])
    // only pick up json files
    .filter(file => /\.json$/.test(file))
    // read the json file and pass along the original file name
    .map(file => ({ buffer: fs.readFileSync(file), file }))
    // parse the json file and pass along the original file name
    .map(data => ({ json: JSON.parse(data.buffer.toString()), file: data.file }))
    // only pick the contracts that have an ABI interface defined
    .filter(data => data.json.abi && data.json.abi.length > 0)
    // finally write the ABI interface and bytecode using the original filename
    .forEach(data => {
        const fileName = data.file.substring(data.file.lastIndexOf(path_sep) + 1);
        try {
            const abiFileName = ABI_DIR + fileName;
            console.log(abiFileName);
            fs.writeFileSync(abiFileName, JSON.stringify(data.json.abi, null, 4));

            const jsonFileName = ABI_DIR + fileName.replace(/json$/, "bin");
            console.log(jsonFileName);
            fs.writeFileSync(jsonFileName, data.json.bytecode);
        } catch (err: any) {
            console.log("Error while writing ABI files: " + err.message)
        }
    });
}

prepareAbis("." + path_sep + "build" + path_sep + "cache" + path_sep + "solpp-generated-contracts");
prepareAbis("." + path_sep + "build" + path_sep + "@openzeppelin");

console.log("ABI and Bytecode files successfully written to " + ABI_DIR);

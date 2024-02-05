import readline from 'readline';
import path from 'path';
import { stdin as input, stdout as output, cwd, chdir } from 'node:process';
import { opendir, access, writeFile, rename, rm} from 'fs/promises';
import os,{ homedir } from 'os';
import { constants, createReadStream , createWriteStream} from 'node:fs';
import { stdout,  } from 'node:process';
import { createHash } from 'node:crypto';
import { pipeline } from 'node:stream';
import { promisify }from 'node:util';
import zlib from 'node:zlib';


const pipe = promisify(pipeline);


const hdir = homedir();

let Username = process.argv[2].split('=')[1]||'UserName';

console.log(`Welcome to the File Manager, ${Username }!`)
chdir(hdir);


const rl = readline.createInterface({ input, output });


const currDir = ()=>cwd();
async function handleCommand(command) {

    let args = command.split(' ');
    let cmd = args[0];

    if(cmd=='.exit'){
        rl.close(); return;
    }if(command=='ls'){
        await list();
    }else if(cmd=='up'){
       up();
    }else if(cmd =='cd'){
       cd(args[1]);
    }else if(cmd=='cat'){
       await cat(args[1]);
    }else if(cmd=='add'){
       await add(args[1]);
    }else if(cmd=='rn'){
        await rn(args[1],args[2]);
    }else if(cmd=='cp'){
        await copy(args[1],args[2]);
    }else if(cmd=='mw'){
        await mw(args[1],args[2]);
    }else if(cmd=='rm'){
        await remove(args[1]);
    }else if(cmd=='hash'){
        await hashfn(args[1]);
    }else if(cmd=='compress'){
        await compressfn(args[1],args[2]);
    }else if(cmd=='decompress'){
        await decompressfn(args[1],args[2]);
    }else if(cmd=='os'){
        await osCMD(args[1])
    }
    else{
        console.log('Invalid input');
    }

    question();
}
function question(){
    rl.question(`\r\nYou are currently in ${currDir()}:\r\n`, (input) => {
        handleCommand(input);
    });
}

rl.on('close', () => {
    console.log(`Thank you for using File Manager, ${Username}, goodbye!`)
    process.exit(0);
});

question();


async function list(){
    let data = [];
    
    const dir = await opendir(currDir());
    for await (const dirent of dir){
        let type = dirent.isFile()?'file':'directory';
        data.push({'Name':dirent.name, 'Type':type})
    
    };
    console.table(data)
}

function up(){
    if(currDir()!==hdir) chdir('../');
}

async function cd(path_to_directory){
    try{
        const fullPath = path.resolve(currDir(), path_to_directory);
        await access(fullPath, constants.R_OK);
        if (fullPath.startsWith(hdir)) chdir(fullPath);
    }catch(err){
        console.log(err);    
    }

}

async function cat(path_to_file){
    const fullPath = path.resolve(currDir(), path_to_file);
    try{
        await access(fullPath, constants.R_OK);
        createReadStream(fullPath).pipe(stdout);
    }catch (err){
        console.log(err);
     }
}
async function add(new_file_name){
    try{
        await writeFile(new_file_name,'');
    }catch (err){ 
        console.log(err);
    }
}

async function rn( path_to_file, new_filename){
    try{
        await rename(path_to_file,new_filename,{ recursive: true });      
    }catch (err){ 
        console.log(err);
    }

}

async function copy(path_to_file, path_to_new_director){
    try{
        const filePath = path.resolve(path_to_new_director, path_to_file);
        let wStream = createWriteStream(filePath)
        await createReadStream(path_to_file).pipe(wStream);
    }catch (err){ 
        console.log(err);
    }
}

async function mw(path_to_file, path_to_new_directory){
    try{
        await copy(path_to_file, path_to_new_directory);
        await rm(path_to_file);
    }catch (err){ 
        console.log(err);
    }
}

async function remove(path_to_file){
    try{
        await access(path_to_file, constants.R_OK);
        rm(path_to_file)
    }catch (err){
        console.log(err);
     }
}

async function hashfn(path_to_file){
    try{
        const hash = createHash('sha256');
        const stream = createReadStream(path_to_file);
        stream.pipe(hash).setEncoding('hex').pipe(stdout);    
    }catch (err){
        console.log(err);
     }
}

async function compressfn(path_to_file, path_to_destination){
    try{

        const source = createReadStream(path_to_file);
        const fname= path.basename(path_to_file)+'.br';
        const file_to_destination = path.resolve(path_to_destination,fname )
        const destination = createWriteStream(file_to_destination);
        const brotli = zlib.createBrotliCompress();

        await source.pipe(brotli).pipe(destination);

    }catch (err){
        console.log(err);
     }
}

async function decompressfn(path_to_file, path_to_destination){
    try{
        const source = createReadStream(path_to_file);
        const fname= path.basename(path_to_file).replace('.br','');
        const file_to_destination = path.resolve(path_to_destination, fname);
        const destination = createWriteStream(file_to_destination);
        const decompress = zlib.createBrotliDecompress();
        source.pipe(decompress).pipe(destination);
    }catch(err){
        console.log(err);
     }
}

async function osCMD(carg){
    let arg = carg.replace('--','');
    if(arg=='EOL'){
        console.log(JSON.stringify(os.EOL)); 
    }else if(arg=='cpus'){
        console.log(os.cpus().length)
        
    }else if(arg=='homedir'){
        console.log(hdir())        
    }else if(arg=='username'){
        console.log(os.userInfo().username)
        
    }else if(arg=='architecture'){
        console.log(process.arch)
    }
}

process.on('uncaughtException', (err)=>console.log(`uncaughtException ${err}`));
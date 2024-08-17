const express=require('express');
const http=require('http');
const {Chess}=require('chess.js');
const socket=require('socket.io');
const path = require('path');

const chess=new Chess();

const app=express();

const server=http.createServer(app);
const io=socket(server);

const players={};
let currentPlayer="ws";

app.set("view engine","ejs");
app.use(express.static(path.join(__dirname,"public")));

app.get("/",(req,res)=>{
    res.render("index");
})

io.on("connection",(uniquesocket)=>{
    console.log("Connected");

    if(!players.white)
    {
        players.white=uniquesocket.id;
        uniquesocket.emit("playerRole","w");
    }
    else if(!players.black)
    {
        players.black=uniquesocket.id;
        uniquesocket.emit("playerRole","b");
    }
    else
    {
        uniquesocket.emit("SpectatorRole")
    }

    uniquesocket.on("disconnect",()=>{
        if(uniquesocket.id===players.white)
        {
            delete players.white;
        }
        else if(uniquesocket.id===players.black)
        {
            delete players.black;
        }
    })

    uniquesocket.on("move",(move)=>{
        try{
            if(chess.turn()==="w" && uniquesocket.id!=players.white) return;
            if(chess.turn()=="b" && uniquesocket.id!=players.black) return;

            let result=chess.move(move);
            if(result)
            {
                currentPlayer=chess.turn();
                io.emit("move",move);
                io.emit("boardState",chess.fen());
            }
            else
            {
                console.log("invalidMove",move);
                uniquesocket.emit("invalidMove",move);
                
            }
        }
        catch(err){
            console.log(err);
            
            uniquesocket.emit("invalidMove",move);
        }
    })
})

server.listen(3000,()=>{
    console.log("Server running at 3000 port");
    
})
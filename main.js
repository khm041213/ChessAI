const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const blackcell = '#3a3a3a'; //#2f2f2f
const whitecell = '#f2f2fa';

const pieceImageSrc = {
    white : {
        pawn : 'WhitePawn.svg',
        rook : 'WhiteRook.svg',
        knight :'WhiteKnight.svg',
        bishop : 'WhiteBishop.svg',
        queen : 'WhiteQueen.svg',
        king : 'WhiteKing.svg',
    },
    black : {
        pawn : 'BlackPawn.svg',
        rook : 'BlackRook.svg',
        knight :'BlackKnight.svg',
        bishop : 'BlackBishop.svg',
        queen : 'BlackQueen.svg',
        king : 'BlackKing.svg',
    }
}

const pieceImages = {
    white: {},
    black: {}
};

function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = src;
      img.onload = () => resolve(img);
      img.onerror = reject;
    });
}
  

async function loadAllPieceImages() {
    for (const team in pieceImageSrc) {
        for (const type in pieceImageSrc[team]) {
            pieceImages[team][type] = await loadImage(pieceImageSrc[team][type]);
        }
    }
}

function drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill(); // or ctx.stroke() if you’re into outlines
} //챗지피티 도움

function resizeCanvas() {
    const margin = 80;
    const size = Math.min(window.innerWidth, window.innerHeight)-margin*2;
    canvas.width = size;
    canvas.height = size;

    canvas.style.position = 'absolute';
    canvas.style.left = `${margin}px`;
    canvas.style.top = `${margin}px`;
    // canvas.style.outline = `4px solid ${whitecell}`;
    canvas.style.boxShadow = `0px 20px 40px 0 ${blackcell}`;
    canvas.style.borderRadius = "10px"
}

resizeCanvas();

// ctx.fillStyle = '#000000';
// ctx.fillRect(0,0,canvas.width,canvas.height);

export class ChessBoard {
    constructor(canvas, sizeRatio){
        this.canvas = canvas;
        this.ctx = this.canvas.getContext('2d');
        this.sizeRatio = sizeRatio
        this.boardSize = canvas.width*sizeRatio;
        this.cellSize = this.boardSize/8;
        this.rows = 8;
        this.cols = 8;
        this.padding = 5;
        this.borderThickness = 3;
        this.board = null
        this.promotionCellSize = this.cellSize * 0.8
    }

    getCanvasX(col) {
        return this.canvas.width / 2 + (col - 4) * this.cellSize;
    }
    getCanvasY(row) {
        return this.canvas.height / 2 + (row - 4) * this.cellSize;
    }
      
    drawBoard(){ //판 그리기
        this.ctx.fillStyle = whitecell;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.strokeStyle = blackcell;
        this.ctx.lineWidth = this.borderThickness;

        this.ctx.strokeRect(this.canvas.width/2 -this.boardSize/2 - this.padding -this.borderThickness, this.canvas.width/2 -this.boardSize/2- this.padding-this.borderThickness, this.boardSize + (this.padding +this.borderThickness)*2, this.boardSize + (this.padding +this.borderThickness)*2);

        for(let i = 0; i < this.cols; i++){
            for(let j=0; j < this.rows; j++){
                //console.log(i,j);
                this.ctx.fillStyle = (i+j)%2 == 0? whitecell : blackcell;
                this.ctx.fillRect(this.getCanvasX(i), this.getCanvasY(j), this.cellSize, this.cellSize);
            }
        }

        const textPadding = ((this.canvas.width - this.boardSize)/2 - this.padding)/2

        //체스판 위치
        this.ctx.fillStyle = blackcell;
        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "middle";
        this.ctx.font = "normal bold 15px 'SUIT-Regular', sans-serif";
        for(let i = 0; i < this.cols; i++){
            let marginBetweenLabelsAndBoard = this.canvas.width/2 + (i-4)*this.cellSize + this.cellSize/2;
            this.ctx.fillText([8,7,6,5,4,3,2,1][i], textPadding, marginBetweenLabelsAndBoard);
            this.ctx.fillText(['A','B','C','D','E','F','G','H'][i], marginBetweenLabelsAndBoard, textPadding );
        }
    }

    drawValidMovements(selectedPiece, Positions){ //판 내부 기물의 이동가능위치 그리기
        const selectedColor = "#8fce0055"

        const selectedPos = {
            x : this.getCanvasX(selectedPiece.x) + this.cellSize/2,
            y : this.getCanvasY(selectedPiece.y) + this.cellSize/2
        }

        //본인 위치
        const circleSize = (this.cellSize/2)*0.7;

        this.ctx.beginPath();
        this.ctx.fillStyle = selectedColor;
        this.ctx.arc(selectedPos.x, selectedPos.y, circleSize, 0, Math.PI*2)
        this.ctx.fill()
        this.ctx.closePath();

        for(let pos of Positions){
            //일반 이동 -> 회색 원?
            //적 공격 -> 큰 링?
            // console.log(selectedPiece, selectedPos)

            let canvasPos = {
                x : this.getCanvasX(pos.x) + this.cellSize/2,
                y : this.getCanvasY(pos.y) + this.cellSize/2
            }
            
            if(pos.special == null){ //단순
                //단순 이동
                if(pos.capture == false){ 
                        this.ctx.beginPath();
                        this.ctx.fillStyle ='#78787899';
                        this.ctx.arc(canvasPos.x, canvasPos.y, 5, 0, Math.PI*2)
                        this.ctx.fill()
                        this.ctx.closePath();
                    
                }
                //단순 적 잡기
                else if(pos.capture == true){
                        this.ctx.beginPath();
                        this.ctx.fillStyle ='#fa8f6799';
                        this.ctx.arc(canvasPos.x, canvasPos.y, 25, 0, Math.PI*2)
                        this.ctx.fill()
                        this.ctx.closePath();
                    
                }
            }
            else { //특수룰
                switch(pos.special.name){
                    case 'enpassant' : //앙파상
                        let enpassantPos = {
                            x : this.getCanvasX(pos.special.targetX) + this.cellSize/2,
                            y : this.getCanvasY(pos.special.targetY) + this.cellSize/2
                        }

                        this.ctx.beginPath();
                        this.ctx.fillStyle ='#fa8f6799';
                        this.ctx.arc(canvasPos.x, canvasPos.y, 25, 0, Math.PI*2)
                        this.ctx.fill()
                        this.ctx.closePath();

                        // this.ctx.lineWidth = 50;
                        // this.ctx.lineCap = "round";
                        // this.ctx.strokeStyle ='#fa8f6799';
                        // this.ctx.beginPath();
                        // this.ctx.moveTo(canvasPos.x, canvasPos.y)
                        // this.ctx.lineTo(enpassantPos.x, enpassantPos.y)
                        // this.ctx.stroke();
                        // this.ctx.closePath();
                        // this.ctx.lineCap = "butt";
                        break;
                    case 'castling' :
                        let rookPos = {
                            x : this.getCanvasX(pos.special.RookToX) + this.cellSize/2,
                            y : this.getCanvasY(pos.special.RookToY) + this.cellSize/2
                        }
                        
                        this.ctx.beginPath();
                        this.ctx.fillStyle ='#78787899';
                        this.ctx.arc(canvasPos.x, canvasPos.y, 5, 0, Math.PI*2)
                        this.ctx.fill()
                        this.ctx.closePath();
                        break;
                    case 'promotion' :
                        if(pos.capture == false){
                            this.ctx.beginPath();
                            this.ctx.fillStyle ='#78787899';
                            this.ctx.arc(canvasPos.x, canvasPos.y, 5, 0, Math.PI*2);
                            this.ctx.fill()
                            this.ctx.closePath();
                            break;
                        }
                        else {
                            this.ctx.beginPath();
                            this.ctx.fillStyle ='#fa8f6799';
                            this.ctx.arc(canvasPos.x, canvasPos.y, 25, 0, Math.PI*2)
                            this.ctx.fill()
                            this.ctx.closePath();
                        }
                }
            }  
        }
    }

    createBoard(team = 1) { //판 생성성
        let board = Array(this.rows).fill(0).map(() => 
            Array(this.cols).fill(0).map(() => (null))
        ); //초기 판

        this.board = board;
        return board;
    }

    initBoard(team = 1) { //판 기본설정
        this.createBoard();
        
        for(let col = 0; col < this.cols; col++){
            this.board[col][1] = new Pawn(-team, col, 1);
            this.board[col][6] = new Pawn(team, col, 6);
        } //폰 설정

        for(let i of [0,7]){
            let teamset = ((i/7)*2)-1
            this.board[0][i] = new Rook(team * teamset, 0, i);
            this.board[1][i] = new Knight(team * teamset, 1, i);
            this.board[2][i] = new Bishop(team * teamset, 2, i);
            this.board[3][i] = new Queen(team * teamset, 3, i);
            this.board[4][i] = new King(team * teamset, 4, i);
            this.board[5][i] = new Bishop(team * teamset, 5, i);
            this.board[6][i] = new Knight(team * teamset, 6, i);
            this.board[7][i] = new Rook(team * teamset, 7, i);
        } //나머지 기물 설정

        return this.board;
        
    }

    drawPieces(){ //말 그리기
        if(!this.board) return;
        for(let row of this.board){
            for(let cell of row){
                cell?.draw(this.ctx, this.getCanvasX.bind(this), this.getCanvasY.bind(this), this.cellSize)
            }
        }
    }

    drawPromotion(team){
        const center = {
            x : this.canvas.width/2,
            y : this.canvas.height/2
        }
        const startConner = {
            x : center.x - this.promotionCellSize * 2,
            y : center.y - this.promotionCellSize / 2
        }
        
        //그림자
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        this.ctx.shadowBlur = 20;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 4;
        this.ctx.fillStyle = '#000000';
        drawRoundedRect(this.ctx, startConner.x - 10 , startConner.y - 30, this.promotionCellSize * 4 + 20, this.promotionCellSize + 40, 10);
        this.ctx.shadowColor = 'transparent'

        this.ctx.fillStyle = whitecell;
        drawRoundedRect(this.ctx, startConner.x - 10 , startConner.y - 30, this.promotionCellSize * 4 + 20, this.promotionCellSize + 40, 10);

        //박스 라인
        this.ctx.lineWidth = this.borderThickness * 0.5;
        this.ctx.strokeStyle = blackcell
        this.ctx.strokeRect(startConner.x , startConner.y, this.promotionCellSize * 4 , this.promotionCellSize)

        this.ctx.fillStyle = blackcell;
        this.ctx.fillText(`· Select a piece to promote to ·`, center.x, center.y - this.promotionCellSize/2 - 15)

        for(let i = 0; i < 4; i ++){
            let pieceX = startConner.x + i * this.promotionCellSize;
            let pieceClass = [Queen, Bishop, Knight, Rook][i];
            let drawingPiece = new pieceClass(team, 0, 0);

            drawingPiece.drawForPromotion(this.ctx, pieceX, startConner.y, this.promotionCellSize, this.promotionCellSize)
        }
    }

    AIthinkingdraw(team){
        const center = {
            x : this.canvas.width/2,
            y : this.canvas.height/2
        }

        const teamOffset = team * this.boardSize/4

        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        this.ctx.shadowBlur = 20;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 4;
        this.ctx.fillStyle = '#000000';
        drawRoundedRect(this.ctx, center.x - 100 , center.y + teamOffset - 10, 200 , 20, 10);
        this.ctx.shadowColor = 'transparent'

        this.ctx.fillStyle = whitecell;
        drawRoundedRect(this.ctx, center.x - 100 , center.y + teamOffset - 10, 200 , 20, 10);

        this.ctx.fillStyle = blackcell;
        this.ctx.fillText(`· AI is thinking... ·`, center.x, center.y + teamOffset)
    }


    clone(){ //체스판 딥카피
        let copiedChessBoard = new ChessBoard(this.canvas, this.sizeRatio);
        copiedChessBoard.createBoard();

        for(let col = 0; col < this.cols; col++){
            for(let row = 0; row < this.rows; row++){
                const piece = this.board[col][row]
                if (piece) {
                    copiedChessBoard.board[col][row] = piece.clone();
                }
            }
        }

        return copiedChessBoard;
    }

    serializeBoard() {
        return this.board.map(col => col.map(cell => cell ? cell.SerializableObject() : null));
    }
}

export class Piece {
    constructor (team, x, y){
        this.team = team;
        this.x = x;
        this.y = y;

        this.moveNum = 0;

        this.animationX = this.x;
        this.animationY = this.y;
        this.isMoved = 0;

        this.animationEase = .15;

        this.piece = null;
    }

    static removeEnemyKingPositions(movablePositions, board, team){
        return movablePositions.filter(pos => {
            const target = board[pos.x][pos.y];
            return !(target?.piece == 'king' && target?.team == -team);
        })
    } // 챗지피티 도움

    updateAnimationPos(){
        this.animationX = this.animationX * (1 - this.animationEase) + this.x * this.animationEase;
        this.animationY = this.animationY * (1 - this.animationEase) + this.y * this.animationEase;
    }

    isKingSafeAfterMove(pos, board, team, cloneBoardFn){
        let enemyMovablePositions = [];

        
        let copiedChess = cloneBoardFn();
        let copiedBoard = copiedChess.board;

        let selectedPiece = copiedBoard[this.x][this.y]

        // console.log(selectedPiece);
        // console.log(pos)
        // console.log(copiedBoard);

        const prevX = this.x;
        const prevY = this.y;

        selectedPiece.x = pos.x;
        selectedPiece.y = pos.y;

        copiedBoard[pos.x][pos.y] = selectedPiece;
        copiedBoard[prevX][prevY] = null;

        // console.log(copiedBoard)

        for(let col = 0; col < copiedBoard.length; col++){
            for(let row = 0; row < copiedBoard[0].length; row++){
                let piece = copiedBoard[col][row];
                if(piece?.team == -team && piece?.piece != 'king'){
                    enemyMovablePositions.push(...piece.getMovablePositions(copiedBoard, {checkKingSafety : false}));
                }
            }
        }
        
        enemyMovablePositions = enemyMovablePositions.filter(pos => pos.capture)
        //console.log(enemyMovablePositions)

        const king = copiedBoard.flat().find(p => p?.piece == 'king' && p?.team == team)
        //console.log(king)

        //console.log(!enemyMovablePositions.some(pos => pos.x == king.x && pos.y == king.y))

        return !enemyMovablePositions.some(pos => pos.x == king.x && pos.y == king.y)
    }

    draw(ctx, getX, getY, cellSize){
        const teamName = this.team === -1 ? "black" : "white";
        const image = pieceImages[teamName][this.piece];
        if (!image || !image.complete) return;
    
        ctx.drawImage(image, getX(this.animationX), getY(this.animationY), cellSize, cellSize);
    }

    drawForPromotion(ctx, getX, getY, cellSize){
        const teamName = this.team === -1 ? "black" : "white";
        const image = pieceImages[teamName][this.piece];
        if (!image || !image.complete) return;
    
        ctx.drawImage(image, getX, getY, cellSize, cellSize);
    }

    static addPositionObj(x,y,special=null, capture = false) {
        let temp = {
            x : x, //이동가능한 x좌표
            y : y, //이동가능한 y좌표
            special : special, //특수룰 (앙파상등..)
            capture: capture //그 좌표가 잡는 좌표인지
        }
        return temp
    }

    static inBounds(x, y) {
        return x >= 0 && x < 8 && y >= 0 && y < 8;
    } //챗지피티도움
 
    getMovablePositions(board, option = {checkKingSafety : true}) { //껍대기만
        return []
    };

    SerializableObject() {
        return {
            piece: this.piece,
            team: this.team,
            x: this.x,
            y: this.y,
            isMoved: this.isMoved,
            moveNum: this.moveNum
        };
    }
}

export class Pawn extends Piece {
    constructor(team,x,y){
        super(team, x, y)
        this.piece = 'pawn'

        this.score = 1;
    }

    getMovablePositions(board, option = {checkKingSafety : true}) {
        const dir = this.team;
        const promotionY = this.team == 1 ? 0 : 7

        let movablePositions = []

        //전진
        const oneForward = this.y - dir
        if(Piece.inBounds(this.x,oneForward) && board[this.x][oneForward] == null){
            if(oneForward != promotionY) movablePositions.push(Piece.addPositionObj(this.x,oneForward)) //프로모션 조건
            else {
                
                if(option.isAI == false){ //선택지용 프로모션
                    let promotionObj = {
                        name : 'promotion',
                        promoteTo : null
                    }
                    movablePositions.push(Piece.addPositionObj(this.x,oneForward,promotionObj,false))
                }
                else if(option.isAI == true){ //AI용 프로모션
                    
                    for(let piece of ['queen','bishop','knight','rook']){
                        let promotionObj = {
                            name : 'promotion',
                            promoteTo : piece
                        }
                        movablePositions.push(Piece.addPositionObj(this.x,oneForward,promotionObj,false))
                    }
                }
            }

            //2번 전진
            const twoForward = this.y - 2 * dir
            if(Piece.inBounds(this.x,twoForward) && board[this.x][twoForward] == null && this.isMoved == 0){
                movablePositions.push(Piece.addPositionObj(this.x,twoForward))
            }
        }

        //대각선 잡기
        const leftForward = this.x - 1;
        const rightForward = this.x + 1;
        if(
            Piece.inBounds(leftForward, oneForward) && //대각선이 판 안에
            board[leftForward][oneForward]?.team === -this.team //거기에 적이 존재하는지지
        ){  
            if(oneForward != promotionY) movablePositions.push(Piece.addPositionObj(leftForward, oneForward, null, true)) //프로모션 조건
            else {
                //console.log('기물잡으면서 프로모션션')
                if(option.isAI == false){ //선택지용 프로모션
                    let promotionObj = {
                        name : 'promotion',
                        promoteTo : null
                    }
                    movablePositions.push(Piece.addPositionObj(leftForward,oneForward,promotionObj,true))
                }
                else if(option.isAI == true){ //AI용 프로모션
                    
                    for(let piece of ['queen','bishop','knight','rook']){
                        let promotionObj = {
                            name : 'promotion',
                            promoteTo : piece
                        }
                        movablePositions.push(Piece.addPositionObj(leftForward,oneForward,promotionObj,true))
                    }
                }
            }
            
        }

        //프로모션
        if(
            Piece.inBounds(rightForward, oneForward) && //대각선이 판 안에
            board[rightForward][oneForward]?.team === -this.team //거기에 적이 존재하는지지
        ){
            if(oneForward != promotionY) movablePositions.push(Piece.addPositionObj(rightForward, oneForward, null, true)) //프로모션 조건
            else {
                if(option.isAI == false){ //유저용 프로모션
                    let promotionObj = {
                        name : 'promotion',
                        promoteTo : null
                    }
                    movablePositions.push(Piece.addPositionObj(rightForward,oneForward,promotionObj,true))
                }
                else if(option.isAI == true){ //AI용 프로모션
                    
                    for(let piece of ['queen','bishop','knight','rook']){
                        let promotionObj = {
                            name : 'promotion',
                            promoteTo : piece
                        }
                        movablePositions.push(Piece.addPositionObj(rightForward,oneForward,promotionObj,true))
                    }
                }
            }
        }

        //특수룰 : 앙파상
        const EnpassantDir = [-1,1]
        for(let dir of EnpassantDir){
            let side = this.x + dir
            if(
                Piece.inBounds(this.x + dir, this.y) && //이동 가능 위치가 판 안인지
                board[side][this.y] && //그 위치에 말이 존재하는지
                board[side][this.y]?.piece == 'pawn' && //말이 폰인지
                board[side][this.y]?.team == -this.team && //적인지
                board[side][this.y]?.isMoved == 2 && //처음 2칸 움직였는지
                board[side][this.y]?.moveNum == option.move-1 //바로 전 수에 2칸 움직였는지
            ){ 
                
                movablePositions.push(Piece.addPositionObj(side, oneForward, {name : 'enpassant', targetX : side, targetY : this.y}, true))
            }
        }

        
        if(option.checkKingSafety == true){
            movablePositions = movablePositions.filter(pos => this.isKingSafeAfterMove(pos, board, this.team, option.cloneBoardFn))
            //console.log(movablePositions)
        }
        
        //return Piece.removeEnemyKingPositions(movablePositions, board, this.team);
        return movablePositions;
    };

    clone() {
        const p = new Pawn(this.team, this.x, this.y);
        p.isMoved = this.isMoved;
        p.moveNum = this.moveNum;
        p.x = this.x
        p.y = this.y

        return p
    }
}

export class Rook extends Piece {
    constructor(team,x,y){
        super(team, x, y)
        this.piece = 'rook'

        this.score = 5;
    }

    getMovablePositions(board, option = {checkKingSafety : true}) {

        let movablePositions = []

        //상하좌우 방향
        const dir = [[0,1],[1,0],[-1,0],[0,-1]];

        for(let i of dir){
            let times = 1;
            let dirX = i[0];
            let dirY = i[1];

            while(true){
                let nextPos = {
                    x : this.x + dirX * times,
                    y : this.y + dirY * times
                }

                //console.log(nextPos.x, nextPos.y)

                if(!Piece.inBounds(nextPos.x, nextPos.y)) break;

                if(board[nextPos.x][nextPos.y] == null ){ //이동하는 자리가 비어있으면
                    movablePositions.push(Piece.addPositionObj(nextPos.x, nextPos.y))
                }
                else{
                    if(board[nextPos.x][nextPos.y].team == -this.team){ //이동하는 자리에 적이 있다면
                        movablePositions.push(Piece.addPositionObj(nextPos.x, nextPos.y, null, true))
                        break;
                    }
                    else if(board[nextPos.x][nextPos.y].team == this.team){ //이동하는 자리에 아군이 있다면
                        break;
                    }
                }

                times++;
            }
        }

        if(option.checkKingSafety == true) movablePositions = movablePositions.filter(pos => this.isKingSafeAfterMove(pos, board, this.team, option.cloneBoardFn))

        //return Piece.removeEnemyKingPositions(movablePositions, board, this.team);
        return movablePositions;
    };

    clone() {
        const p = new Rook(this.team, this.x, this.y);
        p.isMoved = this.isMoved;
        p.moveNum = this.moveNum;

        return p
    }
}

export class Knight extends Piece {
    constructor(team,x,y){
        super(team, x, y);
        this.piece = 'knight';

        this.score = 3;
    }

    getMovablePositions(board, option = {checkKingSafety : true}) {
        let movablePositions = []

        //상하좌우 방향
        const dir = [[1,2],[-1,2],[-2,1],[-2,-1],[-1,-2],[1,-2],[2,-1],[2,1]];

        for(let i of dir){
            let dirX = i[0];
            let dirY = i[1];

            let nextPos = {
                x : this.x + dirX,
                y : this.y + dirY
            }

            //console.log(nextPos.x, nextPos.y)

            if(!Piece.inBounds(nextPos.x, nextPos.y)) continue;

            if(board[nextPos.x][nextPos.y] == null ){ //이동하는 자리가 비어있으면
                movablePositions.push(Piece.addPositionObj(nextPos.x, nextPos.y))
            }
            else{
                if(board[nextPos.x][nextPos.y].team == -this.team){ //이동하는 자리에 적이 있다면
                    movablePositions.push(Piece.addPositionObj(nextPos.x, nextPos.y, null, true))
                    continue;
                }
                else if(board[nextPos.x][nextPos.y].team == this.team){ //이동하는 자리에 아군이 있다면
                    continue;
                }
            }
        }

        if(option.checkKingSafety == true) movablePositions = movablePositions.filter(pos => this.isKingSafeAfterMove(pos, board, this.team, option.cloneBoardFn))

        //return Piece.removeEnemyKingPositions(movablePositions, board, this.team);
        return movablePositions;
    };

    clone() {
        const p = new Knight(this.team, this.x, this.y);
        p.isMoved = this.isMoved;
        p.moveNum = this.moveNum;

        return p
    }
}

export class Bishop extends Piece {
    constructor(team,x,y){
        super(team, x, y);
        this.piece = 'bishop';

        this.score = 3;
    }

    getMovablePositions(board, option = {checkKingSafety : true}) {
        let movablePositions = []

        //각 대각선 방향
        const dir = [[1,1],[1,-1],[-1,1],[-1,-1]];

        for(let i of dir){
            let times = 1;
            let dirX = i[0];
            let dirY = i[1];

            while(true){
                let nextPos = {
                    x : this.x + dirX * times,
                    y : this.y + dirY * times
                }

                //console.log(nextPos.x, nextPos.y)

                if(!Piece.inBounds(nextPos.x, nextPos.y)) break;

                if(board[nextPos.x][nextPos.y] == null ){ //이동하는 자리가 비어있으면
                    movablePositions.push(Piece.addPositionObj(nextPos.x, nextPos.y))
                }
                else{
                    if(board[nextPos.x][nextPos.y].team == -this.team){ //이동하는 자리에 적이 있다면
                        movablePositions.push(Piece.addPositionObj(nextPos.x, nextPos.y, null, true))
                        break;
                    }
                    else if(board[nextPos.x][nextPos.y].team == this.team){ //이동하는 자리에 아군이 있다면
                        break;
                    }
                }

                times++;
            }
        }

        if(option.checkKingSafety == true) movablePositions = movablePositions.filter(pos => this.isKingSafeAfterMove(pos, board, this.team, option.cloneBoardFn))

        //return Piece.removeEnemyKingPositions(movablePositions, board, this.team);
        return movablePositions;
    };

    clone() {
        const p = new Bishop(this.team, this.x, this.y);
        p.isMoved = this.isMoved;
        p.moveNum = this.moveNum;

        return p
    }
}

export class Queen extends Piece {
    constructor(team,x,y){
        super(team, x, y);
        this.piece = 'queen';

        this.score = 9;
    }

    getMovablePositions(board, option = {checkKingSafety : true}) {
        let movablePositions = []

        //상하좌우 및 대각선
        const dir = [[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1],[0,-1],[1,-1]];

        for(let i of dir){
            let times = 1;
            let dirX = i[0];
            let dirY = i[1];

            while(true){
                let nextPos = {
                    x : this.x + dirX * times,
                    y : this.y + dirY * times
                }

                //console.log(nextPos.x, nextPos.y)

                if(!Piece.inBounds(nextPos.x, nextPos.y)) break;

                if(board[nextPos.x][nextPos.y] == null ){ //이동하는 자리가 비어있으면
                    movablePositions.push(Piece.addPositionObj(nextPos.x, nextPos.y))
                }
                else{
                    if(board[nextPos.x][nextPos.y].team == -this.team){ //이동하는 자리에 적이 있다면
                        movablePositions.push(Piece.addPositionObj(nextPos.x, nextPos.y, null, true))
                        break;
                    }
                    else if(board[nextPos.x][nextPos.y].team == this.team){ //이동하는 자리에 아군이 있다면
                        break;
                    }
                }
                times++;
            }
        }

        if(option.checkKingSafety == true) movablePositions = movablePositions.filter(pos => this.isKingSafeAfterMove(pos, board, this.team, option.cloneBoardFn))
        
        //console.log(movablePositions)

        //return Piece.removeEnemyKingPositions(movablePositions, board, this.team);
        return movablePositions;
    };

    clone() {
        const p = new Queen(this.team, this.x, this.y);
        p.isMoved = this.isMoved;
        p.moveNum = this.moveNum;

        return p
    }
}

export class King extends Piece {
    constructor(team,x,y){
        super(team, x, y);
        
        this.piece = 'king';

        this.score = 0; //Infinity (for better score calculation)
    }

    removeCheckPositions(movablePositions, team, cloneBoardFn){

        let enemyMovablePositions = [];
        
        for(let pos of movablePositions){

            let copiedChess = cloneBoardFn();
            let copiedBoard = copiedChess.board;

            let selectedPiece = copiedBoard[this.x][this.y]

            const prevX = this.x;
            const prevY = this.y;

            selectedPiece.x = pos.x;
            selectedPiece.y = pos.y;

            copiedBoard[pos.x][pos.y] = selectedPiece;
            copiedBoard[prevX][prevY] = null;

            // console.log(copiedBoard)

            for(let col = 0; col < copiedBoard.length; col++){
                for(let row = 0; row < copiedBoard[0].length; row++){
                    let piece = copiedBoard[col][row];
                    if(piece?.team == -team && piece?.piece != 'king'){
                        enemyMovablePositions.push(...piece.getMovablePositions(copiedBoard, {checkKingSafety : false, isAI : true}));
                    }
                }
            }
        }
        //console.log(enemyMovablePositions)
        enemyMovablePositions = enemyMovablePositions.filter(pos => pos.capture)

        return movablePositions.filter(pos => {
            return !enemyMovablePositions.some(epos => epos.x === pos.x && epos.y === pos.y);
        });
    }

    //일반 움직임
    getMovablePositions(board, option = {checkKingSafety : true}) {
        let movablePositions = []

        //상하좌우 및 대각선
        const dir = [[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1],[0,-1],[1,-1]];

        //기본 움직임
        for(let i of dir){
            let times = 1;
            let dirX = i[0];
            let dirY = i[1];

            let nextPos = {
                x : this.x + dirX * times,
                y : this.y + dirY * times
            }

            //console.log(nextPos.x, nextPos.y)

            if(!Piece.inBounds(nextPos.x, nextPos.y)) continue;

            if(board[nextPos.x][nextPos.y] == null ){ //이동하는 자리가 비어있으면
                movablePositions.push(Piece.addPositionObj(nextPos.x, nextPos.y))
            }
            else{
                if(board[nextPos.x][nextPos.y].team == -this.team){ //이동하는 자리에 적이 있다면
                    movablePositions.push(Piece.addPositionObj(nextPos.x, nextPos.y, null, true))
                    continue;
                }
                else if(board[nextPos.x][nextPos.y].team == this.team){ //이동하는 자리에 아군이 있다면
                    continue;
                }
            }
        }

        //캐슬링 코드
        const castlingDir = [-1, 1];
        const posY = this.team == 1 ? 7 : 0; //팀에 맞는 룩 위치 Y좌표
        
        for(let d of castlingDir){
            const posX = d == 1 ? 7 : 0; //방향에 맞는 룩 위치 X좌표

            //console.log(`룩 위치 : ${posX}, ${posY}`)
            if(
                board[posX][posY]?.piece == "rook" && //팀과 방향에 맞는 위치에 룩이 있고
                board[posX][posY]?.team == this.team && //그 룩이 아군이고
                board[posX][posY]?.isMoved == 0 && //그 룩이 한번도 안움직였으면
                this.isMoved == 0 //킹이 한번도 안움직였는지
            ){  
                let isExist = false
                for(let i = this.x + d; i * d < posX * d; i += d){ //룩과 왕 사이에 말이 있는지 확인
                    if(board[i][posY]){
                        isExist = true;
                        break;
                    }
                }
                if(isExist) continue; //말이 있다면 for문 탈출

                //캐슬링 시작
                let movX = d == 1 ? 6 : 2
                let rookX = d == 1 ? 5 : 3

                let specialObj = {
                    name : 'castling',
                    rookFromX : posX, 
                    rookFromY : posY,
                    rookToX : rookX,
                    rookToY : this.y
                }

                //현재위치와 캐슬링 위치 사이에 체크가 되는 곳이 있으면 제외
                let castlingDirforCheck = [Piece.addPositionObj(this.x + d, this.y, null, true)]
                if(this.removeCheckPositions(castlingDirforCheck, this.team, option.cloneBoardFn).length == 0) continue
                
                let pos = Piece.addPositionObj(movX, this.y, specialObj, false)
                //console.log(pos)
                movablePositions.push(pos)

                //console.log(`캐슬링 가능! ${d}, ${option.checkKingSafety}`)
            }
        }

        
        return this.removeCheckPositions(movablePositions, this.team, option.cloneBoardFn); //체크 위치 취소
    };

    clone() {
        const p = new King(this.team, this.x, this.y);
        p.isMoved = this.isMoved;
        p.moveNum = this.moveNum;

        return p
    }
}

const GameState = {
    GameEnd : -1,
    SelectPiece : 0,
    MovePiece : 1,
    SelectPromotion : 2
}


class GameManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        this.board = new ChessBoard(canvas, 0.9);
        this.turn = 1; // 1: white, -1: black
        this.move = 1; //수

        this.state = GameState.SelectPiece;
        this.selectedPiece = null;
        this.validMovements = [];
        this.promoteTarget = null;

        this.isAnimating = true;
        this.animTime = 0;
        this.lastTimestamp = 0;

        this.whiteMovableCount = 0;
        this.blackMovableCount = 0;
        
        this.isAI = true;
        this.AIturn = -1;
        this.isAIThinking = false;
        this.depth = 3;
    }

    async startGame(){
        await loadAllPieceImages(); //모든 이미지 로딩
    
        this.board.initBoard(); //처음 팟 셋팅

        this.whiteMovableCount = this.getMovableCount(1);
        this.blackMovableCount = this.getMovableCount(-1);
        this.render(); //판 그리기

        if(this.isAI){
            

            if(this.turn == this.AIturn){
                this.isAIThinking = true;
                setTimeout(() => { 
                    this.makeAIMove(this.AIturn, this.depth)
                    this.isAIThinking = false
                },100)
            }
        }
    }

    renderUpdate(timestamp) {
        // 예: 애니메이션 중일 때 좌표 보간하거나 상태 바꾸기
        if (this.isAnimating) {
            this.animTime += timestamp - this.lastTimestamp;
            // 애니메이션이 끝났으면 멈추기
        }

        if(this.board.board){
            for(let piece of this.board.board.flat()){
                piece?.updateAnimationPos();
            }
        }
    
        this.lastTimestamp = timestamp;
        
    } //챗지피티 도움

    getAllMovablePositions(team){ //그 팀의 모든 이동가능 포지션 가져오기 (어떤 말이 이동하는진 X)
        let allMovablePositions = [];
        for(let i = 0; i < this.board.board.length; i++){
            for(let j = 0; j < this.board.board[0].length; j++){
                let piece = this.board.board[i][j]
                if(piece?.team == team){
                    let movablePositions = piece.getMovablePositions(this.board.board, {
                        checkKingSafety: true,
                        cloneBoardFn: () => this.board.clone(),
                        isAI : true,
                        move : piece.moveNum,
                    });

                    allMovablePositions.push(movablePositions);
                }
            }
        }
        return allMovablePositions.flat()
    }
    
    getMovableCount(team){ //위 getAllMovablePositions의 길이 뽑음
        return this.getAllMovablePositions(team).length;
    }

    isCheck(team){ //체크인지
        const king = this.board.board.flat().find(piece => piece?.piece == 'king' && piece?.team == team);

        return this.getAllMovablePositions(-team).some(pos => pos.x == king.x && pos.y == king.y)
    }

    isCheckmate(team){ //체크메이트인지
        return this.isCheck(team) && this.getAllMovablePositions(team).length == 0
    }
    
    isStalemate(team){ //스테일메이트인지
        return !this.isCheck(team) && this.getAllMovablePositions(team).length == 0
    }
    
    render(){ //화면렌더
        this.board.drawBoard();
        if( this.state == GameState.MovePiece && this.selectedPiece){
            this.board.drawValidMovements(this.selectedPiece, this.validMovements);
        }
        
        this.board.drawPieces();

        if (this.state == GameState.SelectPromotion) { //프로모션 선택해야할때 UI
            this.board.drawPromotion(this.promoteTarget.team);
        }

        if(this.isAIThinking == true){
            this.board.AIthinkingdraw(this.AIturn)
        }
    }

    getBestMove(team, depth){ //AI
        const cloneChess = new SimulateGame(this.board.clone(), this.turn, this.move);
        cloneChess.whiteMovableCount = this.whiteMovableCount;
        cloneChess.blackMovableCount = this.blackMovableCount;

        console.log(cloneChess)

        return cloneChess.getBestMove(team, depth)
    }

    makeAIMove(team, depth){
        let moves = this.getBestMove(team, depth)
        let bestMoves = moves[0];

        this.selectedPiece = this.board.board[bestMoves.x][bestMoves.y];

        this.movePiece(this.selectedPiece, bestMoves.selectedPos)
    }

    update(){ //판 업데이트 주로 턴이 넘어가야할때 계산
        this.selectedPiece.moveNum = this.move;
        //console.log(this.selectedPiece)

        this.selectedPiece = null;
        this.validMovements = [];
        this.promoteTarget = null;

        this.move ++;
        this.turn *= -1;

        if(this.turn == 1) this.whiteMovableCount = this.getMovableCount(1);
        else this.blackMovableCount = this.getMovableCount(-1);

        console.log(`현재 수 : ${this.move}, 현재 턴 : ${this.turn}`)

        if(this.isCheckmate(this.turn)){
            alert(`${-this.turn} 승리!!`)
        }
        else if(this.isStalemate(this.turn)){
            alert('무승부1!')
        }
        
        if(this.turn == this.AIturn && this.isAI){
            this.isAIThinking = true;
            setTimeout(() => { 
                this.makeAIMove(this.AIturn, this.depth)
                this.isAIThinking = false
            },1000)
        }

    }

    setupInputHandlers() { //마우스 터치
        this.canvas.addEventListener('pointerdown', this.handlePointerDown.bind(this));
    }

    promotePiece(board, promotepiececlassname) { //보드와 해당 말
        let tempAnimX = board[this.promoteTarget.x][this.promoteTarget.y].animationX;
        let tempAnimY = board[this.promoteTarget.x][this.promoteTarget.y].animationY;
        let tempMoveNum = board[this.promoteTarget.x][this.promoteTarget.y].moveNum;

        let temp = {
            'queen' : Queen,
            'bishop' : Bishop,
            'knight' : Knight,
            'rook' : Rook
        }

        board[this.promoteTarget.x][this.promoteTarget.y] = new temp[promotepiececlassname](this.promoteTarget.team, this.promoteTarget.x, this.promoteTarget.y);
        board[this.promoteTarget.x][this.promoteTarget.y].isMoved = 1;

        board[this.promoteTarget.x][this.promoteTarget.y].animationX = tempAnimX;
        board[this.promoteTarget.x][this.promoteTarget.y].animationY = tempAnimY;
        board[this.promoteTarget.x][this.promoteTarget.y].moveNum = tempMoveNum;
    }

    handlePointerDown(event) {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;

        const offsetX = (this.canvas.width - this.board.boardSize) / 2;
        const offsetY = (this.canvas.height - this.board.boardSize) / 2;

        const chessPosX = Math.floor((mouseX - offsetX) / this.board.cellSize); //선택한 좌표x
        const chessPosY = Math.floor((mouseY - offsetY) / this.board.cellSize); //선택한 좌표y
        
        switch(this.state){
            case GameState.SelectPiece :
                this.selectPiece(chessPosX, chessPosY)
                //this.render()
                break;
            case GameState.MovePiece : 
                if(this.board.board[chessPosX][chessPosY] === this.selectedPiece){
                    this.selectedPiece = null;
                    this.validMovements = [];

                    this.state = GameState.SelectPiece;
                    break;
                }
                else {
                    const selectedPos = this.validMovements.find(pos => pos.x === chessPosX && pos.y === chessPosY); //선택한 이동 가능 위치
                    this.movePiece(this.selectedPiece, selectedPos);
                    break;
                }
            case GameState.SelectPromotion : 
                const promotionSelect = Math.floor((mouseX - this.canvas.width/2) / this.board.promotionCellSize + 2)
                
                if(0 <= promotionSelect && promotionSelect < 4 && this.canvas.height/2 - this.board.promotionCellSize/2 < mouseY && mouseY < this.canvas.height/2 + this.board.promotionCellSize/2){
                    let promoteTo = ['queen', 'bishop', 'knight', 'rook'];
                    this.promotePiece(this.board.board, promoteTo[promotionSelect]);

                    //this.render();
                    this.state = GameState.SelectPiece

                    this.update()
                    
                    //console.log(promotionSelect)
                }
        }
    }

    movePiece(selectedPiece, selectedPos){
        if(selectedPos){ //이동 가능 위치를 클릭했는지 (selectedPos가 존재하는지)
            if(selectedPos.special == null){
                if(selectedPos.capture == false){ //일반적인 움직임
                    const prevX = selectedPiece.x;
                    const prevY = selectedPiece.y;

                    selectedPiece.isMoved=1;
                    if(selectedPiece?.piece == 'pawn' && Math.abs(selectedPiece.y - selectedPos.y) == 2){
                        selectedPiece.isMoved = 2;
                    } //폰 2칸 움직임 처리

                    selectedPiece.x = selectedPos.x;
                    selectedPiece.y = selectedPos.y;

                    this.board.board[selectedPos.x][selectedPos.y] = selectedPiece;
                    this.board.board[prevX][prevY] = null;
                    
                    this.state = GameState.SelectPiece;
                    this.update()
                    //this.render()
                }
                if(selectedPos.capture == true){ //기물 잡는 움직임
                    const prevX = selectedPiece.x;
                    const prevY = selectedPiece.y;

                    selectedPiece.isMoved=1;

                    selectedPiece.x = selectedPos.x;
                    selectedPiece.y = selectedPos.y;

                    this.board.board[selectedPos.x][selectedPos.y] = selectedPiece;
                    this.board.board[prevX][prevY] = null;
                    
                    this.state = GameState.SelectPiece;
                    this.update()
                    //this.render()
                }
            }
            else{
                const prevX = selectedPiece.x;
                const prevY = selectedPiece.y;

                switch(selectedPos.special.name){
                    case 'enpassant' : //앙파상
                        let enpassantPos = {
                            x : selectedPos.special.targetX,
                            y : selectedPos.special.targetY
                        }
                        
                        selectedPiece.isMoved=1;

                        selectedPiece.x = selectedPos.x;
                        selectedPiece.y = selectedPos.y;

                        this.board.board[selectedPos.x][selectedPos.y] = selectedPiece;
                        this.board.board[prevX][prevY] = null;
                        this.board.board[enpassantPos.x][enpassantPos.y] = null;
                        
                        this.state = GameState.SelectPiece;
                        this.update()
                        //this.render()
                        break;
                    case 'castling' : //캐슬링
                        let targetRook = this.board.board[selectedPos.special.rookFromX][selectedPos.special.rookFromY];
                        let castlingRookPos = {
                            x : selectedPos.special.rookToX,
                            y : selectedPos.special.rookToY
                        }

                        const prevRookX = targetRook.x; //룩의 이동 전 위치 저장장
                        const prevRookY = targetRook.y;

                        selectedPiece.isMoved=1;
                        targetRook.isMoved=1;

                        selectedPiece.x = selectedPos.x; //선택된 말(왕) 내부 좌표 변경
                        selectedPiece.y = selectedPos.y;
                        targetRook.x = castlingRookPos.x; //선택된 룩 내부 좌표 변경
                        targetRook.y = castlingRookPos.y;

                        this.board.board[selectedPos.x][selectedPos.y] = selectedPiece; //선택된 좌표에 선택한 말 넣기
                        this.board.board[castlingRookPos.x][castlingRookPos.y] = targetRook; //캐슬링될 위치에 선택된 룩 넣기
                        this.board.board[prevX][prevY] = null; 
                        this.board.board[prevRookX][prevRookY] = null;
                        
                        this.state = GameState.SelectPiece;
                        this.update()
                        //this.render()
                        break;
                    case 'promotion' : //프로모션
                        if(selectedPos.special.promoteTo == null){ //사람 선택
                            this.state = GameState.SelectPromotion;

                            this.promoteTarget = selectedPiece;

                            const prevX = selectedPiece.x;
                            const prevY = selectedPiece.y;

                            selectedPiece.isMoved=1;
                            
                            selectedPiece.x = selectedPos.x;
                            selectedPiece.y = selectedPos.y;

                            this.board.board[selectedPos.x][selectedPos.y] = selectedPiece;
                            this.board.board[prevX][prevY] = null;
                            
                            //this.render();
                            //this.board.drawPromotion(this.promoteTarget.team);
                        }
                        else{ //AI선택
                            const prevX = selectedPiece.x;
                            const prevY = selectedPiece.y;

                            selectedPiece.isMoved=1;
                            
                            selectedPiece.x = selectedPos.x;
                            selectedPiece.y = selectedPos.y;

                            this.board.board[selectedPos.x][selectedPos.y] = selectedPiece;
                            this.board.board[prevX][prevY] = null;

                            this.promoteTarget = selectedPiece
                            
                            this.promotePiece(this.board.board, selectedPos.special.promoteTo);
                            
                            this.state = GameState.SelectPiece;
                            this.update()
                            //this.render()
                        }
                }
            }
        }
    }

    inBounds(x, y) {
        return x >= 0 && x < 8 && y >= 0 && y < 8;
    }

    selectPiece(x, y) {
        const piece = this.board.board[x][y];
        const team = piece?.team;
        if (!piece || this.turn != team || this.AIturn == piece?.team) return;

        this.selectedPiece = piece;
        this.validMovements = piece.getMovablePositions(this.board.board, {
            checkKingSafety: true,
            cloneBoardFn: () => this.board.clone(),
            isAI : false,
            move : this.move,
        });
        this.state = GameState.MovePiece;
    }
}

class SimulateGame {
    constructor(board, turn, move) {
        this.board = board;
        this.turn = turn; // 1: white, -1: black
        this.move = move; //수

        this.selectedPiece = null;
        this.validMovements = [];
        this.promoteTarget = null;

        this.whiteMovableCount = 0;
        this.blackMovableCount = 0;
    }

    update(){
        this.selectedPiece.moveNum = this.move;
        //console.log(this.selectedPiece)

        this.selectedPiece = null;
        this.validMovements = [];
        this.promoteTarget = null;

        this.move ++;
        this.turn *= -1;
        
        this.whiteMovableCount = this.getMovableCount(1);
        this.blackMovableCount = this.getMovableCount(-1);

        //console.log(`현재 수 : ${this.move}, 현재 턴 : ${this.turn}`)
    }

    getAllMovablePositions(team){
        let allMovablePositions = [];
        for(let i = 0; i < this.board.board.length; i++){
            for(let j = 0; j < this.board.board[0].length; j++){
                let piece = this.board.board[i][j]
                if(piece?.team == team){
                    let movablePositions = piece.getMovablePositions(this.board.board, {
                        checkKingSafety: false,
                        cloneBoardFn: () => this.board.clone(),
                        isAI : true,
                        move : piece.moveNum,
                    });

                    allMovablePositions.push(movablePositions);
                }
            }
        }
        return allMovablePositions.flat()
    }
    
    getMovableCount(team){
        return this.getAllMovablePositions(team).length;
    }

    isCheck(team){
        const king = this.board.board.flat().find(piece => piece?.piece == 'king' && piece?.team == team);
        if(!king){
            console.error('왕이 없다!!!!!!!!!!!!!!!!!!!!!!')
            console.log(this.board)
        }

        return this.getAllMovablePositions(-team).some(pos => pos?.x == king.x && pos?.y == king.y);
    }

    isCheckmate(team){
        return this.isCheck(team) && this.getAllMovablePositions(team).length == 0
    }
    
    isStalemate(team){
        return !this.isCheck(team) && this.getAllMovablePositions(team).length == 0
    }
    
    promotePiece(board, promotepiececlassname) {
        let tempAnimX = board[this.promoteTarget.x][this.promoteTarget.y].animationX;

        let tempAnimY = board[this.promoteTarget.x][this.promoteTarget.y].animationY;
        let tempMoveNum = board[this.promoteTarget.x][this.promoteTarget.y].moveNum

        let temp = {
            'queen' : Queen,
            'bishop' : Bishop,
            'knight' : Knight,
            'rook' : Rook
        }

        board[this.promoteTarget.x][this.promoteTarget.y] = new temp[promotepiececlassname](this.promoteTarget.team, this.promoteTarget.x, this.promoteTarget.y);
        board[this.promoteTarget.x][this.promoteTarget.y].isMoved = 1;

        board[this.promoteTarget.x][this.promoteTarget.y].animationX = tempAnimX;
        board[this.promoteTarget.x][this.promoteTarget.y].animationY = tempAnimY;
        board[this.promoteTarget.x][this.promoteTarget.y].moveNum = tempMoveNum;
    }

    movePiece(selectedPiece, selectedPos){
        if(selectedPos){ //이동 가능 위치를 클릭했는지 (selectedPos가 존재하는지)
            if(selectedPos.special == null){
                if(selectedPos.capture == false){ //일반적인 움직임
                    const prevX = selectedPiece.x;
                    const prevY = selectedPiece.y;

                    selectedPiece.isMoved=1;
                    if(selectedPiece?.piece == 'pawn' && Math.abs(selectedPiece.y - selectedPos.y) == 2){
                        selectedPiece.isMoved = 2;
                    } //폰 2칸 움직임 처리

                    selectedPiece.x = selectedPos.x;
                    selectedPiece.y = selectedPos.y;

                    this.board.board[selectedPos.x][selectedPos.y] = selectedPiece;
                    this.board.board[prevX][prevY] = null;

                }
                if(selectedPos.capture == true){ //기물 잡는 움직임
                    const prevX = selectedPiece.x;
                    const prevY = selectedPiece.y;

                    selectedPiece.isMoved=1;

                    selectedPiece.x = selectedPos.x;
                    selectedPiece.y = selectedPos.y;

                    this.board.board[selectedPos.x][selectedPos.y] = selectedPiece;
                    this.board.board[prevX][prevY] = null;
                    //this.render()
                }
            }
            else{
                const prevX = selectedPiece.x;
                const prevY = selectedPiece.y;

                switch(selectedPos.special.name){
                    case 'enpassant' : //앙파상
                        let enpassantPos = {
                            x : selectedPos.special.targetX,
                            y : selectedPos.special.targetY
                        }
                        
                        selectedPiece.isMoved=1;

                        selectedPiece.x = selectedPos.x;
                        selectedPiece.y = selectedPos.y;

                        this.board.board[selectedPos.x][selectedPos.y] = selectedPiece;
                        this.board.board[prevX][prevY] = null;
                        this.board.board[enpassantPos.x][enpassantPos.y] = null;
                        break;
                    case 'castling' : //캐슬링
                        let targetRook = this.board.board[selectedPos.special.rookFromX][selectedPos.special.rookFromY];
                        let castlingRookPos = {
                            x : selectedPos.special.rookToX,
                            y : selectedPos.special.rookToY
                        }

                        //console.log('castling')
                        const prevRookX = targetRook.x; //룩의 이동 전 위치 저장장
                        const prevRookY = targetRook.y;

                        selectedPiece.isMoved=1;
                        targetRook.isMoved=1;

                        selectedPiece.x = selectedPos.x; //선택된 말(왕) 내부 좌표 변경
                        selectedPiece.y = selectedPos.y;
                        targetRook.x = castlingRookPos.x; //선택된 룩 내부 좌표 변경
                        targetRook.y = castlingRookPos.y;

                        this.board.board[selectedPos.x][selectedPos.y] = selectedPiece; //선택된 좌표에 선택한 말 넣기
                        this.board.board[castlingRookPos.x][castlingRookPos.y] = targetRook; //캐슬링될 위치에 선택된 룩 넣기
                        this.board.board[prevX][prevY] = null; 
                        this.board.board[prevRookX][prevRookY] = null;

                        
                        break;
                    case 'promotion' : //프로모션
                        if(selectedPos.special.promoteTo == null){ //사람 선택
                            this.state = GameState.SelectPromotion;

                            this.promoteTarget = selectedPiece;

                            const prevX = selectedPiece.x;
                            const prevY = selectedPiece.y;

                            selectedPiece.isMoved=1;
                            
                            selectedPiece.x = selectedPos.x;
                            selectedPiece.y = selectedPos.y;

                            this.board.board[selectedPos.x][selectedPos.y] = selectedPiece;
                            this.board.board[prevX][prevY] = null;
                        }
                        else{ //AI선택
                            const prevX = selectedPiece.x;
                            const prevY = selectedPiece.y;

                            selectedPiece.isMoved=1;
                            
                            selectedPiece.x = selectedPos.x;
                            selectedPiece.y = selectedPos.y;

                            

                            this.board.board[selectedPos.x][selectedPos.y] = selectedPiece;
                            this.board.board[prevX][prevY] = null;
                            
                            this.promoteTarget = selectedPiece
                            
                            this.promotePiece(this.board.board, selectedPos.special.promoteTo);
                        }
                }
            }
        }
    }

    inBounds(x, y) {
        return x >= 0 && x < 8 && y >= 0 && y < 8;
    }

    selectPiece(x, y) {
        const piece = this.board.board[x][y];
        const team = piece?.team;
        if (!piece || this.turn != team) return;

        this.selectedPiece = piece;
        this.validMovements = piece.getMovablePositions(this.board.board, {
            checkKingSafety: true,
            cloneBoardFn: () => this.board.clone(),
            isAI : false,
            move : this.move,
        });
        this.state = GameState.MovePiece;
    }
    
    copyAndMovePiece(x, y, selectedPos){
        let cloneChess = this.clone();
        //console.log(cloneChess)

        cloneChess.selectedPiece = cloneChess.board.board[x][y];
        
        cloneChess.movePiece(cloneChess.selectedPiece, selectedPos)
        cloneChess.update();

        //console.log(cloneChess.turn)

        return cloneChess
    }

    getBestMove(team, depth){
        let movablePositionsWithPieces = [];

        //각 말과 그 말의 이동가능위치를 담은 배열 제작
        for(let i = 0; i < this.board.cols; i++){
            for(let j = 0; j < this.board.rows; j++){
                const piece = this.board.board[i][j]
                if(!piece || piece?.team == -team) continue; //아군 말에 대한 모든 이동가능위치 출력

                let movablePositions = piece.getMovablePositions(this.board.board, {
                        checkKingSafety: true,
                        cloneBoardFn: () => this.board.clone(),
                        isAI : true,
                        move : piece.moveNum,
                    });
                if(movablePositions.length == 0) continue
                
                let movablePositionsWithPiece = {
                    x : piece.x,
                    y : piece.y,
                    movablePositions : movablePositions
                }

                movablePositionsWithPieces.push(movablePositionsWithPiece);
            }
        }

        //console.log(movablePositionsWithPieces)

        let scoreWithPiecePos = [] //이 안에는 어디있던 말이 어디로 이동했고 그때 총 점수가 몇인지가 담긴 오브젝트 여러개가 배열로 존재한다
        
        let setAlpha = -Infinity;
        let setBeta = Infinity;

        let bestScore = -Infinity

        //미니맥스를 돌리기 위한 for문; 모든 판에 대해 미니맥스를 실행해 점수 출력
        for(let piecePos of movablePositionsWithPieces){ //말 위치와 이동배열이 담긴 for문
            for(let selectedPos of piecePos.movablePositions){ //이동배열에 담긴 각각의 이동 위치
                let cloneSimulateGame = this.copyAndMovePiece(piecePos.x, piecePos.y, selectedPos) //그 위치로 이동한 가상 체스판

                let minimaxoutput = cloneSimulateGame.minimax(depth, team, setAlpha, setBeta); //입력받은 가상 SimulateGame 클래스를 통해 미니맥스를 진행하여 점수를 뽑는다.
                
                let score = minimaxoutput.score

                bestScore = Math.max(bestScore, score)
                        
                setAlpha = Math.max(score, setAlpha)

                let scoreobj ={
                    x : piecePos.x,
                    y : piecePos.y,
                    selectedPos : selectedPos,
                    score
                }

                scoreWithPiecePos.push(scoreobj);

                if(setAlpha >= setBeta){
                    scoreWithPiecePos.sort((a, b) => b.score - a.score);
                    return scoreWithPiecePos
                }
            }
        }

        scoreWithPiecePos.sort((a, b) => b.score - a.score);
        return scoreWithPiecePos //일단 어디로 갈지 정제되지 않은 다음 모든 위치와 그에 따른 점수가 담긴 배열을 출력
    }

    EvaluateBoard(board, team){
        let score = 0;
        let gameruleScore = 0;
        let mobilityScore = team == 1 ? this.whiteMovableCount - this.blackMovableCount : -this.whiteMovableCount + this.blackMovableCount;

        if(this.isCheck(team)){ //우리팀이 체크일때때
            gameruleScore += -30;
        }
        if(this.isCheck(-team)){ //적이 체크일 때
            gameruleScore += 40;
        } 
        if(this.isStalemate(team)){ //현재가 스테일메이트일 때
            gameruleScore += -500;
        }
        if(this.isCheckmate(team)) { //현재 턴인 팀이 체크메이트일 때
            return -team * Infinity;
        }
        

        for(let col = 0; col < 8; col++){
            for(let row = 0; row < 8; row++){
                const piece = board[col][row];
                if(!piece) continue;

                let pieceScore = piece.score; //기물 자체 점수
                let pstScore = getPieceSquareValue(piece, col, row)/10; //기물의 위치 가중치

                let finalScore = pieceScore + pstScore; 
                
                score += team == piece.team ? finalScore : -finalScore //팀에 따라 부호 변경
            }
        }
        return score + gameruleScore + (mobilityScore * 0.1);
    }

    minimax(depth, team, alpha=-Infinity, beta=Infinity){
        //console.log(depth)
        //console.log(this.board)
        aaa++
        
        if(depth == 0 || this.isCheckmate(this.turn)|| this.isStalemate(this.turn)){ //깊이가 0이면 현재 그 상태에서의 판 상태의 점수를 출력한다.
            
            return {score :this.EvaluateBoard(this.board.board, team),
                alpha: alpha,
                beta: beta,
            };
        }
        else{ //깊이가 0이 아니라면
            let setAlpha = alpha;
            let setBeta = beta;
            
            //자기 차례면 최대를 구하기 위해 -무한에서, 적 차례면 최소를 구하기 위해 무한에서
            let bestScore = team == this.turn ? -Infinity : Infinity 
            
            let movablePositionsWithPieces = [];
            //각 말과 그 말의 이동가능위치를 담은 배열 제작
            
            for(let i = 0; i < this.board.cols; i++){
                for(let j = 0; j < this.board.rows; j++){
                    const piece = this.board.board[i][j]
                    if(!piece || piece?.team == -this.turn) continue; //현재 턴의 말에 대한 모든 이동가능위치 출력
                    let movablePositions = piece.getMovablePositions(this.board.board, {
                            checkKingSafety: true,
                            cloneBoardFn: () => this.board.clone(),
                            isAI : true,
                            move : piece.moveNum,
                        });
                    if(movablePositions.length == 0) continue
                    
                    let movablePositionsWithPiece = {
                        
                        x : piece.x,
                        y : piece.y,
                        movablePositions : movablePositions
                    }
    
                    movablePositionsWithPieces.push(movablePositionsWithPiece);
                }
            }

            //console.log(movablePositionsWithPieces)
            if(team == this.turn){ //현재가 자기 턴이면
                //다음 턴에선 적군 => 낸 수 중에서 점수가 최대인 걸 골라내야함 (그래야 적에게 안좋음)
                for(let piecePos of movablePositionsWithPieces){
                    for(let selectedPos of piecePos.movablePositions){
                        
                        let nextGame = this.copyAndMovePiece(piecePos.x, piecePos.y, selectedPos) //그 위치로 이동한 가상 체스판

                        let minimaxoutput = nextGame.minimax(depth-1, team, setAlpha, setBeta); //입력받은 가상 SimulateGame 클래스를 통해 미니맥스를 진행하여 점수를 뽑는다.
                        
                        let score = minimaxoutput.score
                        
                        bestScore = Math.max(bestScore, score)
                        
                        setAlpha = Math.max(score, setAlpha)
                        
                        if(setAlpha >= setBeta){
                            
                            return {
                                score : bestScore,
                                alpha : setAlpha,
                                beta : setBeta
                            }
                        }
                    }
                }
            }
            else if(team == -this.turn){ //현재가 적의 턴이면
                //다음 턴에선 아군 => 낸 수 중에서 점수가 최악인 걸 골라내야함 (그래야 나에게 안좋음)
                for(let piecePos of movablePositionsWithPieces){
                    for(let selectedPos of piecePos.movablePositions){
                        let nextGame = this.copyAndMovePiece(piecePos.x, piecePos.y, selectedPos) //그 위치로 이동한 가상 체스판
                        //console.log(`nextGame.turn : ${nextGame.turn}`)
                        //console.log(depth)
                        
                        let minimaxoutput = nextGame.minimax(depth-1, team, setAlpha, setBeta); //입력받은 가상 SimulateGame 클래스를 통해 미니맥스를 진행하여 점수를 뽑는다.
                        //console.log(minimaxoutput)

                        let score = minimaxoutput.score;
                        
                        
                        bestScore = Math.min(bestScore, score)
                        
                        setBeta = Math.min(score, setBeta)
                        
                        if(setAlpha >= setBeta){
                            
                            return {
                                score : bestScore,
                                alpha : setAlpha,
                                beta : setBeta
                            }
                        }
                    }
                }
            }
            
            return {
                score : bestScore,

                alpha : setAlpha,
                beta : setBeta
            }
        }
    }

    clone() {
        const newBoard = this.board.clone()
        const clone = new SimulateGame(newBoard, this.turn, this.move);
        clone.whiteMovableCount = this.whiteMovableCount;
        clone.blackMovableCount = this.blackMovableCount;
        return clone
    }
}

function getPieceSquareValue(piece, x, y){
    const table = PST[piece.piece];
    return piece.team == 1
        ? table[y][x]
        : table[7-y][x]; // 흑은 y 반전
}

let aaa = 0

const PST = {
    pawn : [
    [ 0,   0,   0,   0,   0,   0,   0,   0 ],
    [ 5,   5,   5,  -5,  -5,   5,   5,   5 ],
    [ 1,   1,   2,   3,   3,   2,   1,   1 ],
    [ 0.5, 0.5, 1,   2.5, 2.5, 1,   0.5, 0.5 ],
    [ 0,   0,   0,   2,   2,   0,   0,   0 ],
    [ 0.5,-0.5,-1,   0,   0,  -1, -0.5, 0.5 ],
    [ 0.5, 1,   1,  -2,  -2,   1,   1,  0.5 ],
    [ 0,   0,   0,   0,   0,   0,   0,   0 ]
    ],

    knight : [
    [-5, -4, -3, -3, -3, -3, -4, -5],
    [-4, -2,  0,  0,  0,  0, -2, -4],
    [-3,  0,  1, 1.5, 1.5,  1,  0, -3],
    [-3, 0.5, 1.5, 2, 2, 1.5, 0.5, -3],
    [-3, 0, 1.5, 2, 2, 1.5, 0, -3],
    [-3, 0.5, 1, 1.5, 1.5, 1, 0.5, -3],
    [-4, -2, 0, 0.5, 0.5, 0, -2, -4],
    [-5, -4, -3, -3, -3, -3, -4, -5]
    ],

    bishop : [
    [-2, -1, -1, -1, -1, -1, -1, -2],
    [-1,  0,  0,  0,  0,  0,  0, -1],
    [-1,  0,  0.5, 1, 1, 0.5,  0, -1],
    [-1, 0.5, 0.5, 1, 1, 0.5, 0.5, -1],
    [-1,  0, 1, 1, 1, 1,  0, -1],
    [-1, 1, 1, 1, 1, 1, 1, -1],
    [-1, 0.5, 0, 0, 0, 0, 0.5, -1],
    [-2, -1, -1, -1, -1, -1, -1, -2]
    ],

    rook : [
    [ 0,  0,  0, 0.5, 0.5,  0,  0,  0 ],
    [-0.5, 0, 0, 0, 0, 0, 0, -0.5],
    [-0.5, 0, 0, 0, 0, 0, 0, -0.5],
    [-0.5, 0, 0, 0, 0, 0, 0, -0.5],
    [-0.5, 0, 0, 0, 0, 0, 0, -0.5],
    [-0.5, 0, 0, 0, 0, 0, 0, -0.5],
    [ 0.5, 1, 1, 1, 1, 1, 1,  0.5 ],
    [ 0,  0, 0, 0, 0, 0, 0,  0 ]
    ],

    queen : [
    [-2, -1, -1, -0.5, -0.5, -1, -1, -2],
    [-1,  0,  0,     0,     0,  0,  0, -1],
    [-1,  0, 0.5, 0.5, 0.5, 0.5,  0, -1],
    [-0.5, 0, 0.5, 0.5, 0.5, 0.5,  0, -0.5],
    [ 0,  0, 0.5, 0.5, 0.5, 0.5,  0, -0.5],
    [-1, 0.5, 0.5, 0.5, 0.5, 0.5,  0, -1],
    [-1,  0, 0.5,  0,  0,  0,  0, -1],
    [-2, -1, -1, -0.5, -0.5, -1, -1, -2]
    ],

    king : [
    [-3, -4, -4, -5, -5, -4, -4, -3],
    [-3, -4, -4, -5, -5, -4, -4, -3],
    [-3, -4, -4, -5, -5, -4, -4, -3],
    [-3, -4, -4, -5, -5, -4, -4, -3],
    [-2, -3, -3, -4, -4, -3, -3, -2],
    [-1, -2, -2, -2, -2, -2, -2, -1],
    [ 2,  2,  0,  0,  0,  0,  2,  2],
    [ 2,  3,  1,  0,  0,  1,  3,  2]
    ]
}



/*
function EvaluateBoard(board, team){
    let score = 0;
    let gameruleScore = 0;
    let mobilityScore = team == 1 ? this.whiteMovableCount - this.blackMovableCount : -this.whiteMovableCount + this.blackMovableCount;

    if(this.isCheck(team)){ //우리팀이 체크일때때
        gameruleScore += -30;
    }
    if(this.isCheck(-team)){ //적이 체크일 때
        gameruleScore += 40;
    } 
    if(this.isStalemate(team)){ //현재가 스테일메이트일 때
        gameruleScore += -500;
    }
    if(this.isCheckmate(team)) { //내가 체크메이트일 때
        return -Infinity;
    }
    if(this.isCheckmate(-team)) { //적이 체크메이트일 때
        return Infinity;
    }

    for(let col = 0; col < 8; col++){
        for(let row = 0; row < 8; row++){
            const piece = board[col][row];
            if(!piece) continue;

            let pieceScore = piece.score; //기물 자체 점수
            let pstScore = getPieceSquareValue(piece, col, row); //기물의 위치 가중치

            let finalScore = pieceScore + pstScore; 
            
            score += team == piece.team ? finalScore : -finalScore //팀에 따라 부호 변경
        }
    }
    return score + gameruleScore + mobilityScore * 0.1;
}

GameManager.prototype.EvaluateBoard = function(team) {
    return EvaluateBoard(this.board.board, team).call(this);
}

SimulateGame.prototype.EvaluateBoard = function(team) {
    return EvaluateBoard(this.board.board, team).call(this);
}
*/



//loadAllPieceImages() 

const mainChess = new GameManager(canvas,0.9);
mainChess.startGame();
mainChess.setupInputHandlers();

async function dataset(){
    await document.fonts.load("15px 'SUIT-Regular'");
    await document.fonts.ready;

    await loadAllPieceImages();
    
    // mainChess.drawBoard();
    // mainChess.initBoard();
    // mainChess.drawPieces();
} //챗지피티 도움

dataset()


function gameLoop(timestamp) {
    mainChess.renderUpdate(timestamp);
    mainChess.render();

    requestAnimationFrame(gameLoop);
}

window.onload = requestAnimationFrame(gameLoop);


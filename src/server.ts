const express = require('express')
const app = express();
import * as bodyParser from 'body-parser'
import('date-utils')

app.use(bodyParser.raw({ type: '*/*', limit: '512mb' }));
app.set('view engine', 'pug')

app.get('/', (req: any, res: any) => {
  res.render('plays', {
    'title': 'CSGO tv_broadcast server',
    'matches': match,
    'url':"http://localhost:3000/"
  });
});


app.get('/match/:token/:fragment_number/:frametype', function (req:any, res:any) {
  console.log('Fragment request for',req.params.fragment_number)
  res.setHeader('Content-Type', 'application/octet-stream')
  var p = Buffer.alloc(16, 0, 'binary');
  if (req.params.frametype == 'start') {
    p = match[req.params.token].start[req.params.fragment_number]
  }
  if (req.params.frametype == 'delta') {
    p = match[req.params.token].delta[req.params.fragment_number]
  }
  if (req.params.frametype == 'full') {
    p = match[req.params.token].full[req.params.fragment_number]
  }
  if (!p) {
    //console.log(p)
    res.send(404);
  }
  else {
    //console.log(p)
    res.write(p, 'binary');
    res.end(null, 'binary');
  }
})

app.get('/match/:token/sync', function (req:any, res:any) {
  console.log("match sync!")
  const r = match[req.params.token].sync
  //console.log(r)
  res.send(r);
})

//  playcast "http://586f7685.ngrok.io/match/s85568392920768736t1477086968"
app.post('/reset/:token/', (req:any, res:any) => {
  res.send("ACK");
  match[req.params.token].sync.signup_fragment = null;
})


class Matches{
  sync: match_sync
  start:any = []
  full:any = []
  delta: any = []
  token: string
  time: string;
  
  constructor() {
    this.sync = new match_sync();
    this.start[-1] = Buffer.alloc(16, 0, "binary")
    this.full[-1] = Buffer.alloc(16, 0, "binary")
    this.delta[-1] = Buffer.alloc(16, 0, "binary")
    this.token = ""
    this.time = new Date().toJSON()
  }
}

class match_sync{
  tick: number
  rtdelay: number
  rcvage: number
  fragment: number
  signup_fragment: number
  tps: number
  protocool: number;

  constructor() {
    this.tick = -1
    this.rtdelay = 2
    this.rcvage = 2
    this.fragment = -1
    this.signup_fragment = -1
    this.tps = 32
    this.protocool = 4
  }
}
var match:any = {}

app.post('/:token/:fragment_number/:frametype', function (req:any, res:any) {
  //console.log(req.body)
  if (!match[req.params.token]) {
    match[req.params.token] = new Matches();
  }
  console.log(`Fragment token : ${req.params.token}, type : ${req.params.frametype},number : ${req.params.fragment_number}, tick : ${req.query.tick}`);
  if (req.params.frametype == "start") {
    match[req.params.token].sync.signup_fragment = req.params.fragment_number
    match[req.params.token].start[req.params.fragment_number] = req.body
    match[req.params.token].token = req.params.token
  }
  else {
    if (match[req.params.token].sync.signup_fragment == -1) {
      res.status(205).send("Reset");
      console.log('reset at type :', req.params.frametype)
    }
    else {
      //if(req.params.fragment_number){
        //syncdata["fragment"] = req.params.fragment_number
      //}
      if(req.query.tick){
        match[req.params.token].sync.tick = req.query.tick
      }
      if(req.query.tps){
        match[req.params.token].sync.tps = req.query.tps
      }
      if (req.params.frametype == 'full') {
        match[req.params.token].sync.fragment = req.params.fragment_number
        match[req.params.token].full[req.params.fragment_number] = req.body
      }
      if (req.params.frametype == 'delta') {
        match[req.params.token].delta[req.params.fragment_number] = req.body
      }
      res.status(200).send("OK");
    }
  }
})

app.listen(3000, function () {
  console.log('CSGO broadcast server listening on port 3000!');
});
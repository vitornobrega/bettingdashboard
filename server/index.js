const express=require('express');const Database=require('better-sqlite3');const path=require('path');const fs=require('fs');const crypto=require('crypto');
const app=express();app.use(express.json({limit:'1mb'}));const dataDir=process.env.DATA_DIR||'/app/data';fs.mkdirSync(dataDir,{recursive:true});const db=new Database(path.join(dataDir,'betting.db'));db.pragma('journal_mode = WAL');
db.exec(`CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL,email TEXT NOT NULL UNIQUE,password_hash TEXT NOT NULL,role TEXT NOT NULL DEFAULT 'user',active INTEGER NOT NULL DEFAULT 1,created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,user_id INTEGER NOT NULL,expires_at TEXT NOT NULL,FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE);
CREATE TABLE IF NOT EXISTS houses(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL,name TEXT NOT NULL,username TEXT,logo TEXT,bonus_day TEXT,bonus_conditions TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(user_id) REFERENCES users(id));
CREATE TABLE IF NOT EXISTS countries(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL UNIQUE,logo TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS competitions(id INTEGER PRIMARY KEY AUTOINCREMENT,country_id INTEGER NOT NULL,name TEXT NOT NULL,logo TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP,UNIQUE(country_id,name),FOREIGN KEY(country_id) REFERENCES countries(id) ON DELETE CASCADE);
CREATE TABLE IF NOT EXISTS markets(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL UNIQUE,active INTEGER NOT NULL DEFAULT 1,created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS bets(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL,datetime TEXT,house_id INTEGER,country TEXT,competition TEXT,home_team TEXT,away_team TEXT,market TEXT,selection TEXT,odds REAL,stake REAL,units REAL,bonus INTEGER DEFAULT 0,result TEXT DEFAULT 'pending',profit REAL DEFAULT 0,notes TEXT,bet_type TEXT DEFAULT 'single',selections TEXT,combined_odds REAL,created_at TEXT DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(user_id) REFERENCES users(id),FOREIGN KEY(house_id) REFERENCES houses(id));
CREATE TABLE IF NOT EXISTS transactions(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL,house_id INTEGER,type TEXT,amount REAL,method TEXT,status TEXT,datetime TEXT,notes TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(user_id) REFERENCES users(id),FOREIGN KEY(house_id) REFERENCES houses(id));
CREATE TABLE IF NOT EXISTS bonuses(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL,house_id INTEGER,week_start TEXT,deadline TEXT,required_events INTEGER,min_odds REAL,min_combined_odds REAL,progress INTEGER DEFAULT 0,status TEXT DEFAULT 'open',notes TEXT,FOREIGN KEY(user_id) REFERENCES users(id),FOREIGN KEY(house_id) REFERENCES houses(id));`);
for(const q of ["ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'user'","ALTER TABLE users ADD COLUMN active INTEGER NOT NULL DEFAULT 1","ALTER TABLE houses ADD COLUMN logo TEXT","ALTER TABLE bets ADD COLUMN bet_type TEXT DEFAULT 'single'","ALTER TABLE bets ADD COLUMN selections TEXT","ALTER TABLE bets ADD COLUMN combined_odds REAL"]){try{db.exec(q)}catch(e){}}
db.prepare("UPDATE users SET role='admin' WHERE lower(email)=lower(?)").run('vitor.nobrega87@gmail.com');
const catalog={
'Portugal':['Liga Portugal Betclic','Liga Portugal 2','Taça de Portugal','Liga 3','Campeonato de Portugal','Liga Portugal Feminino','Taça de Portugal Feminino'],
'Espanha':['LaLiga','LaLiga 2','Primera Federación','Copa del Rey','Liga F'],
'Inglaterra':['Premier League','Championship','League One','League Two','FA Cup','EFL Cup','Women Super League'],
'Alemanha':['Bundesliga','2. Bundesliga','3. Liga','DFB Pokal','Frauen-Bundesliga'],
'Itália':['Série A','Série B','Série C','Taça de Itália','Serie A Feminina'],
'França':['Ligue 1','Ligue 2','National','Coupe de France','Division 1 Feminine'],
'Países Baixos':['Eredivisie','Eerste Divisie','KNVB Beker','Eredivisie Feminina'],
'Bélgica':['Primeira Liga','Segunda Liga','Taça da Bélgica','Liga Feminina'],
'Escócia':['Premiership','Championship','League One','League Two','Scottish Cup'],
'Turquia':['Super Lig','1. Lig','Taça da Turquia','Supertaça'],
'Grécia':['Super League','Super League 2','Taça da Grécia'],
'Áustria':['Bundesliga','2. Liga','ÖFB Cup'],
'Suíça':['Super League','Challenge League','Taça da Suíça'],
'Portugal':['Liga Portugal Betclic','Liga Portugal 2','Taça de Portugal','Liga 3','Campeonato de Portugal','Liga Portugal Feminino','Taça de Portugal Feminino'],
'Polónia':['Ekstraklasa','1. Liga','Taça da Polónia'],
'República Checa':['1. Liga','2. Liga','Taça da República Checa'],
'Roménia':['SuperLiga','Liga 2','Cupa României'],
'Croácia':['HNL','Prva NL','Taça da Croácia'],
'Sérvia':['Super Liga','Prva Liga','Taça da Sérvia'],
'Ucrânia':['Premier League','Persha Liga','Taça da Ucrânia'],
'Noruega':['Eliteserien','1. Divisjon','NM Cup'],
'Suécia':['Allsvenskan','Superettan','Svenska Cupen'],
'Dinamarca':['Superliga','1st Division','DBU Pokalen'],
'Finlândia':['Veikkausliiga','Ykkösliiga','Taça da Finlândia'],
'Irlanda':['Premier Division','First Division','FAI Cup'],
'Irlanda do Norte':['Premiership','Championship','Irish Cup'],
'Islândia':['Besta deild','1. deild','Bikarinn'],
'Brasil':['Série A Betano','Série B','Série C','Série D','Copa do Brasil'],
'Argentina':['Liga Profesional','Primera Nacional','Copa Argentina','Liga Profesional Feminina'],
'Colômbia':['Primera A','Primera B','Copa Colombia'],
'Chile':['Primera División','Primera B','Copa Chile'],
'Uruguai':['Primera División','Segunda División','Copa Uruguay'],
'Paraguai':['Primera División','División Intermedia','Copa Paraguay'],
'Equador':['LigaPro Serie A','LigaPro Serie B','Copa Ecuador'],
'Peru':['Liga 1','Liga 2','Copa Perú'],
'Bolívia':['División Profesional','Copa Bolivia'],
'México':['Liga MX','Liga de Expansión MX','Liga MX Feminina','Copa MX'],
'EUA':['MLS','USL Championship','NWSL'],
'Canadá':['Canadian Premier League','Canadian Championship'],
'Costa Rica':['Primera División','Liga de Ascenso'],
'Japão':['J1 League','J2 League','J3 League','Emperor Cup','WE League'],
'Coreia do Sul':['K League 1','K League 2','K3 League','K4 League'],
'China':['Chinese Super League','China League One','FA Cup'],
'Austrália':['A-League Men','A-League Women','Australia Cup'],
'Nova Zelândia':['National League','Chatham Cup'],
'África do Sul':['Betway Premiership','Motsepe Foundation Championship','Nedbank Cup'],
'Marrocos':['Botola Pro','Botola 2','Taça de Marrocos'],
'Argélia':['Ligue 1','Ligue 2','Taça da Argélia'],
'Tunísia':['Ligue 1','Ligue 2','Taça da Tunísia'],
'Egipto':['Premier League','Second Division','Egypt Cup'],
'Arábia Saudita':['Saudi Pro League','Saudi First Division','King Cup'],
'Emirados Árabes Unidos':['UAE Pro League','UAE First Division','President Cup'],
'Catar':['Qatar Stars League','Qatari Second Division','Emir Cup'],
'Israel':['Ligat ha’Al','Liga Leumit','State Cup'],
'Rússia':['Premier League','First League','Russian Cup'],
};
const insCountry=db.prepare("INSERT OR IGNORE INTO countries(name,logo) VALUES (?,?)");
const insComp=db.prepare("INSERT OR IGNORE INTO competitions(country_id,name) VALUES (?,?)");
for(const [country,comps] of Object.entries(catalog)){insCountry.run(country,'');const row=db.prepare("SELECT id FROM countries WHERE name=?").get(country);for(const name of comps)insComp.run(row.id,name);}
const defaultMarkets=['1X2','Dupla Hipótese','Mais de 0.5 Golos','Mais de 1.5 Golos','Mais de 2.5 Golos','Menos de 0.5 Golos','Menos de 1.5 Golos','Menos de 2.5 Golos','Ambas Marcam','Handicap','Empate Anula','Resultado ao Intervalo'];
for(const n of defaultMarkets)db.prepare("INSERT OR IGNORE INTO markets(name) VALUES(?)").run(n);

function hashPassword(p){const s=crypto.randomBytes(16).toString('hex');return s+':'+crypto.scryptSync(p,s,64).toString('hex')}function verifyPassword(p,st){const[a,k]=String(st).split(':');if(!a||!k)return false;const h=crypto.scryptSync(p,a,64).toString('hex');return crypto.timingSafeEqual(Buffer.from(h,'hex'),Buffer.from(k,'hex'))}function token(){return crypto.randomBytes(32).toString('hex')}
function setCookie(res,n,v,max){res.setHeader('Set-Cookie',`${n}=${v}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${max}${process.env.COOKIE_SECURE==='true'?'; Secure':''}`)}function cookies(req){return Object.fromEntries(String(req.headers.cookie||'').split(';').filter(Boolean).map(x=>{const i=x.indexOf('=');return[x.slice(0,i).trim(),decodeURIComponent(x.slice(i+1).trim())]}))}
function currentUser(req){const t=cookies(req).bt_session;if(!t)return null;const s=db.prepare('SELECT u.id,u.name,u.email,u.role,u.active,s.expires_at FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token=?').get(t);if(!s||!s.active||new Date(s.expires_at)<=new Date()){if(t)db.prepare('DELETE FROM sessions WHERE token=?').run(t);return null}return s}
app.post('/api/auth/register',(req,res)=>{const n=String(req.body.name||'').trim(),e=String(req.body.email||'').trim().toLowerCase(),p=String(req.body.password||'');if(!n||!e||p.length<8)return res.status(400).json({error:'Nome, email e password com pelo menos 8 caracteres são obrigatórios.'});try{const role=e==='vitor.nobrega87@gmail.com'?'admin':'user';const i=db.prepare('INSERT INTO users(name,email,password_hash,role) VALUES(?,?,?,?)').run(n,e,hashPassword(p));db.prepare('UPDATE users SET role=? WHERE id=?').run(role,i.lastInsertRowid);const t=token();db.prepare("INSERT INTO sessions(token,user_id,expires_at) VALUES(?,?,datetime('now','+30 days'))").run(t,i.lastInsertRowid);setCookie(res,'bt_session',t,2592000);res.json({user:{id:i.lastInsertRowid,name:n,email:e,role}})}catch(x){res.status(String(x.message).includes('UNIQUE')?409:500).json({error:String(x.message).includes('UNIQUE')?'Já existe uma conta com este email.':'Não foi possível criar a conta.'})}});
app.post('/api/auth/login',(req,res)=>{const e=String(req.body.email||'').trim().toLowerCase(),p=String(req.body.password||''),u=db.prepare('SELECT id,name,email,password_hash,role,active FROM users WHERE email=?').get(e);if(!u||!u.active||!verifyPassword(p,u.password_hash))return res.status(401).json({error:'Email ou password inválidos.'});const t=token();db.prepare("INSERT INTO sessions(token,user_id,expires_at) VALUES(?,?,datetime('now','+30 days'))").run(t,u.id);setCookie(res,'bt_session',t,2592000);res.json({user:{id:u.id,name:u.name,email:u.email,role:u.role}})});
app.post('/api/auth/logout',(req,res)=>{const t=cookies(req).bt_session;if(t)db.prepare('DELETE FROM sessions WHERE token=?').run(t);setCookie(res,'bt_session','',0);res.json({ok:true})});
app.get('/api/auth/me',(req,res)=>{const u=currentUser(req);if(!u)return res.status(401).json({error:'Não autenticado'});res.json({user:{id:u.id,name:u.name,email:u.email,role:u.role}})});
app.use('/api',(req,res,next)=>{if(req.path.startsWith('/auth/'))return next();const u=currentUser(req);if(!u)return res.status(401).json({error:'Não autenticado'});req.user=u;next()});
const all=(s,...a)=>db.prepare(s).all(...a),run=(s,...a)=>db.prepare(s).run(...a);const requireAdmin=(req,res,next)=>req.user.role==='admin'?next():res.status(403).json({error:'Acesso reservado ao administrador.'});
app.get('/api/admin/users',requireAdmin,(req,res)=>res.json(all('SELECT id,name,email,role,active,created_at FROM users ORDER BY created_at DESC')));
app.patch('/api/admin/users/:id',requireAdmin,(req,res)=>{const id=Number(req.params.id);if(id===req.user.id&&req.body.active===false)return res.status(400).json({error:'Não podes desativar a tua própria conta.'});if(!db.prepare('SELECT id FROM users WHERE id=?').get(id))return res.status(404).json({error:'Utilizador não encontrado.'});if(req.body.active!==undefined)run('UPDATE users SET active=? WHERE id=?',req.body.active?1:0,id);if(req.body.role==='admin'||req.body.role==='user')run('UPDATE users SET role=? WHERE id=?',req.body.role,id);if(req.body.resetSessions)run('DELETE FROM sessions WHERE user_id=?',id);res.json({ok:true})});
app.get('/api/admin/countries',requireAdmin,(req,res)=>res.json(all('SELECT * FROM countries ORDER BY name')));
app.post('/api/admin/countries',requireAdmin,(req,res)=>{try{run('INSERT INTO countries(name,logo) VALUES(?,?)',String(req.body.name||'').trim(),req.body.logo||'');res.json({ok:true})}catch(e){res.status(400).json({error:'País já existe.'})}});
app.put('/api/admin/countries/:id',requireAdmin,(req,res)=>{run('UPDATE countries SET name=?,logo=? WHERE id=?',req.body.name,req.body.logo||'',req.params.id);res.json({ok:true})});
app.delete('/api/admin/countries/:id',requireAdmin,(req,res)=>{run('DELETE FROM countries WHERE id=?',req.params.id);res.json({ok:true})});
app.get('/api/countries',(req,res)=>res.json(all('SELECT * FROM countries ORDER BY name')));
app.get('/api/admin/competitions',requireAdmin,(req,res)=>res.json(all('SELECT c.*,p.name country_name FROM competitions c JOIN countries p ON p.id=c.country_id ORDER BY p.name,c.name')));
app.post('/api/admin/competitions',requireAdmin,(req,res)=>{try{run('INSERT INTO competitions(country_id,name,logo) VALUES(?,?,?)',req.body.country_id,req.body.name,req.body.logo||'');res.json({ok:true})}catch(e){res.status(400).json({error:'Competição já existe neste país.'})}});
app.put('/api/admin/competitions/:id',requireAdmin,(req,res)=>{run('UPDATE competitions SET country_id=?,name=?,logo=? WHERE id=?',req.body.country_id,req.body.name,req.body.logo||'',req.params.id);res.json({ok:true})});
app.delete('/api/admin/competitions/:id',requireAdmin,(req,res)=>{run('DELETE FROM competitions WHERE id=?',req.params.id);res.json({ok:true})});
app.get('/api/competitions',(req,res)=>res.json(all('SELECT c.*,p.name country_name FROM competitions c JOIN countries p ON p.id=c.country_id ORDER BY p.name,c.name')));
app.get('/api/admin/markets',requireAdmin,(req,res)=>res.json(all('SELECT * FROM markets ORDER BY name')));
app.get('/api/markets',(req,res)=>res.json(all('SELECT * FROM markets WHERE active=1 ORDER BY name')));
app.post('/api/admin/markets',requireAdmin,(req,res)=>{try{run('INSERT INTO markets(name,active) VALUES(?,?)',req.body.name,req.body.active===false?0:1);res.json({ok:true})}catch(e){res.status(400).json({error:'Mercado já existe.'})}});
app.put('/api/admin/markets/:id',requireAdmin,(req,res)=>{run('UPDATE markets SET name=?,active=? WHERE id=?',req.body.name,req.body.active?1:0,req.params.id);res.json({ok:true})});
app.delete('/api/admin/markets/:id',requireAdmin,(req,res)=>{run('DELETE FROM markets WHERE id=?',req.params.id);res.json({ok:true})});
app.get('/api/houses',(req,res)=>res.json(all('SELECT id,name,username,logo,bonus_day,bonus_conditions,created_at FROM houses WHERE user_id=? ORDER BY name',req.user.id)));
app.post('/api/houses',(req,res)=>{const x=req.body;run('INSERT INTO houses(user_id,name,username,logo,bonus_day,bonus_conditions) VALUES(?,?,?,?,?,?)',req.user.id,x.name,x.username||'',x.logo||'',x.bonus_day||'',x.bonus_conditions||'');res.json({ok:true})});
app.put('/api/houses/:id',(req,res)=>{const x=req.body;run('UPDATE houses SET name=?,username=?,logo=?,bonus_day=?,bonus_conditions=? WHERE id=? AND user_id=?',x.name,x.username,x.logo||'',x.bonus_day||'',x.bonus_conditions||'',req.params.id,req.user.id);res.json({ok:true})});
app.get('/api/bets',(req,res)=>res.json(all('SELECT b.*,h.name house_name,h.logo house_logo FROM bets b LEFT JOIN houses h ON h.id=b.house_id AND h.user_id=b.user_id WHERE b.user_id=? ORDER BY datetime(b.datetime) DESC,b.id DESC',req.user.id)));
app.post('/api/bets',(req,res)=>{const x=req.body;run('INSERT INTO bets(user_id,datetime,house_id,country,competition,home_team,away_team,market,selection,odds,stake,units,bonus,result,profit,notes,bet_type,selections,combined_odds) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',req.user.id,x.datetime,x.house_id||null,x.country||'',x.competition||'',x.home_team||'',x.away_team||'',x.market||'',x.selection||'',Number(x.odds)||0,Number(x.stake)||0,Number(x.units)||0,x.bonus?1:0,x.result||'pending',Number(x.profit)||0,x.notes||'',x.bet_type||'single',JSON.stringify(x.selections||[]),Number(x.combined_odds)||Number(x.odds)||0);res.json({ok:true})});
app.put('/api/bets/:id',(req,res)=>{const x=req.body;run('UPDATE bets SET datetime=?,house_id=?,country=?,competition=?,home_team=?,away_team=?,market=?,selection=?,odds=?,stake=?,units=?,bonus=?,result=?,profit=?,notes=?,bet_type=?,selections=?,combined_odds=? WHERE id=? AND user_id=?',x.datetime,x.house_id||null,x.country||'',x.competition||'',x.home_team||'',x.away_team||'',x.market||'',x.selection||'',Number(x.odds)||0,Number(x.stake)||0,Number(x.units)||0,x.bonus?1:0,x.result||'pending',Number(x.profit)||0,x.notes||'',x.bet_type||'single',JSON.stringify(x.selections||[]),Number(x.combined_odds)||Number(x.odds)||0,req.params.id,req.user.id);res.json({ok:true})});
app.delete('/api/bets/:id',(req,res)=>{run('DELETE FROM bets WHERE id=? AND user_id=?',req.params.id,req.user.id);res.json({ok:true})});
app.get('/api/transactions',(req,res)=>res.json(all('SELECT t.*,h.name house_name FROM transactions t LEFT JOIN houses h ON h.id=t.house_id AND h.user_id=t.user_id WHERE t.user_id=? ORDER BY datetime(t.datetime) DESC,t.id DESC',req.user.id)));
app.post('/api/transactions',(req,res)=>{const x=req.body;run('INSERT INTO transactions(user_id,house_id,type,amount,method,status,datetime,notes) VALUES(?,?,?,?,?,?,?,?)',req.user.id,x.house_id||null,x.type,x.amount,x.method||'',x.status||'completed',x.datetime,x.notes||'');res.json({ok:true})});
app.get('/api/bonuses',(req,res)=>res.json(all('SELECT b.*,h.name house_name FROM bonuses b LEFT JOIN houses h ON h.id=b.house_id AND h.user_id=b.user_id WHERE b.user_id=? ORDER BY deadline',req.user.id)));
app.post('/api/bonuses',(req,res)=>{const x=req.body;run('INSERT INTO bonuses(user_id,house_id,week_start,deadline,required_events,min_odds,min_combined_odds,progress,status,notes) VALUES(?,?,?,?,?,?,?,?,?,?)',req.user.id,x.house_id,x.week_start,x.deadline,x.required_events,x.min_odds,x.min_combined_odds,x.progress||0,x.status||'open',x.notes||'');res.json({ok:true})});
app.put('/api/bonuses/:id',(req,res)=>{const x=req.body;run('UPDATE bonuses SET progress=?,status=?,notes=? WHERE id=? AND user_id=?',x.progress,x.status,x.notes||'',req.params.id,req.user.id)});
app.get('/api/stats',(req,res)=>{const q=req.query,bets=all('SELECT * FROM bets WHERE user_id=?',req.user.id).filter(x=>(!q.house_id||String(x.house_id)===String(q.house_id))&&(!q.from||x.datetime>=q.from)&&(!q.to||x.datetime<=q.to)),resolved=bets.filter(x=>x.result!=='pending'),stake=resolved.reduce((s,x)=>s+Number(x.stake||0),0),pnl=resolved.reduce((s,x)=>s+Number(x.profit||0),0),wins=resolved.filter(x=>x.result==='win').length,tx=all(`SELECT COALESCE(SUM(CASE WHEN type IN ('deposit','bonus','adjustment') THEN amount WHEN type='withdrawal' THEN -amount ELSE 0 END),0) balance FROM transactions WHERE user_id=?`,req.user.id)[0].balance;res.json({count:bets.length,resolved:resolved.length,pnl,stake,roi:stake?pnl/stake*100:0,winRate:resolved.length?wins/resolved.length*100:0,balance:Number(tx)+pnl})});
app.get('/api/export',(req,res)=>{const rows=all('SELECT b.datetime,h.name house,b.country,b.competition,b.home_team,b.away_team,b.market,b.selection,b.odds,b.stake,b.units,b.bonus,b.result,b.profit,b.notes,b.bet_type,b.combined_odds FROM bets b LEFT JOIN houses h ON h.id=b.house_id WHERE b.user_id=? ORDER BY b.datetime',req.user.id);const cols=Object.keys(rows[0]||{datetime:'',house:'',country:'',competition:'',home_team:'',away_team:'',market:'',selection:'',odds:'',stake:'',units:'',bonus:'',result:'',profit:'',notes:'',bet_type:'',combined_odds:''});const esc=v=>'"'+String(v??'').replaceAll('"','""')+'"';res.type('text/csv').send([cols.join(','),...rows.map(x=>cols.map(c=>esc(x[c])).join(','))].join('\n'))});
app.use(express.static(path.join(__dirname,'..','dist')));app.use((req,res)=>res.sendFile(path.join(__dirname,'..','dist','index.html')));app.listen(process.env.PORT||3000,'0.0.0.0',()=>console.log('BetTracker running'));
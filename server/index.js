const express=require('express');const Database=require('better-sqlite3');const path=require('path');const fs=require('fs');const crypto=require('crypto');
const app=express();app.use(express.json({limit:'1mb'}));const dataDir=process.env.DATA_DIR||'/app/data';fs.mkdirSync(dataDir,{recursive:true});const db=new Database(path.join(dataDir,'betting.db'));db.pragma('journal_mode = WAL');
try{db.exec("ALTER TABLE houses ADD COLUMN bonus_weekly INTEGER NOT NULL DEFAULT 0")}catch(e){if(!String(e.message).includes('duplicate column name'))throw e}
try{db.exec("ALTER TABLE houses ADD COLUMN stake_limit_percent REAL NOT NULL DEFAULT 2")}catch(e){if(!String(e.message).includes('duplicate column name'))throw e}
db.exec(`CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL,email TEXT NOT NULL UNIQUE,password_hash TEXT NOT NULL,role TEXT NOT NULL DEFAULT 'user',active INTEGER NOT NULL DEFAULT 1,language TEXT NOT NULL DEFAULT 'pt',currency TEXT NOT NULL DEFAULT 'EUR',created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,user_id INTEGER NOT NULL,expires_at TEXT NOT NULL,FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE);
CREATE TABLE IF NOT EXISTS houses(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL,name TEXT NOT NULL,username TEXT,logo TEXT,bonus_day TEXT,bonus_conditions TEXT,bonus_weekly INTEGER NOT NULL DEFAULT 0,stake_limit_percent REAL NOT NULL DEFAULT 2,created_at TEXT DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(user_id) REFERENCES users(id));
CREATE TABLE IF NOT EXISTS countries(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL UNIQUE,logo TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS competitions(id INTEGER PRIMARY KEY AUTOINCREMENT,country_id INTEGER NOT NULL,name TEXT NOT NULL,logo TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP,UNIQUE(country_id,name),FOREIGN KEY(country_id) REFERENCES countries(id) ON DELETE CASCADE);
CREATE TABLE IF NOT EXISTS markets(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL UNIQUE,active INTEGER NOT NULL DEFAULT 1,created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS bets(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL,datetime TEXT,house_id INTEGER,country TEXT,competition TEXT,home_team TEXT,away_team TEXT,market TEXT,selection TEXT,odds REAL,stake REAL,units REAL,bonus INTEGER DEFAULT 0,result TEXT DEFAULT 'pending',profit REAL DEFAULT 0,notes TEXT,bet_type TEXT DEFAULT 'single',selections TEXT,combined_odds REAL,created_at TEXT DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(user_id) REFERENCES users(id),FOREIGN KEY(house_id) REFERENCES houses(id));
CREATE TABLE IF NOT EXISTS transactions(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL,house_id INTEGER,type TEXT,amount REAL,method TEXT,status TEXT,datetime TEXT,notes TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(user_id) REFERENCES users(id),FOREIGN KEY(house_id) REFERENCES houses(id));
CREATE TABLE IF NOT EXISTS bonuses(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL,house_id INTEGER,week_start TEXT,deadline TEXT,required_events INTEGER,min_odds REAL,min_combined_odds REAL,progress INTEGER DEFAULT 0,status TEXT DEFAULT 'open',notes TEXT,FOREIGN KEY(user_id) REFERENCES users(id),FOREIGN KEY(house_id) REFERENCES houses(id));;CREATE TABLE IF NOT EXISTS teams(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER,name TEXT NOT NULL,country TEXT,team_type TEXT NOT NULL DEFAULT 'club',logo TEXT,external_id TEXT,source TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP,UNIQUE(user_id,name));CREATE TABLE IF NOT EXISTS team_translations(id INTEGER PRIMARY KEY AUTOINCREMENT,team_id INTEGER NOT NULL,language TEXT NOT NULL,name TEXT NOT NULL,UNIQUE(team_id,language),FOREIGN KEY(team_id) REFERENCES teams(id) ON DELETE CASCADE);`);
for(const q of ["ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'user'","ALTER TABLE users ADD COLUMN active INTEGER NOT NULL DEFAULT 1","ALTER TABLE houses ADD COLUMN logo TEXT","ALTER TABLE users ADD COLUMN currency TEXT NOT NULL DEFAULT 'EUR'","ALTER TABLE users ADD COLUMN language TEXT NOT NULL DEFAULT 'pt'","ALTER TABLE bets ADD COLUMN bet_type TEXT DEFAULT 'single'","ALTER TABLE bets ADD COLUMN selections TEXT","ALTER TABLE bets ADD COLUMN combined_odds REAL"]){try{db.exec(q)}catch(e){}}
db.prepare("UPDATE users SET role='admin' WHERE lower(email)=lower(?)").run('vitor.nobrega87@gmail.com');
try{db.exec("CREATE TABLE IF NOT EXISTS app_settings(key TEXT PRIMARY KEY,value TEXT NOT NULL)");db.prepare("INSERT OR IGNORE INTO app_settings(key,value) VALUES('currency','EUR'),('odds_format','dot'),('green_color','#16a34a'),('red_color','#dc2626'),('accent_color','#2563eb'),('theme','light')").run();db.prepare("DELETE FROM app_settings WHERE key='stake_limit_percent'").run()}catch(e){console.error(e)}
db.prepare("UPDATE users SET language='pt' WHERE lower(email)=lower(?)").run('vitor.nobrega87@gmail.com');
const catalog={
'Internacional':["UEFA Euro","Qualificação para o UEFA Euro","UEFA Nations League","UEFA Nations League Feminina","UEFA Women’s EURO","Qualificação para o UEFA Women’s EURO","UEFA European Under-21 Championship","Qualificação para o UEFA European Under-21 Championship","UEFA European Under-19 Championship","UEFA European Under-17 Championship","UEFA Women’s Under-19 Championship","UEFA Women’s Under-17 Championship","UEFA Champions League","UEFA Europa League","UEFA Conference League","UEFA Super Cup","UEFA Youth League","UEFA Women’s Champions League","UEFA Women’s Europa Cup","FIFA World Cup","Qualificação para o FIFA World Cup","FIFA Women’s World Cup","Qualificação para o FIFA Women’s World Cup","FIFA Club World Cup","FIFA Intercontinental Cup","FIFA U-20 World Cup","Qualificação para o FIFA U-20 World Cup","FIFA U-17 World Cup","Qualificação para o FIFA U-17 World Cup","FIFA U-20 Women’s World Cup","Qualificação para o FIFA U-20 Women’s World Cup","FIFA U-17 Women’s World Cup","Qualificação para o FIFA U-17 Women’s World Cup","UEFA Futsal EURO","Qualificação para o UEFA Futsal EURO","Copa América","Qualificação para a Copa América","Copa América Feminina","Qualificação para a Copa América Feminina","CONMEBOL World Cup Qualifiers","Copa Libertadores","Copa Sudamericana","Recopa Sudamericana","Copa Libertadores Feminina","Copa América U-20","Qualificação CONMEBOL para o Mundial U-20","Sul-Americano U-17","Qualificação CONMEBOL para o Mundial U-17","Copa do Mundo de Clubes Feminina","Africa Cup of Nations (AFCON)","Qualificação para a Africa Cup of Nations","Women’s Africa Cup of Nations","Qualificação para a Women’s Africa Cup of Nations","African Nations Championship (CHAN)","FIFA World Cup African Qualifiers","CAF Champions League","CAF Confederation Cup","CAF Women’s Champions League","CAF Super Cup","U-23 Africa Cup of Nations","Qualificação para o U-23 Africa Cup of Nations","U-20 Africa Cup of Nations","Qualificação para o U-20 Africa Cup of Nations","U-17 Africa Cup of Nations","Qualificação para o U-17 Africa Cup of Nations","Women’s U-20 Africa Cup of Nations","Qualificação para o Women’s U-20 Africa Cup of Nations","Women’s U-17 Africa Cup of Nations","Qualificação para o Women’s U-17 Africa Cup of Nations","Africa Futsal Cup of Nations","Africa Beach Soccer Cup of Nations","AFC Asian Cup","Qualificação para a AFC Asian Cup","AFC Women’s Asian Cup","AFC World Cup Qualifiers","AFC Champions League Elite","AFC Champions League Two","AFC Women’s Champions League","AFC U-23 Asian Cup","AFC U-20 Asian Cup","AFC U-17 Asian Cup","CONCACAF Gold Cup","Qualificação para a CONCACAF Gold Cup","CONCACAF W Gold Cup","Qualificação CONCACAF para o FIFA World Cup","CONCACAF Champions Cup","CONCACAF W Champions Cup","CONCACAF U-20 Championship","CONCACAF U-17 Championship","OFC Nations Cup","Qualificação para a OFC Nations Cup","OFC Women’s Nations Cup","OFC World Cup Qualifiers","OFC Champions League","OFC U-19 Championship","OFC U-16 Championship"],
'Portugal':['Liga Portugal Betclic','Liga Portugal 2','Taça de Portugal','Liga 3','Campeonato de Portugal','Liga Portugal Feminino','Taça de Portugal Feminino'],
'Espanha':['LaLiga','LaLiga 2','Primera Federación','Copa del Rey','Liga F'],
'Inglaterra':['Premier League','Championship','League One','League Two','FA Cup','EFL Cup','Women Super League'],
'Alemanha':['Bundesliga','2. Bundesliga','3. Liga','DFB Pokal','Frauen-Bundesliga'],
'Itália':['Série A','Série B','Série C','Taça de Itália','Serie A Feminina'],
'França':['Ligue 1','Ligue 2','National','Coupe de France','Division 1 Feminine'],
'Países Baixos':['Eredivisie','Eerste Divisie','KNVB Beker','Eredivisie Feminina'],
'Bélgica':['Belgian Pro League','Challenger Pro League','Taça da Bélgica','Liga Feminina'],
'Escócia':['Premiership','Championship','League One','League Two','Scottish Cup'],
'Turquia':['Super Lig','1. Lig','Taça da Turquia','Supertaça'],
'Grécia':['Super League','Super League 2','Taça da Grécia'],
'Áustria':['Bundesliga','2. Liga','ÖFB Cup'],
'Suíça':['Super League','Challenge League','Taça da Suíça'],
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
const competitionOrder=(a,b)=>{const aa=catalog[a.country_name]||[],bb=catalog[b.country_name]||[];const ia=aa.indexOf(a.name),ib=bb.indexOf(b.name);const pa=ia<0?9999:ia,pb=ib<0?9999:ib;return pa-pb||String(a.name||'').localeCompare(String(b.name||''),'pt-PT',{sensitivity:'base'})};const flags={
'Portugal':'🇵🇹','Espanha':'🇪🇸','Inglaterra':'🏴','Alemanha':'🇩🇪','Itália':'🇮🇹','França':'🇫🇷','Países Baixos':'🇳🇱','Bélgica':'🇧🇪','Escócia':'🏴','Turquia':'🇹🇷','Grécia':'🇬🇷','Áustria':'🇦🇹','Suíça':'🇨🇭','Polónia':'🇵🇱','República Checa':'🇨🇿','Roménia':'🇷🇴','Croácia':'🇭🇷','Sérvia':'🇷🇸','Ucrânia':'🇺🇦','Noruega':'🇳🇴','Suécia':'🇸🇪','Dinamarca':'🇩🇰','Finlândia':'🇫🇮','Irlanda':'🇮🇪','Irlanda do Norte':'🇬🇧','Islândia':'🇮🇸','Brasil':'🇧🇷','Argentina':'🇦🇷','Colômbia':'🇨🇴','Chile':'🇨🇱','Uruguai':'🇺🇾','Paraguai':'🇵🇾','Equador':'🇪🇨','Peru':'🇵🇪','Bolívia':'🇧🇴','México':'🇲🇽','EUA':'🇺🇸','Canadá':'🇨🇦','Costa Rica':'🇨🇷','Japão':'🇯🇵','Coreia do Sul':'🇰🇷','China':'🇨🇳','Austrália':'🇦🇺','Nova Zelândia':'🇳🇿','África do Sul':'🇿🇦','Marrocos':'🇲🇦','Argélia':'🇩🇿','Tunísia':'🇹🇳','Egipto':'🇪🇬','Arábia Saudita':'🇸🇦','Emirados Árabes Unidos':'🇦🇪','Catar':'🇶🇦','Israel':'🇮🇱','Rússia':'🇷🇺','Internacional':'🌍'};
try{db.exec("ALTER TABLE countries ADD COLUMN user_id INTEGER REFERENCES users(id)")}catch(e){if(!String(e.message).includes('duplicate column name'))throw e}
try{db.exec("ALTER TABLE competitions ADD COLUMN user_id INTEGER REFERENCES users(id)")}catch(e){if(!String(e.message).includes('duplicate column name'))throw e}try{db.exec(`CREATE INDEX IF NOT EXISTS idx_bets_user_datetime ON bets(user_id,datetime);CREATE INDEX IF NOT EXISTS idx_bets_user_house ON bets(user_id,house_id);CREATE INDEX IF NOT EXISTS idx_transactions_user_datetime ON transactions(user_id,datetime);CREATE INDEX IF NOT EXISTS idx_transactions_user_house ON transactions(user_id,house_id);CREATE INDEX IF NOT EXISTS idx_competitions_user_country ON competitions(user_id,country_id);CREATE INDEX IF NOT EXISTS idx_countries_user ON countries(user_id);`)}catch(e){console.error(e)}
const insCountry=db.prepare("INSERT OR IGNORE INTO countries(name,logo) VALUES (?,?)");
for(const [country] of Object.entries(catalog))insCountry.run(country,flags[country]||'');
const ptCountry=db.prepare("SELECT id FROM countries WHERE name='Portugal'").get();const beCountry=db.prepare("SELECT id FROM countries WHERE name='Bélgica'").get();if(ptCountry&&beCountry){db.prepare("UPDATE competitions SET country_id=? WHERE country_id=? AND name IN ('Primeira Liga','Segunda Liga')").run(ptCountry.id,beCountry.id);}
const catalogCleanupDone=db.prepare("SELECT value FROM app_settings WHERE key='competition_catalog_cleanup_v1'").get();
if(!catalogCleanupDone){
  const delCatalog=db.prepare("DELETE FROM competitions WHERE country_id=? AND name=?");
  for(const [country,names] of Object.entries(catalog)){const row=db.prepare("SELECT id FROM countries WHERE name=?").get(country);if(row)for(const name of names)delCatalog.run(row.id,name);}
  db.prepare("INSERT INTO app_settings(key,value) VALUES('competition_catalog_cleanup_v1','1') ON CONFLICT(key) DO UPDATE SET value=excluded.value").run();
}
const ownerUser=db.prepare("SELECT id FROM users WHERE role='admin' ORDER BY id LIMIT 1").get();
if(ownerUser){
  for(const country of db.prepare('SELECT id,name,user_id FROM countries').all()){
    if(Object.prototype.hasOwnProperty.call(catalog,country.name))db.prepare('UPDATE countries SET user_id=NULL WHERE id=?').run(country.id);
    else if(country.user_id==null)db.prepare('UPDATE countries SET user_id=? WHERE id=?').run(ownerUser.id,country.id);
  }
  for(const comp of db.prepare('SELECT c.id,c.name,c.user_id,p.name country_name FROM competitions c JOIN countries p ON p.id=c.country_id').all()){
    const isCatalog=Array.isArray(catalog[comp.country_name])&&catalog[comp.country_name].includes(comp.name);
    if(isCatalog)db.prepare('UPDATE competitions SET user_id=NULL WHERE id=?').run(comp.id);
    else if(comp.user_id==null)db.prepare('UPDATE competitions SET user_id=? WHERE id=?').run(ownerUser.id,comp.id);
  }
}
const defaultMarkets=['1X2','Dupla Hipótese','Mais de 0.5 Golos','Mais de 1.5 Golos','Mais de 2.5 Golos','Menos de 0.5 Golos','Menos de 1.5 Golos','Menos de 2.5 Golos','Ambas Marcam','Handicap','Empate Anula','Resultado ao Intervalo'];
for(const n of defaultMarkets)db.prepare("INSERT OR IGNORE INTO markets(name) VALUES(?)").run(n);
const defaultTeams=[['Portugal','Portugal','national'],['Portugal U21','Portugal','national_youth'],['Portugal U19','Portugal','national_youth'],['Benfica','Portugal','club'],['Benfica B','Portugal','club_reserve'],['Sporting CP','Portugal','club'],['Sporting CP B','Portugal','club_reserve'],['FC Porto','Portugal','club'],['SC Braga','Portugal','club'],['Boca Juniors','Argentina','club'],['River Plate','Argentina','club'],['Argentina','Argentina','national'],['Brazil','Brasil','national'],['Spain','Espanha','national'],['England','Inglaterra','national'],['France','França','national'],['Germany','Alemanha','national'],['Italy','Itália','national']];
for(const [name,country,team_type] of defaultTeams)db.prepare("INSERT INTO teams(user_id,name,country,team_type,source) SELECT NULL,?,?,?,'seed' WHERE NOT EXISTS (SELECT 1 FROM teams WHERE user_id IS NULL AND name=?)").run(name,country,team_type,name);
const teamNameTranslations={
  'Portugal':{pt:'Portugal',en:'Portugal',es:'Portugal'},
  'Portugal U21':{pt:'Portugal Sub-21',en:'Portugal U21',es:'Portugal Sub-21'},
  'Portugal U19':{pt:'Portugal Sub-19',en:'Portugal U19',es:'Portugal Sub-19'},
  'Argentina':{pt:'Argentina',en:'Argentina',es:'Argentina'},
  'Brazil':{pt:'Brasil',en:'Brazil',es:'Brasil'},
  'Spain':{pt:'Espanha',en:'Spain',es:'España'},
  'England':{pt:'Inglaterra',en:'England',es:'Inglaterra'},
  'France':{pt:'França',en:'France',es:'Francia'},
  'Germany':{pt:'Alemanha',en:'Germany',es:'Alemania'},
  'Italy':{pt:'Itália',en:'Italy',es:'Italia'}
};
const ensureTeamTranslations=db.transaction(()=>{
  for(const [canonical,langs] of Object.entries(teamNameTranslations)){
    let team=db.prepare("SELECT * FROM teams WHERE lower(trim(name))=lower(trim(?)) ORDER BY id LIMIT 1").get(canonical);
    if(!team)continue;
    for(const [language,name] of Object.entries(langs)){
      const duplicate=db.prepare("SELECT id FROM teams WHERE id<>? AND lower(trim(name))=lower(trim(?)) LIMIT 1").get(team.id,name);
      if(duplicate){
        db.prepare("UPDATE teams SET country=COALESCE(country,?),logo=COALESCE(logo,?),external_id=COALESCE(external_id,?),source=COALESCE(source,?) WHERE id=?").run(team.country,team.logo,team.external_id,team.source,team.id);
        db.prepare("DELETE FROM teams WHERE id=?").run(duplicate.id);
      }
      db.prepare("INSERT INTO team_translations(team_id,language,name) VALUES(?,?,?) ON CONFLICT(team_id,language) DO UPDATE SET name=excluded.name").run(team.id,language,name);
    }
  }
});
try{ensureTeamTranslations()}catch(e){console.error('Team translations seed:',e.message)}



// Normalize the team catalogue: keep one canonical team per name and prevent future duplicates.
try{
  db.exec("DELETE FROM teams WHERE id IN (SELECT t.id FROM teams t JOIN teams k ON lower(trim(k.name))=lower(trim(t.name)) AND k.id<t.id)");
  db.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_teams_name_normalized ON teams(lower(trim(name)))");
}catch(e){console.error('Team catalogue validation:',e.message)}
function hashPassword(p){const s=crypto.randomBytes(16).toString('hex');return s+':'+crypto.scryptSync(p,s,64).toString('hex')}function verifyPassword(p,st){const[a,k]=String(st).split(':');if(!a||!k)return false;const h=crypto.scryptSync(p,a,64).toString('hex');return crypto.timingSafeEqual(Buffer.from(h,'hex'),Buffer.from(k,'hex'))}function token(){return crypto.randomBytes(32).toString('hex')}
function setCookie(res,n,v,max){res.setHeader('Set-Cookie',`${n}=${v}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${max}${process.env.COOKIE_SECURE==='true'?'; Secure':''}`)}function cookies(req){return Object.fromEntries(String(req.headers.cookie||'').split(';').filter(Boolean).map(x=>{const i=x.indexOf('=');return[x.slice(0,i).trim(),decodeURIComponent(x.slice(i+1).trim())]}))}
function currentUser(req){const t=cookies(req).bt_session;if(!t)return null;const s=db.prepare('SELECT u.id,u.name,u.email,u.role,u.active,s.expires_at FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token=?').get(t);if(!s||!s.active||new Date(s.expires_at)<=new Date()){if(t)db.prepare('DELETE FROM sessions WHERE token=?').run(t);return null}return s}
const admin=(req,res,next)=>req.user?.role==='admin'?next():res.status(403).json({error:'Acesso de administrador'});app.get('/api/admin/backup',(req,res,next)=>{req.user=currentUser(req);admin(req,res,next)},(req,res)=>res.download(path.join(dataDir,'betting.db'),'bettracker-backup.db'));
app.post('/api/auth/register',(req,res)=>{const n=String(req.body.name||'').trim(),e=String(req.body.email||'').trim().toLowerCase(),p=String(req.body.password||'');if(!n||!e||p.length<8)return res.status(400).json({error:'Nome, email e password com pelo menos 8 caracteres são obrigatórios.'});try{const role=e==='vitor.nobrega87@gmail.com'?'admin':'user';const language=['pt','en','es'].includes(String(req.body.language||'pt'))?String(req.body.language):'pt';const i=db.prepare('INSERT INTO users(name,email,password_hash,role,language) VALUES(?,?,?,?,?)').run(n,e,hashPassword(p),role,language);db.prepare('UPDATE users SET role=? WHERE id=?').run(role,i.lastInsertRowid);const t=token();db.prepare("INSERT INTO sessions(token,user_id,expires_at) VALUES(?,?,datetime('now','+30 days'))").run(t,i.lastInsertRowid);setCookie(res,'bt_session',t,2592000);res.json({user:{id:i.lastInsertRowid,name:n,email:e,role,language,currency:'EUR'}})}catch(x){res.status(String(x.message).includes('UNIQUE')?409:500).json({error:String(x.message).includes('UNIQUE')?'Já existe uma conta com este email.':'Não foi possível criar a conta.'})}});
app.post('/api/auth/login',(req,res)=>{const e=String(req.body.email||'').trim().toLowerCase(),p=String(req.body.password||''),u=db.prepare('SELECT id,name,email,password_hash,role,active,currency FROM users WHERE email=?').get(e);if(!u||!u.active||!verifyPassword(p,u.password_hash))return res.status(401).json({error:'Email ou password inválidos.'});const t=token();db.prepare("INSERT INTO sessions(token,user_id,expires_at) VALUES(?,?,datetime('now','+30 days'))").run(t,u.id);setCookie(res,'bt_session',t,2592000);res.json({user:{id:u.id,name:u.name,email:u.email,role:u.role,language:u.language||'pt'}})});
app.patch('/api/auth/language',(req,res)=>{const u=currentUser(req),allowed=['EUR','USD','GBP','BRL','CHF','CAD','AUD','JPY','PLN','SEK','NOK','DKK'];if(!u)return res.status(401).json({error:'Não autenticado'});const language=String(req.body.language||'pt').toLowerCase();if(!['pt','en','es'].includes(language))return res.status(400).json({error:'Idioma não suportado.'});db.prepare('UPDATE users SET language=? WHERE id=?').run(language,u.id);res.json({ok:true,language})});app.post('/api/auth/logout',(req,res)=>{const t=cookies(req).bt_session;if(t)db.prepare('DELETE FROM sessions WHERE token=?').run(t);setCookie(res,'bt_session','',0);res.json({ok:true})});
app.get('/api/auth/me',(req,res)=>{const u=currentUser(req);if(!u)return res.status(401).json({error:'Não autenticado'});res.json({user:{id:u.id,name:u.name,email:u.email,role:u.role,language:u.language||'pt'}})});
app.use('/api',(req,res,next)=>{if(req.path.startsWith('/auth/'))return next();const u=currentUser(req);if(!u)return res.status(401).json({error:'Não autenticado'});req.user=u;next()});
const all=(s,...a)=>db.prepare(s).all(...a),run=(s,...a)=>db.prepare(s).run(...a);const requireAdmin=(req,res,next)=>req.user.role==='admin'?next():res.status(403).json({error:'Acesso reservado ao administrador.'});
app.get('/api/admin/users',requireAdmin,(req,res)=>res.json(all('SELECT id,name,email,role,active,language,created_at FROM users ORDER BY created_at DESC')));
app.post('/api/admin/users',requireAdmin,(req,res)=>{const n=String(req.body.name||'').trim(),e=String(req.body.email||'').trim().toLowerCase(),p=String(req.body.password||''),role=req.body.role==='admin'?'admin':'user',language=['pt','en','es'].includes(String(req.body.language||'pt'))?String(req.body.language):'pt';if(!n||!e||p.length<8)return res.status(400).json({error:'Nome, email e password com pelo menos 8 caracteres são obrigatórios.'});try{const i=db.prepare('INSERT INTO users(name,email,password_hash,role,language) VALUES(?,?,?,?,?)').run(n,e,hashPassword(p),role,language);res.json({ok:true,id:i.lastInsertRowid})}catch(x){res.status(409).json({error:'Já existe uma conta com este email.'})}});
app.patch('/api/admin/users/:id',requireAdmin,(req,res)=>{const id=Number(req.params.id);if(id===req.user.id&&req.body.active===false)return res.status(400).json({error:'Não podes desativar a tua própria conta.'});if(!db.prepare('SELECT id FROM users WHERE id=?').get(id))return res.status(404).json({error:'Utilizador não encontrado.'});if(req.body.active!==undefined)run('UPDATE users SET active=? WHERE id=?',req.body.active?1:0,id);if(req.body.role==='admin'||req.body.role==='user')run('UPDATE users SET role=? WHERE id=?',req.body.role,id);if(req.body.language&&['pt','en','es'].includes(req.body.language))run('UPDATE users SET language=? WHERE id=?',req.body.language,id);if(req.body.resetSessions)run('DELETE FROM sessions WHERE user_id=?',id);res.json({ok:true})});
app.get('/api/admin/settings',requireAdmin,(req,res)=>{const rows=all('SELECT key,value FROM app_settings');res.json(Object.fromEntries(rows.map(x=>[x.key,x.value])))});
app.patch('/api/admin/settings',requireAdmin,(req,res)=>{const allowedCurrency=['EUR','USD','GBP','BRL','CHF','CAD','AUD','JPY','PLN','SEK','NOK','DKK'];const allowedOdds=['dot','comma'];const allowedTheme=['light','dark','system'];if(req.body.currency&&!allowedCurrency.includes(req.body.currency))return res.status(400).json({error:'Moeda não suportada.'});if(req.body.odds_format&&!allowedOdds.includes(req.body.odds_format))return res.status(400).json({error:'Formato de odds inválido.'});if(req.body.theme&&!allowedTheme.includes(req.body.theme))return res.status(400).json({error:'Tema inválido.'});for(const k of ['green_color','red_color','accent_color'])if(req.body[k]&&!/^#[0-9a-fA-F]{6}$/.test(String(req.body[k])))return res.status(400).json({error:'Cor inválida.'});for(const k of ['currency','odds_format','green_color','red_color','accent_color','theme'])if(req.body[k]!=null&&req.body[k]!=='')run('INSERT INTO app_settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value',k,req.body[k]);res.json({ok:true})});
app.get('/api/settings',(req,res)=>{const rows=all('SELECT key,value FROM app_settings');res.json(Object.fromEntries(rows.map(x=>[x.key,x.value])))});
app.get('/api/admin/countries',requireAdmin,(req,res)=>res.json(all('SELECT * FROM countries ORDER BY name')));
app.post('/api/admin/countries',requireAdmin,(req,res)=>{try{run('INSERT INTO countries(name,logo) VALUES(?,?)',String(req.body.name||'').trim(),req.body.logo||'');res.json({ok:true})}catch(e){res.status(400).json({error:'País já existe.'})}});
app.put('/api/admin/countries/:id',requireAdmin,(req,res)=>{run('UPDATE countries SET name=?,logo=? WHERE id=?',req.body.name,req.body.logo||'',req.params.id);res.json({ok:true})});
app.delete('/api/admin/countries/:id',requireAdmin,(req,res)=>{run('DELETE FROM countries WHERE id=?',req.params.id);res.json({ok:true})});
app.get('/api/countries',(req,res)=>res.json(all('SELECT * FROM countries WHERE user_id IS NULL OR user_id=? ORDER BY name',req.user.id)));app.get('/api/teams',(req,res)=>{const q=String(req.query.search||'').trim().toLowerCase(),type=String(req.query.type||'').trim(),country=String(req.query.country||'').trim(),like='%'+q+'%';const where=['(user_id IS NULL OR user_id=?)'],args=[req.user.id];if(q){where.push('(lower(name) LIKE ? OR lower(COALESCE(country,\'\')) LIKE ? OR EXISTS (SELECT 1 FROM team_translations ttq WHERE ttq.team_id=teams.id AND lower(ttq.name) LIKE ?))');args.push(like,like,like)}if(type){where.push('team_type=?');args.push(type)}if(country){where.push('lower(COALESCE(country,\'\'))=lower(?)');args.push(country)}const limit=Math.min(Math.max(Number(req.query.limit)||1000,1),1000);const rows=all(`SELECT * FROM teams WHERE ${where.join(' AND ')} ORDER BY name LIMIT ${limit}`,...args);for(const row of rows){row.translations={};for(const t of all('SELECT language,name FROM team_translations WHERE team_id=?',row.id))row.translations[t.language]=t.name}res.json(rows)});

// Curated starter catalogue. Logos are fetched from TheSportsDB on demand through /api/teams/seed-popular.
const popularTeamIds=[134108,135708,134114,133604,133602,133613,133612,133610,133738,133739,133650,133664,133714,133729,133676,133681,133667,133670,134287,134465,135156,135171];
app.post('/api/teams/seed-popular',async(req,res)=>{
  const results=[];const key=process.env.THESPORTSDB_API_KEY||'123';
  for(const id of popularTeamIds){
    try{
      const r=await fetch(`https://www.thesportsdb.com/api/v1/json/${encodeURIComponent(key)}/lookupteam.php?id=${id}`);
      if(!r.ok)continue; const d=await r.json(); const t=d.teams?.[0]; if(!t?.strTeam)continue;
      const name=String(t.strTeam).trim(),country=String(t.strCountry||'').trim(),logo=String(t.strBadge||t.strLogo||'').trim(),external_id=String(t.idTeam||id);
      const existing=db.prepare('SELECT id FROM teams WHERE lower(trim(name))=lower(trim(?)) LIMIT 1').get(name);
      if(existing){db.prepare('UPDATE teams SET country=COALESCE(NULLIF(country,\'\'),?),logo=COALESCE(NULLIF(logo,\'\'),?),external_id=COALESCE(NULLIF(external_id,\'\'),?),source=CASE WHEN source=\'manual\' THEN \'thesportsdb\' ELSE source END WHERE id=?').run(country,logo,external_id,existing.id);results.push({name,updated:true});}
      else {db.prepare('INSERT INTO teams(user_id,name,country,team_type,logo,external_id,source) VALUES(NULL,?,?,?,?,?,\'thesportsdb\')').run(name,country,'club',logo,external_id);results.push({name,added:true});}
    }catch(e){}
  }
  res.json({ok:true,count:results.length,teams:results});
});
const popularLeagues=[
  {id:4344,name:'Primeira Liga',country:'Portugal'},
  {id:4328,name:'English Premier League',country:'England'},
  {id:4335,name:'Spanish La Liga',country:'Spain'},
  {id:4331,name:'German Bundesliga',country:'Germany'},
  {id:4334,name:'French Ligue 1',country:'France'},
  {id:4332,name:'Italian Serie A',country:'Italy'},
  {id:4337,name:'Dutch Eredivisie',country:'Netherlands'},
  {id:4338,name:'Belgian Pro League',country:'Belgium'},
  {id:4406,name:'Argentine Primera Division',country:'Argentina'},
  {id:4351,name:'Brazilian Serie A',country:'Brazil'}
];
async function syncTeamRecord(t){
  if(!t?.strTeam)return null;
  const name=String(t.strTeam).trim(),country=String(t.strCountry||'').trim(),logo=String(t.strBadge||t.strLogo||'').trim(),external_id=String(t.idTeam||'');
  const existing=db.prepare('SELECT * FROM teams WHERE lower(trim(name))=lower(trim(?)) LIMIT 1').get(name);
  if(existing){
    db.prepare('UPDATE teams SET country=CASE WHEN ?<>\'\' THEN ? ELSE country END,logo=CASE WHEN ?<>\'\' THEN ? ELSE logo END,external_id=CASE WHEN ?<>\'\' THEN ? ELSE external_id END,source=CASE WHEN source=\'manual\' THEN \'thesportsdb\' ELSE source END WHERE id=?').run(country,country,logo,logo,external_id,external_id,existing.id);
    return {name,updated:true};
  }
  const i=db.prepare('INSERT INTO teams(user_id,name,country,team_type,logo,external_id,source) VALUES(NULL,?,?,?,?,?,\'thesportsdb\')').run(name,country,'club',logo,external_id);
  return {name,added:true,id:i.lastInsertRowid};
}
app.post('/api/teams/seed-leagues',async(req,res)=>{
  const results=[];const key=process.env.THESPORTSDB_API_KEY||'123';
  for(const league of popularLeagues){
    try{
      const u=`https://www.thesportsdb.com/api/v1/json/${encodeURIComponent(key)}/search_all_teams.php?l=${encodeURIComponent(league.name.replaceAll(' ','_'))}`;
      const r=await fetch(u); if(!r.ok)continue; const d=await r.json();
      for(const t of (d.teams||[])){const x=await syncTeamRecord({...t,strCountry:t.strCountry||league.country});
const secondDivisionLeagues=[
  {name:'Liga Portugal 2',country:'Portugal'},
  {name:'English League Championship',country:'England'},
  {name:'Spanish Segunda Division',country:'Spain'},
  {name:'German 2. Bundesliga',country:'Germany'},
  {name:'Italian Serie B',country:'Italy'},
  {name:'French Ligue 2',country:'France'},
  {name:'Dutch Eerste Divisie',country:'Netherlands'},
  {name:'Belgian Challenger Pro League',country:'Belgium'},
  {name:'Scottish Championship',country:'Scotland'},
  {name:'Turkish 1. Lig',country:'Turkey'},
  {name:'Greek Super League 2',country:'Greece'},
  {name:'Austrian 2. Liga',country:'Austria'},
  {name:'Swiss Challenge League',country:'Switzerland'},
  {name:'Polish 1. Liga',country:'Poland'},
  {name:'Czech National Football League',country:'Czech Republic'}
];
app.post('/api/teams/seed-second-divisions',async(req,res)=>{
  const results=[];const key=process.env.THESPORTSDB_API_KEY||'123';
  for(const league of secondDivisionLeagues){
    try{
      const u=`https://www.thesportsdb.com/api/v1/json/${encodeURIComponent(key)}/search_all_teams.php?l=${encodeURIComponent(league.name.replaceAll(' ','_'))}`;
      const r=await fetch(u);if(!r.ok)continue;const d=await r.json();
      for(const t of (d.teams||[])){const x=await syncTeamRecord({...t,strCountry:t.strCountry||league.country});if(x)results.push({...x,league:league.name});}
    }catch(e){}
  }
  res.json({ok:true,count:results.length,teams:results});
});
if(x)results.push({...x,league:league.name});}
    }catch(e){}
  }
  res.json({ok:true,count:results.length,teams:results});
});
app.get('/api/teams/search',async(req,res)=>{const q=String(req.query.q||'').trim();if(q.length<2)return res.json([]);try{const r=await fetch(`https://www.thesportsdb.com/api/v1/json/${encodeURIComponent(process.env.THESPORTSDB_API_KEY||'123')}/searchteams.php?t=${encodeURIComponent(q)}`);if(!r.ok)throw new Error('Fonte externa indisponível');const d=await r.json();res.json((d.teams||[]).filter(t=>String(t.strSport||'').toLowerCase()==='soccer').slice(0,20).map(t=>({external_id:String(t.idTeam||''),name:t.strTeam||'',country:t.strCountry||'',team_type:String(t.strTeam||'').toLowerCase().includes('national')?'national':'club',logo:t.strBadge||t.strLogo||'',source:'thesportsdb'})))}catch(e){res.status(502).json({error:'Não foi possível pesquisar a base de equipas online.'})}});
app.post('/api/teams',(req,res)=>{const name=String(req.body.name||'').trim(),country=String(req.body.country||'').trim(),team_type=['club','club_reserve','national','national_youth','women'].includes(String(req.body.team_type))?String(req.body.team_type):'club',logo=String(req.body.logo||'').trim(),external_id=String(req.body.external_id||'').trim(),source=String(req.body.source||'manual').trim();if(!name)return res.status(400).json({error:'Indica o nome da equipa.'});const existing=db.prepare('SELECT * FROM teams WHERE lower(trim(name))=lower(trim(?)) ORDER BY CASE WHEN user_id IS NULL THEN 0 ELSE 1 END,id LIMIT 1').get(name);if(existing)return res.json(existing);try{const i=db.prepare('INSERT INTO teams(user_id,name,country,team_type,logo,external_id,source) VALUES(?,?,?,?,?,?,?)').run(req.user.id,name,country,team_type,logo,external_id,source);res.json(db.prepare('SELECT * FROM teams WHERE id=?').get(i.lastInsertRowid))}catch(e){if(String(e.message).includes('UNIQUE')){const row=db.prepare('SELECT * FROM teams WHERE lower(trim(name))=lower(trim(?)) ORDER BY id LIMIT 1').get(name);return res.json(row)}res.status(500).json({error:'Não foi possível criar a equipa.'})}});
app.put('/api/teams/:id',(req,res)=>{const id=Number(req.params.id);const row=db.prepare('SELECT * FROM teams WHERE id=? AND user_id=?').get(id,req.user.id);if(!row)return res.status(404).json({error:'Equipa não encontrada.'});const name=String(req.body.name||row.name).trim();if(!name)return res.status(400).json({error:'Indica o nome da equipa.'});db.prepare('UPDATE teams SET name=?,country=?,team_type=?,logo=? WHERE id=? AND user_id=?').run(name,String(req.body.country||row.country||''),String(req.body.team_type||row.team_type),String(req.body.logo||row.logo||''),id,req.user.id);res.json(db.prepare('SELECT * FROM teams WHERE id=?').get(id))});
app.delete('/api/teams/:id',(req,res)=>{const id=Number(req.params.id);const r=db.prepare('DELETE FROM teams WHERE id=? AND user_id=?').run(id,req.user.id);if(!r.changes)return res.status(404).json({error:'Equipa não encontrada.'});res.json({ok:true})});
app.get('/api/admin/competition-catalog',requireAdmin,(req,res)=>{const country=db.prepare('SELECT name FROM countries WHERE id=?').get(req.query.country_id);res.json(country&&Array.isArray(catalog[country.name])?catalog[country.name]:[])});app.get('/api/admin/competition-catalog-all',requireAdmin,(req,res)=>{const rows=[];for(const country of all('SELECT id,name FROM countries WHERE user_id IS NULL OR user_id=? ORDER BY name',req.user.id))for(const name of (catalog[country.name]||[]))rows.push({country_id:country.id,country_name:country.name,name});res.json(rows)});
app.get('/api/admin/competitions',requireAdmin,(req,res)=>res.json(all('SELECT c.*,p.name country_name,p.logo country_logo FROM competitions c JOIN countries p ON p.id=c.country_id WHERE c.user_id IS NULL OR c.user_id=? ORDER BY p.name,c.name',req.user.id).sort(competitionOrder)));app.get('/api/admin/competition-validation',requireAdmin,(req,res)=>{const invalid=all('SELECT c.id,c.name,c.country_id,p.name country_name FROM competitions c JOIN countries p ON p.id=c.country_id WHERE c.user_id IS NULL OR c.user_id=? ORDER BY p.name,c.name',req.user.id).filter(x=>Array.isArray(catalog[x.country_name])&&!catalog[x.country_name].includes(x.name));res.json({invalid,count:invalid.length})});
app.post('/api/admin/competitions',requireAdmin,(req,res)=>{try{const country=db.prepare('SELECT name FROM countries WHERE id=?').get(req.body.country_id);const name=String(req.body.name||'').trim();if(!country||!name)return res.status(400).json({error:'Seleciona o país e indica a competição.'});run('INSERT INTO competitions(country_id,name,logo,user_id) VALUES(?,?,?,?)',req.body.country_id,name,req.body.logo||'',req.user.id);res.json({ok:true})}catch(e){res.status(400).json({error:'Competição já existe neste país.'})}});
app.put('/api/admin/competitions/:id',requireAdmin,(req,res)=>{const country=db.prepare('SELECT name FROM countries WHERE id=?').get(req.body.country_id);const name=String(req.body.name||'').trim();if(!country||!name)return res.status(400).json({error:'Seleciona o país e indica a competição.'});run('UPDATE competitions SET country_id=?,name=?,logo=? WHERE id=? AND (user_id IS NULL OR user_id=?)',req.body.country_id,name,req.body.logo||'',req.params.id,req.user.id);res.json({ok:true})});
app.delete('/api/admin/competitions/:id',requireAdmin,(req,res)=>{run('DELETE FROM competitions WHERE id=? AND user_id=?',req.params.id,req.user.id);res.json({ok:true})});
app.get('/api/competitions',(req,res)=>{const rows=all('SELECT c.*,p.name country_name,p.logo country_logo FROM competitions c JOIN countries p ON p.id=c.country_id WHERE c.user_id IS NULL OR c.user_id=?',req.user.id);const existing=new Set(rows.map(x=>String(x.country_id)+'|'+x.name));for(const country of all('SELECT id,name,logo FROM countries WHERE user_id IS NULL OR user_id=?',req.user.id))for(const name of (catalog[country.name]||[])){const key=String(country.id)+'|'+name;if(!existing.has(key)){rows.push({id:'catalog-'+country.id+'-'+encodeURIComponent(name),country_id:country.id,name,logo:'',country_name:country.name,country_logo:country.logo||'',catalog:true});existing.add(key)}}res.json(rows.sort(competitionOrder))});
app.get('/api/admin/markets',requireAdmin,(req,res)=>res.json(all('SELECT * FROM markets ORDER BY name')));
app.get('/api/markets',(req,res)=>res.json(all('SELECT * FROM markets WHERE active=1 ORDER BY name')));app.post('/api/markets',(req,res)=>{const name=String(req.body.name||'').trim();if(!name)return res.status(400).json({error:'Indica o nome do mercado.'});try{run('INSERT INTO markets(name,active) VALUES(?,1)',name);res.json({ok:true,name})}catch(e){res.status(400).json({error:'Mercado já existe.'})}});
app.post('/api/admin/markets',requireAdmin,(req,res)=>{try{run('INSERT INTO markets(name,active) VALUES(?,?)',req.body.name,req.body.active===false?0:1);res.json({ok:true})}catch(e){res.status(400).json({error:'Mercado já existe.'})}});
app.put('/api/admin/markets/:id',requireAdmin,(req,res)=>{run('UPDATE markets SET name=?,active=? WHERE id=?',req.body.name,req.body.active?1:0,req.params.id);res.json({ok:true})});
app.delete('/api/admin/markets/:id',requireAdmin,(req,res)=>{run('DELETE FROM markets WHERE id=?',req.params.id);res.json({ok:true})});
app.get('/api/houses',(req,res)=>res.json(all('SELECT id,name,username,logo,bonus_day,bonus_conditions,bonus_weekly,stake_limit_percent,created_at FROM houses WHERE user_id=? ORDER BY name',req.user.id)));
app.post('/api/houses',(req,res)=>{const x=req.body;const p=Number(x.stake_limit_percent);if(!String(x.name||'').trim())return res.status(400).json({error:'Indica o nome da casa de apostas.'});if(!Number.isFinite(p)||p<0||p>100)return res.status(400).json({error:'A percentagem da banca por aposta deve estar entre 0 e 100.'});run('INSERT INTO houses(user_id,name,username,logo,bonus_day,bonus_conditions,bonus_weekly,stake_limit_percent) VALUES(?,?,?,?,?,?,?,?)',req.user.id,x.name,x.username||'',x.logo||'',x.bonus_weekly?x.bonus_day||'':'',x.bonus_conditions||'',x.bonus_weekly?1:0,p);res.json({ok:true})});
app.put('/api/houses/:id',(req,res)=>{const x=req.body;const p=Number(x.stake_limit_percent);if(!String(x.name||'').trim())return res.status(400).json({error:'Indica o nome da casa de apostas.'});if(!Number.isFinite(p)||p<0||p>100)return res.status(400).json({error:'A percentagem da banca por aposta deve estar entre 0 e 100.'});run('UPDATE houses SET name=?,username=?,logo=?,bonus_day=?,bonus_conditions=?,bonus_weekly=?,stake_limit_percent=? WHERE id=? AND user_id=?',x.name,x.username,x.logo||'',x.bonus_weekly?x.bonus_day||'':'',x.bonus_conditions||'',x.bonus_weekly?1:0,p,req.params.id,req.user.id);res.json({ok:true})});
app.get('/api/bets',(req,res)=>res.json(all('SELECT b.*,h.name house_name,h.logo house_logo FROM bets b LEFT JOIN houses h ON h.id=b.house_id AND h.user_id=b.user_id WHERE b.user_id=? ORDER BY datetime(b.datetime) DESC,b.id DESC',req.user.id)));
app.post('/api/bets',(req,res)=>{try{const x=req.body||{};const stake=Number(x.stake);const odds=Number(x.odds);const combinedOdds=Number(x.combined_odds)||odds;const result=x.result||'pending';if(!x.datetime)return res.status(400).json({error:'Indica a data/hora.'});if(!Number.isFinite(stake)||stake<=0)return res.status(400).json({error:'Indica uma stake válida.'});if(!Number.isFinite(odds)||odds<=0)return res.status(400).json({error:'Indica uma odd válida.'});if(!x.house_id)return res.status(400).json({error:'Seleciona a casa de apostas.'});if(!x.country)return res.status(400).json({error:'Seleciona o país.'});if(!x.competition)return res.status(400).json({error:'Seleciona a competição.'});if(!x.market||x.market==='__new__')return res.status(400).json({error:'Seleciona um mercado válido.'});const isBonus=!!x.bonus;const profit=isBonus?(result==='win'?stake:0):(result==='win'?stake*((x.bet_type||'single')==='multiple'?combinedOdds:odds-1):result==='loss'?-stake:0);const r=run('INSERT INTO bets(user_id,datetime,house_id,country,competition,home_team,away_team,market,selection,odds,stake,units,bonus,result,profit,notes,bet_type,selections,combined_odds) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',req.user.id,x.datetime,Number(x.house_id),String(x.country),String(x.competition),x.home_team||'',x.away_team||'',String(x.market),String(x.selection),odds,stake,Number(x.units)||0,x.bonus?1:0,result,profit,x.notes||'',x.bet_type||'single',JSON.stringify(x.selections||[]),combinedOdds);res.json({ok:true,id:r.lastInsertRowid})}catch(e){console.error('POST /api/bets',e);res.status(500).json({error:'Não foi possível guardar a aposta: '+e.message})}});
app.put('/api/bets/:id',(req,res)=>{const x=req.body;const stake=Number(x.stake)||0;const odds=Number(x.odds)||0;const combinedOdds=Number(x.combined_odds)||odds;const result=x.result||'pending';const isBonus=!!x.bonus;const profit=isBonus?(result==='win'?stake:0):(result==='win'?stake*((x.bet_type||'single')==='multiple'?combinedOdds:odds-1):result==='loss'?-stake:0);run('UPDATE bets SET datetime=?,house_id=?,country=?,competition=?,home_team=?,away_team=?,market=?,selection=?,odds=?,stake=?,units=?,bonus=?,result=?,profit=?,notes=?,bet_type=?,selections=?,combined_odds=? WHERE id=? AND user_id=?',x.datetime,x.house_id||null,x.country||'',x.competition||'',x.home_team||'',x.away_team||'',x.market||'',x.selection||'',odds,stake,Number(x.units)||0,x.bonus?1:0,result,profit,x.notes||'',x.bet_type||'single',JSON.stringify(x.selections||[]),combinedOdds,req.params.id,req.user.id);res.json({ok:true})});
app.delete('/api/bets/:id',(req,res)=>{run('DELETE FROM bets WHERE id=? AND user_id=?',req.params.id,req.user.id);res.json({ok:true})});
app.get('/api/transactions',(req,res)=>res.json(all('SELECT t.*,h.name house_name FROM transactions t LEFT JOIN houses h ON h.id=t.house_id AND h.user_id=t.user_id WHERE t.user_id=? ORDER BY datetime(t.datetime) DESC,t.id DESC',req.user.id)));app.get('/api/house-balances',(req,res)=>{const rows=all(`SELECT h.id,h.name,h.logo,
COALESCE((
  SELECT t.amount
  FROM transactions t
  WHERE t.user_id=h.user_id
    AND t.house_id=h.id
    AND t.type='deposit'
    AND COALESCE(t.status,'completed')='completed'
  ORDER BY datetime(t.datetime),t.id
  LIMIT 1
),0) initial_balance,
COALESCE((
  SELECT SUM(
    CASE
      WHEN t.type IN ('deposit','bonus','adjustment') THEN ABS(t.amount)
      WHEN t.type='withdrawal' THEN -ABS(t.amount)
      ELSE 0
    END
  )
  FROM transactions t
  WHERE t.user_id=h.user_id
    AND t.house_id=h.id
    AND COALESCE(t.status,'completed')='completed'
),0)
+COALESCE((
  SELECT SUM(b.profit)
  FROM bets b
  WHERE b.user_id=h.user_id
    AND b.house_id=h.id
),0) balance
FROM houses h
WHERE h.user_id=?
ORDER BY h.name`,req.user.id);res.json(rows)});
app.post('/api/transactions',(req,res)=>{const x=req.body;run('INSERT INTO transactions(user_id,house_id,type,amount,method,status,datetime,notes) VALUES(?,?,?,?,?,?,?,?)',req.user.id,x.house_id||null,x.type,x.amount,x.method||'',x.status||'completed',x.datetime,x.notes||'');res.json({ok:true})});app.put('/api/transactions/:id',(req,res)=>{const x=req.body;run('UPDATE transactions SET house_id=?,type=?,amount=?,method=?,status=?,datetime=?,notes=? WHERE id=? AND user_id=?',x.house_id||null,x.type,Number(x.amount)||0,x.method||'',x.status||'completed',x.datetime,x.notes||'',req.params.id,req.user.id);res.json({ok:true})});app.delete('/api/transactions/:id',(req,res)=>{run('DELETE FROM transactions WHERE id=? AND user_id=?',req.params.id,req.user.id);res.json({ok:true})});
app.get('/api/bonuses',(req,res)=>res.json(all('SELECT b.*,h.name house_name FROM bonuses b LEFT JOIN houses h ON h.id=b.house_id AND h.user_id=b.user_id WHERE b.user_id=? ORDER BY deadline',req.user.id)));
app.post('/api/bonuses',(req,res)=>{const x=req.body;run('INSERT INTO bonuses(user_id,house_id,week_start,deadline,required_events,min_odds,min_combined_odds,progress,status,notes) VALUES(?,?,?,?,?,?,?,?,?,?)',req.user.id,x.house_id,x.week_start,x.deadline,x.required_events,x.min_odds,x.min_combined_odds,x.progress||0,x.status||'open',x.notes||'');res.json({ok:true})});
app.put('/api/bonuses/:id',(req,res)=>{const x=req.body;run('UPDATE bonuses SET progress=?,status=?,notes=? WHERE id=? AND user_id=?',x.progress,x.status,x.notes||'',req.params.id,req.user.id)});
app.get('/api/analysis',(req,res)=>{
  const q=req.query;
  let rows=all('SELECT b.*,h.name house_name FROM bets b LEFT JOIN houses h ON h.id=b.house_id AND h.user_id=b.user_id WHERE b.user_id=? ORDER BY datetime(b.datetime) DESC,b.id DESC',req.user.id);
  rows=rows.filter(x=>(!q.house_id||String(x.house_id)===String(q.house_id))&&(!q.market||x.market===q.market)&&(!q.country||x.country===q.country)&&(!q.competition||x.competition===q.competition)&&(!q.team||x.home_team===q.team||x.away_team===q.team)&&(!q.from||x.datetime>=q.from)&&(!q.to||x.datetime<=q.to)&&(!q.min_odds||Number(x.odds)>=Number(q.min_odds))&&(!q.max_odds||Number(x.odds)<=Number(q.max_odds)));
  const resolved=rows.filter(x=>x.result&&x.result!=='pending');
  const summary={bets:rows.length,resolved:resolved.length,stake:resolved.reduce((a,x)=>a+Number(x.stake||0),0),pnl:resolved.reduce((a,x)=>a+Number(x.profit||0),0),wins:resolved.filter(x=>x.result==='win').length};
  summary.roi=summary.stake?summary.pnl/summary.stake*100:0; summary.winRate=summary.resolved?summary.wins/summary.resolved*100:0;
  const groupBy=(keyFn)=>Object.values(rows.reduce((m,x)=>{const k=keyFn(x)||'—';const g=m[k]||{name:k,bets:0,resolved:0,stake:0,pnl:0,wins:0};g.bets++;if(x.result!=='pending'){g.resolved++;g.stake+=Number(x.stake||0);g.pnl+=Number(x.profit||0);if(x.result==='win')g.wins++;}m[k]=g;return m},{})).map(g=>({...g,roi:g.stake?g.pnl/g.stake*100:0,winRate:g.resolved?g.wins/g.resolved*100:0})).sort((a,b)=>b.pnl-a.pnl);
  const teams=groupBy(x=>x.home_team+' / '+x.away_team);
  const teamMap={}; rows.forEach(x=>[x.home_team,x.away_team].filter(Boolean).forEach(t=>{const g=teamMap[t]||{name:t,bets:0,resolved:0,stake:0,pnl:0,wins:0};g.bets++;if(x.result!=='pending'){g.resolved++;g.stake+=Number(x.stake||0);g.pnl+=Number(x.profit||0);if(x.result==='win')g.wins++;}teamMap[t]=g;}));
  const teamStats=Object.values(teamMap).map(g=>({...g,roi:g.stake?g.pnl/g.stake*100:0,winRate:g.resolved?g.wins/g.resolved*100:0})).sort((a,b)=>b.pnl-a.pnl);
  const recent=q.team?rows.filter(x=>x.home_team===q.team||x.away_team===q.team).filter(x=>x.result!=='pending').slice(0,Number(q.limit)||10):[];
  res.json({summary,byMarket:groupBy(x=>x.market),byCountry:groupBy(x=>x.country),byCompetition:groupBy(x=>x.competition),byHouse:groupBy(x=>x.house_name),teamStats,recent});
});
app.post('/api/auth/change-password',(req,res)=>{
  const u=req.user,p=String(req.body.currentPassword||''),n=String(req.body.newPassword||'');
  if(n.length<8)return res.status(400).json({error:'A nova password deve ter pelo menos 8 caracteres.'});
  const row=db.prepare('SELECT password_hash FROM users WHERE id=?').get(u.id);
  if(!row||!verifyPassword(p,row.password_hash))return res.status(400).json({error:'Password atual incorreta.'});
  db.prepare('UPDATE users SET password_hash=? WHERE id=?').run(hashPassword(n),u.id);
  db.prepare('DELETE FROM sessions WHERE user_id=? AND token<>?').run(u.id,cookies(req).bt_session||'');
  res.json({ok:true});
});
app.get('/api/stats',(req,res)=>{const q=req.query,bets=all('SELECT * FROM bets WHERE user_id=?',req.user.id).filter(x=>(!q.house_id||String(x.house_id)===String(q.house_id))&&(!q.from||x.datetime>=q.from)&&(!q.to||x.datetime<=q.to)),resolved=bets.filter(x=>x.result!=='pending'),stake=resolved.reduce((s,x)=>s+Number(x.stake||0),0),pnl=resolved.reduce((s,x)=>s+Number(x.profit||0),0),wins=resolved.filter(x=>x.result==='win').length,tx=all(`SELECT COALESCE(SUM(CASE WHEN type IN ('deposit','bonus','adjustment') THEN amount WHEN type='withdrawal' THEN -amount ELSE 0 END),0) balance FROM transactions WHERE user_id=?`,req.user.id)[0].balance;res.json({count:bets.length,resolved:resolved.length,pnl,stake,roi:stake?pnl/stake*100:0,winRate:resolved.length?wins/resolved.length*100:0,balance:Number(tx)+pnl})});
app.get('/api/export',(req,res)=>{const rows=all('SELECT b.datetime,h.name house,b.country,b.competition,b.home_team,b.away_team,b.market,b.selection,b.odds,b.stake,b.units,b.bonus,b.result,b.profit,b.notes,b.bet_type,b.combined_odds FROM bets b LEFT JOIN houses h ON h.id=b.house_id WHERE b.user_id=? ORDER BY b.datetime',req.user.id);const cols=Object.keys(rows[0]||{datetime:'',house:'',country:'',competition:'',home_team:'',away_team:'',market:'',selection:'',odds:'',stake:'',units:'',bonus:'',result:'',profit:'',notes:'',bet_type:'',combined_odds:''});const esc=v=>'"'+String(v??'').replaceAll('"','""')+'"';res.type('text/csv').send([cols.join(','),...rows.map(x=>cols.map(c=>esc(x[c])).join(','))].join('\n'))});
app.use(express.static(path.join(__dirname,'..','dist')));app.use((req,res)=>res.sendFile(path.join(__dirname,'..','dist','index.html')));app.listen(process.env.PORT||3000,'0.0.0.0',()=>console.log('BetTracker running'));
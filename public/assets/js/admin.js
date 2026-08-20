(() => {
  const $ = s => document.querySelector(s);
  const app = $('#app'), login = $('#login'), workspace = $('#workspace');
  const locales = ['hr','en','de','nl'];
  let data = null, currentView = 'dashboard', currentLocale = 'hr', inquiries = [];

  const esc = s => String(s ?? '').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const slugify = s => String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,80);

  async function api(url, opts={}) {
    const res = await fetch(url, {credentials:'same-origin', ...opts});
    if (res.status === 401) throw Object.assign(new Error('unauthorized'), { unauthorized:true });
    const body = await res.json().catch(()=>({}));
    if (!res.ok) throw new Error(body.error || 'request_failed');
    return body;
  }
  async function check() {
    try { const r = await api('/api/content'); data = r.content; showApp(); }
    catch(e) { if (!e.unauthorized) $('#login-status').textContent='CMS nije konfiguriran ili nije dostupan.'; }
  }
  $('#login-form').addEventListener('submit', async e => {
    e.preventDefault(); const st=$('#login-status'); st.textContent='Prijava…';
    try { await api('/api/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({password:$('#password').value})}); await loadContent(); showApp(); }
    catch(e){ st.textContent='Neispravna lozinka ili CMS još nije konfiguriran.'; }
  });
  $('#logout').addEventListener('click', async()=>{try{await api('/api/logout',{method:'POST'})}catch{} location.reload()});
  $('#refresh').addEventListener('click', loadContent);
  $('#save').addEventListener('click', saveContent);
  document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>switchView(b.dataset.view)));

  async function loadContent(){ const r=await api('/api/content'); data=r.content; render(); }
  function showApp(){ login.hidden=true; app.hidden=false; render(); }
  function switchView(view){ currentView=view; document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===view)); render(); }
  async function saveContent(){
    const st=$('#save-status'); st.textContent='Spremanje…';
    try { await api('/api/content',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({content:data})}); st.textContent='Spremljeno ✓'; setTimeout(()=>st.textContent='',2500); }
    catch(e){ st.textContent='Greška pri spremanju'; }
  }

  function render(){
    if(!data) return; const titles={dashboard:'Nadzorna ploča',settings:'Postavke',taxi:'Taxi & Transfers',travel:'Travel',clean:'Clean',drivers:'Najam vozača',fleet:'Vozni park',pages:'Stranice',inquiries:'Upiti'};
    $('#view-title').textContent=titles[currentView]||'DEAL CMS';
    if(currentView==='dashboard') return renderDashboard();
    if(currentView==='settings') return renderSettings();
    if(['taxi','travel','clean','drivers'].includes(currentView)) return renderItems(currentView);
    if(currentView==='fleet') return renderFleet();
    if(currentView==='pages') return renderPages();
    if(currentView==='inquiries') return renderInquiries();
  }
  function renderDashboard(){
    const itemCount = Object.values(data.items||{}).reduce((n,a)=>n+a.length,0);
    workspace.innerHTML=`<div class="stats"><div class="stat"><span>Ukupno sadržajnih jedinica</span><strong>${itemCount}</strong></div><div class="stat"><span>Travel</span><strong>${data.items.travel.length}</strong></div><div class="stat"><span>Jezici</span><strong>4</strong></div><div class="stat"><span>Vozni park</span><strong>${data.fleet.length}</strong></div></div><div class="notice">Promjene u CMS-u spremaju se izravno u GitHub repozitorij. Svako spremanje pokreće novi Cloudflare deployment, pa je uobičajeno da izmjena postane javna za 30–90 sekundi.</div><div class="panel"><div class="panel-head"><h2>Brzi pristup</h2></div><div class="panel-body grid3"><button class="add-btn" data-go="travel">+ Dodaj izlet / putovanje</button><button class="add-btn" data-go="taxi">+ Dodaj transfer</button><button class="add-btn" data-go="clean">+ Dodaj uslugu čišćenja</button><button class="add-btn" data-go="drivers">+ Dodaj sadržaj za vozače</button><button class="add-btn" data-go="fleet">+ Dodaj vozilo</button><button class="add-btn" data-go="pages">+ Dodaj stranicu</button><button class="add-btn" data-go="settings">Uredi kontakt podatke</button></div></div>`;
    workspace.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>switchView(b.dataset.go)));
  }
  function localeTabs(){return `<div class="locale-tabs">${locales.map(l=>`<button data-locale="${l}" class="${currentLocale===l?'active':''}">${l.toUpperCase()}</button>`).join('')}</div>`}
  function wireLocaleTabs(){workspace.querySelectorAll('[data-locale]').forEach(b=>b.addEventListener('click',()=>{currentLocale=b.dataset.locale;render()}))}
  function renderSettings(){
    const s=data.settings,c=data.copy[currentLocale];
    workspace.innerHTML=`${localeTabs()}<div class="panel"><div class="panel-head"><h2>Kontakt i tehničke postavke</h2></div><div class="panel-body grid2">
    ${field('Telefon za prikaz','phoneDisplay',s.phoneDisplay,'settings')} ${field('Telefon E.164','phone',s.phone,'settings')} ${field('WhatsApp','whatsapp',s.whatsapp,'settings')} ${field('E-mail','email',s.email,'settings')} ${field('Lokacija','location',s.location,'settings')} ${field('Područje rada','coverage',s.coverage,'settings')} ${field('Google Analytics ID','analyticsId',s.analyticsId||'','settings')}
    </div></div><div class="panel"><div class="panel-head"><h2>Početna stranica · ${currentLocale.toUpperCase()}</h2></div><div class="panel-body grid2">${copyField('Hero naslov','heroSubtitle',c.heroSubtitle)}${copyField('Hero tekst','heroText',c.heroText,true)}${copyField('Naslov usluga','serviceIntroTitle',c.serviceIntroTitle,true)}${copyField('Uvod usluga','serviceIntroText',c.serviceIntroText,true)}${copyField('Zašto DEAL naslov','whyTitle',c.whyTitle,true)}${copyField('Zašto DEAL tekst','whyText',c.whyText,true)}${copyField('CTA naslov','ctaTitle',c.ctaTitle,true)}${copyField('CTA tekst','ctaText',c.ctaText,true)}</div></div>`;
    bindFields(); wireLocaleTabs();
  }
  function field(label,key,val,scope='item',textarea=false){return `<div class="field ${textarea?'full':''}"><label>${esc(label)}</label>${textarea?`<textarea data-scope="${scope}" data-key="${key}">${esc(val)}</textarea>`:`<input data-scope="${scope}" data-key="${key}" value="${esc(val)}">`}</div>`}
  function copyField(label,key,val,textarea=false){return `<div class="field ${textarea?'full':''}"><label>${esc(label)}</label>${textarea?`<textarea data-copy-key="${key}">${esc(val)}</textarea>`:`<input data-copy-key="${key}" value="${esc(val)}">`}</div>`}
  function renderItems(type){
    const division=data.divisions.find(d=>d.id===type), arr=data.items[type];
    workspace.innerHTML=`${localeTabs()}<div class="notice">Uređujete <strong>${esc(division.titles[currentLocale])}</strong>. Slug ostaje isti za sve jezike kako bi poveznice bile stabilne. Naslov, opis i sadržaj uređuju se zasebno po jeziku.</div><div class="panel"><div class="panel-head"><h2>Sadržaj</h2><button class="add-btn" id="add-item">+ Dodaj</button></div><div class="panel-body"><div class="items">${arr.map((it,i)=>itemRow(type,it,i)).join('')}</div></div></div>`;
    wireLocaleTabs(); wireItems(type); $('#add-item').addEventListener('click',()=>addItem(type));
  }
  function itemRow(type,it,i){return `<div class="item-row" data-index="${i}"><div class="item-summary"><img src="${esc(it.image)}" alt=""><div class="grow"><strong>${esc(it.title[currentLocale]||it.slug)}</strong><span>/${it.slug}</span></div><button class="edit">Uredi</button><button class="danger remove">Obriši</button></div><div class="item-editor"><div class="grid2">${itemField('Slug','slug',it.slug,i)}${itemField('Fotografija','image',it.image,i,false,true)}${itemField('Naslov','title',it.title[currentLocale],i)}${itemField('Kratki opis','excerpt',it.excerpt[currentLocale],i,true)}${itemField('Glavni tekst','body',it.body[currentLocale],i,true)}<div class="field"><label>Izdvojeno</label><select data-item="${i}" data-prop="featured"><option value="true" ${it.featured?'selected':''}>Da</option><option value="false" ${!it.featured?'selected':''}>Ne</option></select></div></div></div></div>`}
  function itemField(label,prop,val,i,textarea=false,media=false){
    if(media) return `<div class="field full"><label>${label}</label><div class="media-line"><input type="text" data-item="${i}" data-prop="${prop}" value="${esc(val)}"><label class="upload">Učitaj sliku<input type="file" accept="image/*" data-upload="${i}"></label></div></div>`;
    return `<div class="field ${textarea?'full':''}"><label>${label}</label>${textarea?`<textarea data-item="${i}" data-prop="${prop}">${esc(val)}</textarea>`:`<input data-item="${i}" data-prop="${prop}" value="${esc(val)}">`}</div>`;
  }
  function wireItems(type){
    workspace.querySelectorAll('.edit').forEach(b=>b.addEventListener('click',()=>b.closest('.item-row').classList.toggle('open')));
    workspace.querySelectorAll('.remove').forEach(b=>b.addEventListener('click',()=>{const i=+b.closest('.item-row').dataset.index;if(confirm('Obrisati ovu stavku?')){data.items[type].splice(i,1);render()}}));
    workspace.querySelectorAll('[data-item][data-prop]').forEach(el=>el.addEventListener('input',()=>{
      const it=data.items[type][+el.dataset.item], p=el.dataset.prop, val=el.value;
      if(['title','excerpt','body'].includes(p)) it[p][currentLocale]=val; else if(p==='featured') it[p]=val==='true'; else it[p]=val;
    }));
    workspace.querySelectorAll('[data-upload]').forEach(inp=>inp.addEventListener('change',async()=>{const i=+inp.dataset.upload,file=inp.files[0];if(!file)return; const label=inp.parentElement;label.textContent='Učitavanje…';try{const prepared=await prepareImage(file);const fd=new FormData();fd.append('file',prepared);const r=await api('/api/media',{method:'POST',body:fd});data.items[type][i].image=r.path;render()}catch(e){alert('Fotografija nije učitana.')} }));
  }
  function addItem(type){
    const blank={slug:'nova-stavka',image:'/assets/images/about-coast.avif',featured:false,title:{},excerpt:{},body:{}};locales.forEach(l=>{blank.title[l]='Nova stavka';blank.excerpt[l]='Kratki opis';blank.body[l]='Glavni sadržaj';});data.items[type].unshift(blank);render();workspace.querySelector('.item-row')?.classList.add('open');
  }

  function renderPages(){
    data.pages=data.pages||[];
    workspace.innerHTML=`${localeTabs()}<div class="notice">Ovdje možete kreirati dodatne sadržajne stranice. Ako uključite "Navigacija", stranica će se pojaviti u glavnom izborniku nakon sljedećeg deploymenta.</div><div class="panel"><div class="panel-head"><h2>Dodatne stranice</h2><button class="add-btn" id="add-page">+ Nova stranica</button></div><div class="panel-body"><div class="items">${data.pages.map((it,i)=>pageRow(it,i)).join('')}</div></div></div>`;
    wireLocaleTabs(); wirePages(); $('#add-page').addEventListener('click',addPage);
  }
  function pageRow(it,i){return `<div class="item-row" data-index="${i}"><div class="item-summary"><img src="${esc(it.image)}" alt=""><div class="grow"><strong>${esc(it.title[currentLocale]||it.slug)}</strong><span>/${it.slug}/</span></div><button class="edit">Uredi</button><button class="danger remove">Obriši</button></div><div class="item-editor"><div class="grid2">${pageField('Slug','slug',it.slug,i)}${pageField('Fotografija','image',it.image,i,false,true)}${pageField('Naslov','title',it.title[currentLocale],i)}${pageField('Kratki opis','excerpt',it.excerpt[currentLocale],i,true)}${pageField('Glavni sadržaj','body',it.body[currentLocale],i,true)}<div class="field"><label>Navigacija</label><select data-page="${i}" data-prop="nav"><option value="true" ${it.nav?'selected':''}>Prikaži</option><option value="false" ${!it.nav?'selected':''}>Sakrij</option></select></div></div></div></div>`}
  function pageField(label,prop,val,i,textarea=false,media=false){
    if(media) return `<div class="field full"><label>${label}</label><div class="media-line"><input type="text" data-page="${i}" data-prop="${prop}" value="${esc(val)}"><label class="upload">Učitaj sliku<input type="file" accept="image/*" data-page-upload="${i}"></label></div></div>`;
    return `<div class="field ${textarea?'full':''}"><label>${label}</label>${textarea?`<textarea data-page="${i}" data-prop="${prop}">${esc(val)}</textarea>`:`<input data-page="${i}" data-prop="${prop}" value="${esc(val)}">`}</div>`;
  }
  function wirePages(){
    workspace.querySelectorAll('.edit').forEach(b=>b.addEventListener('click',()=>b.closest('.item-row').classList.toggle('open')));
    workspace.querySelectorAll('.remove').forEach(b=>b.addEventListener('click',()=>{const i=+b.closest('.item-row').dataset.index;if(confirm('Obrisati stranicu?')){data.pages.splice(i,1);render()}}));
    workspace.querySelectorAll('[data-page][data-prop]').forEach(el=>el.addEventListener('input',()=>{const it=data.pages[+el.dataset.page],p=el.dataset.prop,val=el.value;if(['title','excerpt','body'].includes(p))it[p][currentLocale]=val;else if(p==='nav')it[p]=val==='true';else it[p]=val;}));
    workspace.querySelectorAll('[data-page-upload]').forEach(inp=>inp.addEventListener('change',async()=>{const i=+inp.dataset.pageUpload,file=inp.files[0];if(!file)return;try{const prepared=await prepareImage(file);const fd=new FormData();fd.append('file',prepared);const r=await api('/api/media',{method:'POST',body:fd});data.pages[i].image=r.path;render()}catch(e){alert('Fotografija nije učitana.')}}));
  }
  function addPage(){const p={slug:'nova-stranica',image:'/assets/images/about-coast.avif',nav:false,title:{},excerpt:{},body:{}};locales.forEach(l=>{p.title[l]='Nova stranica';p.excerpt[l]='Kratki uvod';p.body[l]='Glavni sadržaj stranice';});data.pages.unshift(p);render();workspace.querySelector('.item-row')?.classList.add('open')}

  function renderFleet(){
    workspace.innerHTML=`<div class="panel"><div class="panel-head"><h2>Vozni park</h2><button class="add-btn" id="add-fleet">+ Dodaj vozilo</button></div><div class="panel-body"><div class="items">${data.fleet.map((f,i)=>`<div class="item-row open"><div class="item-editor" style="display:block"><div class="grid2">${fleetField('Naziv','name',f.name,i)}${fleetField('Kapacitet','capacity',f.capacity,i)}${fleetField('Fotografija','image',f.image,i)}${fleetField('Tip · HR','type.hr',f.type.hr,i)}${fleetField('Tip · EN','type.en',f.type.en,i)}${fleetField('Tip · DE','type.de',f.type.de,i)}${fleetField('Tip · NL','type.nl',f.type.nl,i)}<div class="field"><label>&nbsp;</label><button class="ghost danger" data-remove-fleet="${i}">Obriši vozilo</button></div></div></div></div>`).join('')}</div></div></div>`;
    workspace.querySelectorAll('[data-fleet]').forEach(el=>el.addEventListener('input',()=>{const f=data.fleet[+el.dataset.fleet],p=el.dataset.prop;if(p.startsWith('type.'))f.type[p.split('.')[1]]=el.value;else f[p]=el.value}));
    workspace.querySelectorAll('[data-remove-fleet]').forEach(b=>b.addEventListener('click',()=>{data.fleet.splice(+b.dataset.removeFleet,1);render()}));
    $('#add-fleet').addEventListener('click',()=>{data.fleet.push({name:'Novo vozilo',type:{hr:'Vrsta vozila',en:'Vehicle type',de:'Fahrzeugtyp',nl:'Voertuigtype'},image:'/assets/images/taxi-mercedes.avif',capacity:'1–3'});render()});
  }
  function fleetField(label,prop,val,i){return `<div class="field"><label>${label}</label><input data-fleet="${i}" data-prop="${prop}" value="${esc(val)}"></div>`}
  async function renderInquiries(){
    workspace.innerHTML='<div class="notice">Učitavanje upita…</div>';
    try { const r=await api('/api/inquiries'); inquiries=r.inquiries||[]; }
    catch(e){workspace.innerHTML='<div class="notice">Upiti nisu dostupni. Provjerite CMS varijable u Cloudflareu.</div>';return}
    workspace.innerHTML=`<div class="panel"><div class="panel-head"><h2>Zaprimljeni upiti</h2><span class="badge">${inquiries.length}</span></div><div>${inquiries.length?inquiries.map(q=>`<article class="inquiry"><div class="inquiry-head"><strong>${esc(q.name||'Bez imena')}</strong><span class="badge">${esc(q.service||'opći upit')}</span></div><p>${esc(q.message||'')}</p><small>${esc(q.email||'')} · ${esc(q.phone||'')} · ${esc(q.createdAt||'')}</small></article>`).join(''):'<div class="inquiry">Još nema upita.</div>'}</div></div>`;
  }
  function bindFields(){
    workspace.querySelectorAll('[data-scope="settings"]').forEach(el=>el.addEventListener('input',()=>data.settings[el.dataset.key]=el.value));
    workspace.querySelectorAll('[data-copy-key]').forEach(el=>el.addEventListener('input',()=>data.copy[currentLocale][el.dataset.copyKey]=el.value));
  }


  async function prepareImage(file){
    if(!file.type.startsWith('image/')) return file;
    const bitmap=await createImageBitmap(file);
    const max=1800, scale=Math.min(1,max/Math.max(bitmap.width,bitmap.height));
    const canvas=document.createElement('canvas'); canvas.width=Math.round(bitmap.width*scale); canvas.height=Math.round(bitmap.height*scale);
    const ctx=canvas.getContext('2d',{alpha:false}); ctx.drawImage(bitmap,0,0,canvas.width,canvas.height); bitmap.close?.();
    const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',.84));
    return new File([blob],`${slugify(file.name.replace(/\.[^.]+$/,''))||'deal-image'}.webp`,{type:'image/webp'});
  }

  check();
})();

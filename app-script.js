firebase.initializeApp(window.firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();

let fotoBase64 = "";
let itemsToShow = 100;
let semuaData = [];
let asliSemuaData = [];

// FUNGSI TAMPIL / SEMBUNYI LOADING
function showLoading() { document.getElementById('loadingOverlay').classList.remove('hidden'); document.getElementById('loadingOverlay').classList.add('flex'); }
function hideLoading() { document.getElementById('loadingOverlay').classList.add('hidden'); document.getElementById('loadingOverlay').classList.remove('flex'); }

function togglePassword() {
    const inp = document.getElementById('loginPassword');
    const ico = document.getElementById('eyeIcon');
    inp.type = inp.type === 'password' ? 'text' : 'password';
    ico.className = inp.type === 'password' ? 'fa-solid fa-eye' : 'fa-solid fa-eye-slash';
}

auth.onAuthStateChanged(user => {
    const loginScr = document.getElementById('loginScreen');
    const appScr = document.getElementById('appContent');
    
    if (user) {
        loginScr.classList.add('hidden');
        appScr.classList.remove('hidden');
        appScr.classList.add('flex');
        ambilDataLangsung();
    } else {
        loginScr.classList.remove('hidden');
        appScr.classList.add('hidden');
        appScr.classList.remove('flex');
        hideLoading();
    }
});

document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    showLoading();
    const email = document.getElementById('loginEmail').value;
    const pass = document.getElementById('loginPassword').value;
    auth.signInWithEmailAndPassword(email, pass)
        .then(() => hideLoading())
        .catch(err => { hideLoading(); Swal.fire({icon:'error',title:'Gagal',text:err.message,confirmButtonColor:'#1e293b'}); });
});

function logoutFirebase() {
    Swal.fire({title:'Keluar?',text:'Yakin mau keluar?',icon:'warning',showCancelButton:true,confirmButtonColor:'#1e293b',cancelButtonColor:'#ef4444'})
    .then(res => { if(res.isConfirmed){ showLoading(); auth.signOut().then(hideLoading); } });
}

// ✅ FUNGSI UTAMA
function ambilDataLangsung() {
    const wadah = document.getElementById('dataContainer');
    const infoJml = document.getElementById('totalData');

    wadah.innerHTML = `<div class="col-span-full text-center py-10 text-gray-500"><i class="fa-solid fa-spinner fa-spin mr-2"></i> Mengambil data dari server...</div>`;

    db.ref('customers').once('value')
    .then(snapshot => {
        asliSemuaData = [];
        if (snapshot.exists()) {
            snapshot.forEach(baris => {
                asliSemuaData.push({
                    id: baris.key,
                    nama: baris.val().nama || 'Tanpa Nama',
                    nohp: baris.val().nohp || '',
                    layanan: baris.val().layanan || 'Tidak Diketahui',
                    lokasi: baris.val().lokasi || 'Tidak Ada Lokasi',
                    foto: baris.val().foto || 'https://via.placeholder.com/400x400?text=Tanpa+Foto'
                });
            });
            asliSemuaData.reverse();
        }

        semuaData = [...asliSemuaData];
        infoJml.innerText = `${semuaData.length} Data Terdeteksi`;
        tampilkanKartu();
    })
    .catch(err => {
        wadah.innerHTML = `<div class="col-span-full text-center py-10 text-red-500"><i class="fa-solid fa-triangle-exclamation mr-2"></i> Gagal: ${err.message}</div>`;
    });
}

// ✅ TAMPILKAN KARTU + TOMBOL GOOGLE MAPS
function tampilkanKartu() {
    const wadah = document.getElementById('dataContainer');
    const btnLebih = document.getElementById('loadMoreContainer');

    if (semuaData.length === 0) {
        wadah.innerHTML = `<div class="col-span-full text-center py-12 text-gray-500 bg-gray-50 rounded-xl border">
            <i class="fa-solid fa-folder-open text-4xl mb-2 text-gray-300"></i>
            <p class="font-medium">Belum ada data pelanggan tersimpan</p>
        </div>`;
        btnLebih.classList.add('hidden');
        return;
    }

    let html = '';
    semuaData.forEach(cust => {
        const warnaBadge = cust.layanan === 'Grab' ? 'bg-green-500 text-white' : cust.layanan === 'Maxim' ? 'bg-yellow-400 text-black' : 'bg-slate-600 text-white';
        const ikon = cust.layanan === 'Grab' ? 'fa-car' : cust.layanan === 'Maxim' ? 'fa-motorcycle' : 'fa-user-check';
        // ✅ Buat tautan Google Maps otomatis dari lokasi
        const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cust.lokasi)}`;

        html += `
        <div class="bg-white rounded-2xl shadow-sm hover:shadow-md border border-gray-100 p-4 md:p-5 card-hover">
            <div class="flex items-start gap-3">
                <img src="${cust.foto}" alt="Foto" class="w-14 h-14 md:w-16 md:h-16 rounded-lg object-cover border">
                <div class="flex-1 min-w-0">
                    <div class="flex justify-between items-start gap-1 mb-1">
                        <h3 class="font-bold text-lg truncate">${cust.nama}</h3>
                        <span class="${warnaBadge} text-[10px] md:text-xs font-bold px-2 py-1 rounded">
                            <i class="fa-solid ${ikon} mr-1"></i>${cust.layanan}
                        </span>
                    </div>
                    <p class="text-sm text-gray-600 mb-1"><i class="fa-solid fa-phone mr-1 text-gray-400"></i> ${cust.nohp || 'Tidak ada nomor'}</p>
                    <p class="text-sm text-gray-600"><i class="fa-solid fa-map mr-1 text-gray-400"></i> ${cust.lokasi.substring(0, 45)}...</p>
                </div>
            </div>
            <div class="mt-3 grid grid-cols-3 gap-2">
                <button onclick="bukaDetail('${cust.id}')" class="bg-blue-50 text-blue-600 hover:bg-blue-100 py-2 rounded-lg text-sm font-semibold">
                    <i class="fa-solid fa-eye mr-1"></i> Lihat
                </button>
                <!-- ✅ TOMBOL BARU: GOOGLE MAPS -->
                <a href="${mapsUrl}" target="_blank" class="text-center bg-green-50 text-green-700 hover:bg-green-100 py-2 rounded-lg text-sm font-semibold">
                    <i class="fa-solid fa-map-location-dot mr-1"></i> Maps
                </a>
                <button onclick="hapusData('${cust.id}')" class="bg-red-50 text-red-600 hover:bg-red-100 py-2 rounded-lg text-sm font-semibold">
                    <i class="fa-solid fa-trash mr-1"></i> Hapus
                </button>
            </div>
        </div>`;
    });

    wadah.innerHTML = html;
    btnLebih.classList.add('hidden');
}

// CARI DATA
document.getElementById('searchInput').addEventListener('input', function(e) {
    const kata = e.target.value.trim().toLowerCase();
    if(!kata) { semuaData = [...asliSemuaData]; }
    else {
        semuaData = asliSemuaData.filter(x => 
            x.nama.toLowerCase().includes(kata) ||
            x.nohp.toLowerCase().includes(kata) ||
            x.lokasi.toLowerCase().includes(kata) ||
            x.layanan.toLowerCase().includes(kata)
        );
    }
    document.getElementById('totalData').innerText = `${semuaData.length} Data Terdeteksi`;
    tampilkanKartu();
});

function muatUlangData() { ambilDataLangsung(); }

// SISA FUNGSI PENDUKUNG TETAP SAMA
let slideIndex = 0;
const slides = document.querySelectorAll('.slide');
function showSlides() {
    slides.forEach(s=>s.classList.remove('active'));
    slideIndex++; if(slideIndex>slides.length) slideIndex=1;
    slides[slideIndex-1].classList.add('active');
    setTimeout(showSlides,4000);
}
showSlides();

function bukaGaleri(){ document.getElementById('foto').removeAttribute('capture'); document.getElementById('foto').click(); }
function bukaKamera(){ document.getElementById('foto').setAttribute('capture','environment'); document.getElementById('foto').click(); }

async function kompresGambar(file, kualitas=0.2, lebar=900){
    return new Promise(res=>{
        const c=document.createElement('canvas'); const ctx=c.getContext('2d'); const i=new Image();
        i.onload=()=>{ let w=i.width,h=i.height; if(w>lebar){h=Math.round(h*lebar/w);w=lebar;} c.width=w;c.height=h;ctx.drawImage(i,0,0,w,h); res(c.toDataURL('image/jpeg',kualitas)); };
        i.src=URL.createObjectURL(file);
    });
}

document.getElementById('foto').addEventListener('change', async function(e){
    const f=e.target.files[0]; if(!f) return;
    showLoading(); fotoBase64=await kompresGambar(f);
    document.getElementById('previewFoto').src=fotoBase64; document.getElementById('previewFoto').classList.remove('hidden'); hideLoading();
});

function getLocation(){
    if(!navigator.geolocation){ Swal.fire({icon:'info',text:'GPS tidak didukung'}); return; }
    const lok=document.getElementById('lokasi'); lok.value="Mencari lokasi...";
    navigator.geolocation.getCurrentPosition(pos=>{
        lok.value = `${pos.coords.latitude}, ${pos.coords.longitude}`;
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&accept-language=id`)
        .then(r=>r.json()).then(d=>{ lok.value += "\n"+(d.display_name||''); }).catch(()=>{});
    },err=>{ lok.value="Gagal dapat lokasi"; });
}

// FORM SIMPAN DATA
document.getElementById('customerForm').addEventListener('submit', function(e){
    e.preventDefault(); showLoading();
    const dataBaru = {
        nama: document.getElementById('nama').value.trim(),
        nohp: document.getElementById('nohp').value.trim(),
        layanan: document.getElementById('layanan').value,
        lokasi: document.getElementById('lokasi').value.trim(),
        foto: fotoBase64 || 'https://via.placeholder.com/400x400?text=Tanpa+Foto'
    };
    const kunci = Date.now().toString();
    db.ref('customers/'+kunci).set(dataBaru)
    .then(()=>{
        this.reset(); fotoBase64=""; document.getElementById('previewFoto').classList.add('hidden'); hideLoading();
        Swal.fire({icon:'success',title:'Disimpan',text:'Data masuk ke cloud',confirmButtonColor:'#1e293b'});
        ambilDataLangsung();
    })
    .catch(err=>{ hideLoading(); Swal.fire({icon:'error',title:'Gagal',text:err.message,confirmButtonColor:'#1e293b'}); });
});

// ✅ MODAL JUGA DITAMBAH TOMBOL MAPS
function bukaDetail(id){
    const d = asliSemuaData.find(x=>x.id===id); if(!d) return;
    document.getElementById('modalFoto').src=d.foto; document.getElementById('modalNama').textContent=d.nama;
    document.getElementById('modalNoHP').textContent=d.nohp||'Tidak ada';
    document.getElementById('modalBtnWA').href = `https://wa.me/62${(d.nohp||'').replace(/^0/,'')}`;
    document.getElementById('modalBtnMaps').href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(d.lokasi)}`;
    document.getElementById('waModal').classList.remove('hidden');
}
function closeModal(){ document.getElementById('waModal').classList.add('hidden'); }
document.getElementById('waModal').addEventListener('click',e=>{ if(e.target.id==='waModal') closeModal(); });

function hapusData(id){
    Swal.fire({title:'Hapus data ini?',icon:'warning',showCancelButton:true,confirmButtonColor:'#ef4444',cancelButtonColor:'#64748b'})
    .then(r=>{ if(r.isConfirmed){ showLoading(); db.ref('customers/'+id).remove().then(()=>{ hideLoading(); ambilDataLangsung(); }); } });
}

function formatWA(n){ return n? n.replace(/^0/,'62').replace(/\D/g,'') : ''; }

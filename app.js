let DB={topics:[],terms:[]};

const normalize=s=>(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
const esc=s=>(s||"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));

async function init(){
  DB=await fetch("data/terms.json").then(r=>r.json());
  document.getElementById("menuBtn").onclick=()=>document.getElementById("nav").classList.toggle("open");
  window.addEventListener("hashchange",route);
  route();
  if("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(()=>{});
}
function route(){
  const hash=location.hash||"#/";
  const [path,query]=hash.slice(2).split("?");
  if(path==="dictionary") renderDictionary(new URLSearchParams(query||""));
  else if(path==="learn") renderLearn();
  else if(path==="about") renderAbout();
  else if(path.startsWith("term/")) renderTerm(decodeURIComponent(path.slice(5)));
  else renderHome();
  window.scrollTo({top:0,behavior:"instant"});
}
function topicCards(){
  return DB.topics.map((t,i)=>`<a class="topic-card" href="#/dictionary?topic=${encodeURIComponent(t.id)}">
    <div class="num">${String(i+1).padStart(2,"0")}</div><h3>${esc(t.name)}</h3><p>${esc(t.description)}</p></a>`).join("");
}
function renderHome(){
  const app=document.getElementById("app");
  app.innerHTML=`<div class="container">
    <section class="hero">
      <div class="hero-copy"><div class="eyebrow">Từ điển chuyên ngành địa không gian</div>
        <h1>Hiểu GIS<br>từ gốc đến AI.</h1>
        <p>Tra cứu tiếng Việt về GIS, WebGIS, bản đồ số, dữ liệu không gian, viễn thám, GeoAI, Spatial AI và Spatial LLM. Viết cho người học, kỹ sư, nhà quản lý và người không cần biết lập trình.</p>
        <form class="searchbox" id="homeSearch"><input id="homeQ" placeholder="Thử: GIS, CRS, PMTiles, GeoAI, Spatial LLM…" autocomplete="off"><button>Tra cứu</button></form>
      </div>
      <aside class="hero-card"><div><div class="eyebrow">GIS trong 30 giây</div><h2>GIS trả lời câu hỏi “Ở đâu?” và “Điều gì xảy ra ở đó?”</h2><p>GIS kết nối <b>vị trí</b> với <b>thông tin</b>, sau đó dùng quan hệ không gian để phân tích và hỗ trợ quyết định.</p></div>
        <div class="stat"><div><b>${DB.terms.length}</b><span>mục từ khởi đầu</span></div><div><b>${DB.topics.length}</b><span>chủ đề học</span></div><div><b>100%</b><span>chạy phía trình duyệt</span></div><div><b>Offline</b><span>PWA-ready</span></div></div>
      </aside>
    </section>
    <div class="section-title"><div><h2>Học theo hệ thống</h2><p>Khái niệm nền đứng trước khái niệm dẫn xuất.</p></div></div>
    <section class="grid">${topicCards()}</section>
    <div class="section-title"><div><h2>GIS không chỉ là bản đồ</h2><p>Năm thành phần cốt lõi của một hệ GIS.</p></div></div>
    <section class="fact-grid">
      <div class="fact"><b>01 · Dữ liệu</b><span>Điểm, đường, vùng, raster, ảnh, 3D, thời gian và cảm biến.</span></div>
      <div class="fact"><b>02 · Vị trí</b><span>Tọa độ, CRS, datum, phép chiếu và độ chính xác.</span></div>
      <div class="fact"><b>03 · Quan hệ</b><span>Trong, ngoài, gần, giao nhau, kết nối và tiếp giáp.</span></div>
      <div class="fact"><b>04 · Phân tích</b><span>Overlay, buffer, network, mô hình hóa, thống kê và AI.</span></div>
      <div class="fact"><b>05 · Trình bày</b><span>Bản đồ 2D/3D, dashboard, WebGIS và digital twin.</span></div>
      <div class="fact"><b>GeoAI</b><span>AI học từ dữ liệu có vị trí và cấu trúc không gian.</span></div>
      <div class="fact"><b>Spatial AI</b><span>Máy hiểu không gian để nhận thức, dự đoán và hành động.</span></div>
      <div class="fact"><b>Spatial LLM</b><span>LLM dùng dữ liệu và công cụ GIS để suy luận không gian có kiểm chứng.</span></div>
    </section>
  </div>`;
  document.getElementById("homeSearch").onsubmit=e=>{e.preventDefault();location.hash="#/dictionary?q="+encodeURIComponent(document.getElementById("homeQ").value)};
}
function renderDictionary(params=new URLSearchParams()){
  const selected=params.get("topic")||"all", initial=params.get("q")||"";
  document.getElementById("app").innerHTML=`<div class="container dictionary-layout">
    <aside class="sidebar panel"><h3>Chủ đề</h3><div class="filter" id="filters">
      <button data-topic="all" class="${selected==="all"?"active":""}">Tất cả</button>
      ${DB.topics.map(t=>`<button data-topic="${t.id}" class="${selected===t.id?"active":""}">${esc(t.name)}</button>`).join("")}
    </div></aside>
    <section><div class="dictionary-head"><input id="q" value="${esc(initial)}" placeholder="Tìm thuật ngữ, định nghĩa, ví dụ…"><div class="count" id="count"></div></div><div class="terms" id="terms"></div></section>
  </div>`;
  let topic=selected;
  const q=document.getElementById("q");
  const draw=()=>{
    const needle=normalize(q.value);
    const list=DB.terms.filter(t=>(topic==="all"||t.topic===topic)&&(!needle||normalize([t.term,t.vi,t.definition,t.explain,t.example,t.warning,t.related?.join(" ")].join(" ")).includes(needle)));
    document.getElementById("count").textContent=list.length+" mục";
    document.getElementById("terms").innerHTML=list.length?list.map(termCard).join(""):'<div class="empty">Không tìm thấy thuật ngữ phù hợp.</div>';
  };
  q.oninput=draw;
  document.querySelectorAll("[data-topic]").forEach(b=>b.onclick=()=>{document.querySelectorAll("[data-topic]").forEach(x=>x.classList.remove("active"));b.classList.add("active");topic=b.dataset.topic;draw()});
  draw();
}
function termCard(t){
  const topic=DB.topics.find(x=>x.id===t.topic);
  return `<article class="term-card"><div class="term-top"><div><h2 class="term-title"><a href="#/term/${encodeURIComponent(t.slug)}">${esc(t.term)}</a></h2><div class="term-vi">${esc(t.vi)}</div></div><span class="badge">${esc(topic?.name||"GIS")}</span></div>
  <p class="definition">${esc(t.definition)}</p><div class="explain"><b>Hiểu đơn giản:</b> ${esc(t.explain)}</div><div class="example"><b>Ví dụ GIS:</b> ${esc(t.example)}</div><div class="warning"><b>Dễ nhầm:</b> ${esc(t.warning)}</div>
  <div class="related"><b>Liên quan:</b> ${(t.related||[]).map(esc).join(" · ")}</div></article>`;
}
function renderTerm(slug){
  const t=DB.terms.find(x=>x.slug===slug);
  if(!t){document.getElementById("app").innerHTML='<div class="container empty">Không tìm thấy mục từ.</div>';return}
  const topic=DB.topics.find(x=>x.id===t.topic);
  document.getElementById("app").innerHTML=`<div class="container article"><div class="eyebrow">${esc(topic?.name||"GIS")}</div><h1>${esc(t.term)}</h1><div class="term-vi">${esc(t.vi)}</div>
  <p class="lead">${esc(t.definition)}</p><h2>Hiểu đơn giản</h2><p>${esc(t.explain)}</p><h2>Ví dụ</h2><blockquote>${esc(t.example)}</blockquote><h2>Dễ nhầm</h2><p>${esc(t.warning)}</p><h2>Thuật ngữ liên quan</h2><div class="pill-row">${(t.related||[]).map(x=>`<span class="pill">${esc(x)}</span>`).join("")}</div></div>`;
}
function renderLearn(){
 document.getElementById("app").innerHTML=`<div class="container"><div class="section-title"><div><h2>Lộ trình học GIS</h2><p>Đi từ bản đồ và tọa độ đến GeoAI và Spatial LLM.</p></div></div><div class="grid">${topicCards()}</div></div>`;
}
function renderAbout(){
  document.getElementById("app").innerHTML=`<article class="container article"><div class="eyebrow">Nhập môn</div><h1>GIS là gì?</h1>
  <p class="lead"><b>GIS (Geographic Information System)</b> là hệ thống dùng để thu thập, quản lý, phân tích và trình bày thông tin gắn với vị trí.</p>
  <blockquote>Một bảng dữ liệu trả lời “cái gì?”. GIS thêm câu hỏi “ở đâu?”, rồi tiếp tục hỏi “gần cái gì?”, “nằm trong đâu?”, “kết nối thế nào?”, “thay đổi ra sao theo thời gian?” và “nếu điều kiện thay đổi thì chuyện gì sẽ xảy ra?”.</blockquote>
  <h2>GIS gồm những gì?</h2><p>Một hệ GIS hoàn chỉnh thường có dữ liệu, phần mềm, hạ tầng tính toán, phương pháp và con người. Dữ liệu có thể là điểm, đường, vùng, ảnh raster, ảnh vệ tinh, LiDAR, mô hình 3D, dữ liệu cảm biến hoặc chuỗi thời gian.</p>
  <h2>GIS khác bản đồ như thế nào?</h2><p>Bản đồ chủ yếu là một cách trình bày. GIS còn lưu cấu trúc dữ liệu, thuộc tính, hệ tọa độ, quan hệ không gian và các phép phân tích. Vì vậy, GIS có thể tạo ra nhiều bản đồ khác nhau từ cùng một cơ sở dữ liệu.</p>
  <h2>WebGIS là gì?</h2><p>WebGIS đưa năng lực GIS lên môi trường web. Người dùng có thể mở bản đồ, tra cứu dữ liệu, phân tích hoặc chỉnh sửa bằng trình duyệt. Hệ thống có thể dùng map server truyền thống hoặc kiến trúc cloud-native với COG, vector tile và PMTiles.</p>
  <h2>GeoAI là gì?</h2><p>GeoAI kết hợp AI với dữ liệu địa lý. Điểm quan trọng là mô hình không chỉ nhìn vào thuộc tính mà còn phải tôn trọng vị trí, khoảng cách, mạng lưới, hướng, thời gian và tính phụ thuộc không gian.</p>
  <h2>Spatial AI và Spatial LLM</h2><p>Spatial AI hướng đến việc để máy hiểu môi trường không gian. Spatial LLM là một nhánh đang phát triển, trong đó mô hình ngôn ngữ được kết nối với dữ liệu và công cụ GIS để trả lời câu hỏi không gian bằng ngôn ngữ tự nhiên nhưng vẫn có thể kiểm chứng bằng phép toán địa lý.</p>
  </article>`;
}
init();

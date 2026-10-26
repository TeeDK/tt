/* Giao diện chung + hiển thị trang chủ, trang chương, trang thực hành. */
(function () {
  'use strict';

  const D = window.COURSE;
  const G = window.GRADER;
  const KEY = 'cpplab.results.v1';

  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = (s) =>
    String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  /* ---------------- Tô màu cú pháp C++ ---------------- */
  const KW = new Set('if else for while do switch case default break continue return using namespace const struct class new delete sizeof typedef static void true false auto nullptr'.split(' '));
  const TY = new Set('int long short unsigned signed float double char bool string vector size_t'.split(' '));
  const BI = new Set('cout cin endl cerr getline sqrt pow fabs abs tolower toupper sort swap setprecision fixed length size substr find'.split(' '));

  function highlight(code) {
    const re = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|("(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*')|(#\s*include\s*<[^>\n]*>|#\s*\w+)|\b(\d+(?:\.\d+)?)\b|\b([A-Za-z_]\w*)\b/g;
    let out = '';
    let last = 0;
    let m;
    while ((m = re.exec(code))) {
      out += esc(code.slice(last, m.index));
      if (m[1]) out += '<span class="tk-c">' + esc(m[1]) + '</span>';
      else if (m[2]) out += '<span class="tk-s">' + esc(m[2]) + '</span>';
      else if (m[3]) out += '<span class="tk-p">' + esc(m[3]) + '</span>';
      else if (m[4]) out += '<span class="tk-n">' + esc(m[4]) + '</span>';
      else {
        const w = m[5];
        const next = code.slice(re.lastIndex).match(/^\s*\(/);
        let cls = '';
        if (KW.has(w)) cls = 'tk-k';
        else if (TY.has(w)) cls = 'tk-t';
        else if (BI.has(w) || next) cls = 'tk-f';
        out += cls ? '<span class="' + cls + '">' + esc(w) + '</span>' : esc(w);
      }
      last = re.lastIndex;
    }
    return out + esc(code.slice(last));
  }

  function codeBox(code) {
    return (
      '<div class="codebox"><div class="codebar"><span class="dots"><i></i><i></i><i></i></span><span>main.cpp</span>' +
      '<button class="copy" type="button">Sao chép</button></div><pre><code>' +
      highlight(code) +
      '</code></pre></div>'
    );
  }

  /* ---------------- Header / Footer ---------------- */
  function renderHeader() {
    const page = document.body.dataset.page;
    const chap = Number(document.body.dataset.chapter || 0);
    const links = D.CHAPTERS.map(
      (c) =>
        '<a href="chuong' + c.id + '.html"><span class="n">' + c.id + '</span><span>' + esc(c.title) + '</span></a>'
    ).join('');
    $('#site-header').outerHTML =
      '<header class="site-header"><div class="wrap bar">' +
      '<a class="brand" href="bai43.html"><span class="logo">{ }</span>C++ Lab</a>' +
      '<button class="burger" type="button" aria-label="Mở menu" aria-expanded="false">&#9776;</button>' +
      '<nav class="menu" id="menu">' +
      '<a href="bai43.html" class="' + (page === 'home' ? 'active' : '') + '">Trang chủ C++</a>' +
      '<a href="index.html">Trang cá nhân</a>' +
      '<div class="dd"><a href="bai43.html#chuong" class="dd-t ' + (page === 'chapter' ? 'active' : '') + '">Các chương học &#9662;</a>' +
      '<div class="dd-m">' + links + '</div></div>' +
      '<a href="thuc-hanh.html" class="cta">Thực hành &amp; chấm điểm</a>' +
      '</nav></div></header>';
    const burger = $('.burger');
    burger.addEventListener('click', function () {
      const open = $('#menu').classList.toggle('open');
      burger.setAttribute('aria-expanded', String(open));
    });
    void chap;
  }

  function renderFooter() {
    $('#site-footer').outerHTML =
      '<footer class="site-footer"><div class="wrap"><div>© ' + new Date().getFullYear() +
      ' C++ Lab - Website hỗ trợ dạy học lập trình C++</div>' +
      '<div><a href="bai43.html">Trang chủ C++</a> · <a href="thuc-hanh.html">Thực hành</a> · <a href="index.html">Trang cá nhân</a></div></div></footer>';
  }

  function bindCopy(root) {
    $$('.copy', root).forEach(function (btn) {
      btn.addEventListener('click', function () {
        const text = btn.closest('.codebox').querySelector('pre').textContent;
        const done = function () {
          btn.textContent = 'Đã chép ✓';
          setTimeout(function () { btn.textContent = 'Sao chép'; }, 1500);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(done, done);
        } else {
          const ta = document.createElement('textarea');
          ta.value = text;
          document.body.appendChild(ta);
          ta.select();
          try { document.execCommand('copy'); } catch (e) { /* bỏ qua */ }
          ta.remove();
          done();
        }
      });
    });
  }

  /* ---------------- Trang chủ ---------------- */
  function renderHome() {
    const totalEx = D.CHAPTERS.reduce((s, c) => s + c.exercises.length, 0);
    const totalTh = D.CHAPTERS.reduce((s, c) => s + c.theory.length, 0);

    const cards = D.CHAPTERS.map(function (c) {
      return (
        '<article class="ccard"><span class="ico">' + c.icon + '</span>' +
        '<div class="no">Chương ' + c.id + '</div><h3>' + esc(c.title) + '</h3><p>' + esc(c.summary) + '</p>' +
        '<div class="meta"><span><b>' + c.theory.length + '</b> mục lý thuyết</span><span><b>' + c.exercises.length + '</b> bài tập</span></div>' +
        '<div class="acts">' +
        '<a class="btn btn-navy btn-sm" href="chuong' + c.id + '.html#ly-thuyet">📖 Lý thuyết</a>' +
        '<a class="btn btn-line btn-sm" href="chuong' + c.id + '.html#bai-tap">📝 Bài tập</a>' +
        '<a class="btn btn-primary btn-sm" href="thuc-hanh.html?chapter=' + c.id + '">▶ Thực hành</a>' +
        '</div></article>'
      );
    }).join('');

    $('#app').innerHTML =
      '<section class="hero"><div class="wrap">' +
      '<span class="tag">Học phần Lập trình C++</span>' +
      '<h1>Học lập trình <span>C++</span> từ cơ bản đến thực hành</h1>' +
      '<p class="lead">Bài giảng rõ ràng, bài tập xếp từ dễ đến khó kèm lời giải, và hệ thống nộp bài chấm điểm ngay trên trình duyệt.</p>' +
      '<div class="btns"><a class="btn btn-primary" href="#chuong">Bắt đầu học</a>' +
      '<a class="btn btn-ghost" href="thuc-hanh.html">Làm bài thực hành</a></div>' +
      '<div class="stats"><div><b>' + D.CHAPTERS.length + '</b><span>Chương học phần</span></div>' +
      '<div><b>' + totalTh + '</b><span>Mục lý thuyết</span></div>' +
      '<div><b>' + totalEx + '</b><span>Bài tập có lời giải</span></div></div>' +
      '</div></section>' +
      '<section class="section" id="chuong"><div class="wrap">' +
      '<h2 class="title">Các chương học phần</h2>' +
      '<p class="sub">Mỗi chương gồm phần Lý thuyết và phần Bài tập thực hành (sắp xếp từ dễ đến khó, có lời giải).</p>' +
      '<div class="grid">' + cards + '</div></div></section>' +
      '<section class="section" style="padding-top:0"><div class="wrap">' +
      '<h2 class="title">Cách học hiệu quả</h2><p class="sub">Ba bước đơn giản cho mỗi chương.</p>' +
      '<div class="steps">' +
      '<div class="step"><div class="num">1</div><h4>Đọc lý thuyết</h4><p>Nắm khái niệm và chạy thử các ví dụ mẫu trong bài giảng.</p></div>' +
      '<div class="step"><div class="num">2</div><h4>Tự giải bài tập</h4><p>Thử làm từ bài dễ đến bài khó trước khi mở lời giải.</p></div>' +
      '<div class="step"><div class="num">3</div><h4>Nộp bài và xem điểm</h4><p>Nhập mã sinh viên, dán mã nguồn, nhận điểm và nhận xét từng tiêu chí.</p></div>' +
      '</div></div></section>';
  }

  /* ---------------- Trang chương ---------------- */
  function renderChapter() {
    const id = Number(document.body.dataset.chapter);
    const ch = D.CHAPTERS.find((c) => c.id === id);
    if (!ch) {
      $('#app').innerHTML = '<div class="wrap section"><h2 class="title">Không tìm thấy chương</h2></div>';
      return;
    }
    document.title = 'Chương ' + ch.id + ': ' + ch.title + ' - C++ Lab';
    const exs = ch.exercises.slice().sort((a, b) => a.level - b.level || a.id.localeCompare(b.id));

    const toc =
      '<aside class="toc"><h5>Lý thuyết</h5>' +
      ch.theory.map((t, i) => '<a href="#lt-' + (i + 1) + '">' + (i + 1) + '. ' + esc(t.title) + '</a>').join('') +
      '<hr><h5>Bài tập</h5>' +
      exs.map((e) => '<a href="#bt-' + e.id.replace('.', '-') + '">Bài ' + e.id + ' · ' + esc(e.title) + '</a>').join('') +
      '</aside>';

    const theory = ch.theory.map(function (t, i) {
      return (
        '<article class="theory" id="lt-' + (i + 1) + '"><h3><span class="i">§' + (i + 1) + '</span>' + esc(t.title) + '</h3>' +
        t.html + (t.code ? codeBox(t.code) : '') + '</article>'
      );
    }).join('');

    const exercises = exs.map(function (e) {
      return (
        '<article class="ex" id="bt-' + e.id.replace('.', '-') + '">' +
        '<div class="ex-h"><span class="id">Bài ' + e.id + '</span><h4>' + esc(e.title) + '</h4>' +
        '<span class="lv lv-' + e.level + '">' + D.LEVELS[e.level] + '</span></div>' +
        '<div class="ex-b">' + e.statement +
        '<div class="io"><div><h6>Dữ liệu vào (ví dụ)</h6><pre>' + esc(e.sampleIn) + '</pre></div>' +
        '<div><h6>Kết quả ra (ví dụ)</h6><pre>' + esc(e.sampleOut) + '</pre></div></div>' +
        '<div class="ex-acts"><a class="btn btn-primary btn-sm" href="thuc-hanh.html?ex=' + e.id + '">▶ Làm bài &amp; nộp chấm điểm</a></div>' +
        '<details class="sol"><summary>Xem lời giải mẫu</summary>' + codeBox(e.solution) +
        '<div class="explain"><b>Giải thích:</b>' + e.explain + '</div></details>' +
        '</div></article>'
      );
    }).join('');

    const prev = D.CHAPTERS.find((c) => c.id === id - 1);
    const next = D.CHAPTERS.find((c) => c.id === id + 1);

    $('#app').innerHTML =
      '<section class="banner" data-ico="' + ch.icon + '"><div class="wrap">' +
      '<div class="crumbs"><a href="bai43.html">Trang chủ</a> › Chương ' + ch.id + '</div>' +
      '<div class="no">Chương ' + ch.id + '</div><h1>' + esc(ch.title) + '</h1><p>' + esc(ch.summary) + '</p>' +
      '<div class="chips"><span class="chip">📖 ' + ch.theory.length + ' mục lý thuyết</span>' +
      '<span class="chip">📝 ' + ch.exercises.length + ' bài tập (dễ → khó)</span></div></div></section>' +
      '<div class="wrap"><div class="layout">' + toc + '<div>' +
      '<section id="ly-thuyet"><h2 class="part-title"><span class="badge">PHẦN 1</span>Lý thuyết</h2>' + theory + '</section>' +
      '<section id="bai-tap" style="margin-top:36px"><h2 class="part-title"><span class="badge or">PHẦN 2</span>Bài tập thực hành</h2>' +
      '<p class="sub" style="margin:-8px 0 18px;color:#5b6478">Sắp xếp theo mức độ từ dễ đến khó. Hãy tự làm trước khi mở lời giải.</p>' +
      exercises + '</section></div></div>' +
      '<div class="pager">' +
      (prev ? '<a class="btn btn-line" href="chuong' + prev.id + '.html">← Chương ' + prev.id + '</a>' : '<span></span>') +
      (next ? '<a class="btn btn-navy" href="chuong' + next.id + '.html">Chương ' + next.id + ' →</a>' : '<a class="btn btn-primary" href="thuc-hanh.html">Đến trang thực hành →</a>') +
      '</div></div>';

    bindCopy($('#app'));

    // Mở sẵn lời giải nếu URL trỏ tới một bài tập cụ thể và làm nổi mục đang xem trong mục lục
    const links = $$('.toc a');
    function spy() {
      let cur = null;
      links.forEach(function (a) {
        const t = document.getElementById(a.getAttribute('href').slice(1));
        if (t && t.getBoundingClientRect().top < 140) cur = a;
      });
      links.forEach((a) => a.classList.toggle('on', a === cur));
    }
    window.addEventListener('scroll', spy, { passive: true });
    spy();
  }

  /* ---------------- Trang thực hành ---------------- */
  function loadResults() {
    try {
      const v = JSON.parse(localStorage.getItem(KEY) || '[]');
      return Array.isArray(v) ? v : [];
    } catch (e) {
      return [];
    }
  }
  function saveResults(list) {
    try { localStorage.setItem(KEY, JSON.stringify(list)); return true; } catch (e) { return false; }
  }
  const fmtTime = (t) => new Date(t).toLocaleString('vi-VN');
  const scClass = (s, m) => (s / m >= 0.7 ? 'g' : s / m >= 0.5 ? 'm' : 'b');

  function renderPractice() {
    document.title = 'Thực hành & chấm điểm - C++ Lab';
    const params = new URLSearchParams(location.search);
    let exId = params.get('ex');
    let chId = Number(params.get('chapter')) || 1;
    if (exId && D.findExercise(exId)) chId = D.findExercise(exId).chapter.id;
    else exId = null;

    $('#app').innerHTML =
      '<section class="banner"><div class="wrap"><div class="crumbs"><a href="bai43.html">Trang chủ</a> › Thực hành</div>' +
      '<h1>Thực hành &amp; chấm điểm</h1><p>Chọn bài tập, nhập mã sinh viên, dán lời giải C++ của bạn rồi bấm nộp để nhận điểm.</p></div></section>' +
      '<div class="wrap"><div class="practice">' +
      '<div class="panel"><h3>1. Chọn bài tập</h3>' +
      '<div class="row2"><div class="field"><label for="chapterSel">Chương</label><select id="chapterSel"></select></div>' +
      '<div class="field"><label for="exSel">Bài tập</label><select id="exSel"></select></div></div>' +
      '<div class="exinfo" id="exInfo"></div>' +
      '<div class="field"><label for="mssv">2. Mã sinh viên</label><input id="mssv" type="text" maxlength="15" autocomplete="off" placeholder="Ví dụ: 2051052123">' +
      '<div class="err" id="mssvErr"></div></div>' +
      '<div class="note" style="margin-top:0">Điểm được chấm tự động theo tiêu chí (cấu trúc lệnh, công thức, thuật toán) vì trình duyệt không biên dịch được C++. Giảng viên có thể xem lại mã nguồn đã nộp.</div></div>' +
      '<div class="panel"><h3>3. Lời giải của bạn</h3>' +
      '<div class="field"><label for="code">Mã nguồn C++</label><textarea id="code" spellcheck="false" placeholder="#include <iostream>\nusing namespace std;\n\nint main() {\n    // Viết lời giải ở đây\n    return 0;\n}"></textarea>' +
      '<div class="hint">Phím Tab chèn 4 dấu cách. Dán toàn bộ chương trình, gồm cả #include và main().</div></div>' +
      '<div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn btn-primary" id="submitBtn" type="button">✔ Nộp bài &amp; chấm điểm</button>' +
      '<button class="btn btn-line" id="clearBtn" type="button">Xóa mã</button></div>' +
      '<div id="result"></div></div></div>' +
      '<div class="hist"><div class="panel"><div class="hist-top"><h3 style="margin:0">Bảng điểm đã nộp (lưu trên trình duyệt này)</h3>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-line btn-sm" id="csvBtn" type="button">⬇ Xuất CSV</button>' +
      '<button class="btn btn-danger btn-sm" id="resetBtn" type="button">Xóa lịch sử</button></div></div>' +
      '<div class="summary" id="summary"></div><div class="tbl-wrap" id="hist"></div></div></div></div>' +
      '<div class="modal" id="modal"><div class="box"><header><span id="modalTitle"></span><button type="button" id="modalClose" aria-label="Đóng">×</button></header><pre id="modalCode"></pre></div></div>';

    const chSel = $('#chapterSel');
    const exSel = $('#exSel');
    chSel.innerHTML = D.CHAPTERS.map((c) => '<option value="' + c.id + '">Chương ' + c.id + ': ' + esc(c.title) + '</option>').join('');
    chSel.value = String(chId);

    function fillExercises(selected) {
      const ch = D.CHAPTERS.find((c) => c.id === Number(chSel.value));
      const list = ch.exercises.slice().sort((a, b) => a.level - b.level || a.id.localeCompare(b.id));
      exSel.innerHTML = list.map((e) => '<option value="' + e.id + '">Bài ' + e.id + ' - ' + esc(e.title) + ' (' + D.LEVELS[e.level] + ')</option>').join('');
      exSel.value = selected && list.some((e) => e.id === selected) ? selected : list[0].id;
      showInfo();
    }
    function showInfo() {
      const f = D.findExercise(exSel.value);
      const e = f.exercise;
      $('#exInfo').innerHTML =
        '<h4>Bài ' + e.id + ': ' + esc(e.title) + ' <span class="lv lv-' + e.level + '">' + D.LEVELS[e.level] + '</span></h4>' + e.statement +
        '<div class="io"><div><h6>Dữ liệu vào</h6><pre>' + esc(e.sampleIn) + '</pre></div><div><h6>Kết quả ra</h6><pre>' + esc(e.sampleOut) + '</pre></div></div>' +
        '<p style="margin:10px 0 0;font-size:.85rem"><a href="chuong' + f.chapter.id + '.html#bt-' + e.id.replace('.', '-') + '">Xem lại lý thuyết và lời giải của bài này →</a></p>';
      $('#result').innerHTML = '';
    }
    chSel.addEventListener('change', () => fillExercises(null));
    exSel.addEventListener('change', showInfo);
    fillExercises(exId);

    const codeEl = $('#code');
    codeEl.addEventListener('keydown', function (ev) {
      if (ev.key === 'Tab') {
        ev.preventDefault();
        const s = codeEl.selectionStart;
        codeEl.value = codeEl.value.slice(0, s) + '    ' + codeEl.value.slice(codeEl.selectionEnd);
        codeEl.selectionStart = codeEl.selectionEnd = s + 4;
      }
    });
    $('#clearBtn').addEventListener('click', function () { codeEl.value = ''; $('#result').innerHTML = ''; });

    const mssvEl = $('#mssv');
    try { mssvEl.value = localStorage.getItem('cpplab.mssv') || ''; } catch (e) { /* bỏ qua */ }

    function submit() {
      const mssv = mssvEl.value.trim().toUpperCase();
      const err = $('#mssvErr');
      err.textContent = '';
      if (!/^[A-Z0-9]{5,15}$/.test(mssv)) {
        err.textContent = 'Mã sinh viên gồm 5-15 chữ cái hoặc chữ số, không có dấu cách.';
        mssvEl.focus();
        return;
      }
      const code = codeEl.value;
      if (!code.trim()) {
        $('#result').innerHTML = '<div class="result bad"><h4>Chưa có mã nguồn</h4><p>Hãy dán lời giải vào ô bên trên rồi nộp lại.</p></div>';
        return;
      }
      const ex = D.findExercise(exSel.value).exercise;
      const r = G.grade(ex, code);
      const list = loadResults();
      list.push({ mssv: mssv, ex: ex.id, score: r.score, max: r.max, time: Date.now(), code: code });
      const saved = saveResults(list);
      try { localStorage.setItem('cpplab.mssv', mssv); } catch (e) { /* bỏ qua */ }

      const pct = Math.round((r.score / r.max) * 100);
      const cls = pct >= 70 ? 'good' : pct >= 50 ? 'mid' : 'bad';
      const color = pct >= 70 ? 'var(--teal)' : pct >= 50 ? 'var(--orange)' : 'var(--coral)';
      const rows = r.parts.map(function (p) {
        return '<li><span class="' + (p.ok ? 'ok' : 'no') + '">' + (p.ok ? '✔' : '✘') + '</span><span>' + esc(p.label) + '</span><span class="p">' + (p.ok ? '+' + p.pts : '0') + '/' + p.pts + '</span></li>';
      }).join('');
      const failed = r.parts.filter((p) => !p.ok).length;
      $('#result').innerHTML =
        '<div class="result ' + cls + '"><div class="score-head"><div class="ring" style="--p:' + pct + ';--c:' + color + '"><span>' + r.score + '</span></div>' +
        '<div><h4>Điểm: ' + r.score + ' / ' + r.max + ' · ' + r.band + '</h4><p>Mã SV <b>' + esc(mssv) + '</b> · Bài ' + ex.id + ' · ' + fmtTime(Date.now()) + '</p></div></div>' +
        '<ul class="checks">' + rows + '</ul>' +
        '<div class="note">' + (failed ? 'Còn ' + failed + ' tiêu chí chưa đạt. Hãy đối chiếu với đề bài, chỉnh sửa rồi nộp lại (hệ thống tính điểm cao nhất của mỗi bài).' : 'Chúc mừng, bạn đã đạt đủ các tiêu chí của bài này!') +
        (saved ? '' : ' (Không lưu được lịch sử vì trình duyệt chặn lưu trữ.)') + '</div></div>';
      renderHistory();
      $('#result').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    $('#submitBtn').addEventListener('click', submit);

    /* --- Bảng điểm --- */
    const modal = $('#modal');
    function renderHistory() {
      const list = loadResults();
      const mine = mssvEl.value.trim().toUpperCase();
      const view = list.filter((r) => !mine || r.mssv === mine).slice().reverse();
      const best = {};
      list.filter((r) => !mine || r.mssv === mine).forEach(function (r) {
        if (!best[r.ex] || r.score > best[r.ex]) best[r.ex] = r.score;
      });
      const total = D.CHAPTERS.reduce((s, c) => s + c.exercises.length, 0);
      const done = Object.keys(best).length;
      const sum = Object.keys(best).reduce((s, k) => s + best[k], 0);
      $('#summary').innerHTML =
        '<div class="pill"><b>' + (mine || 'Tất cả SV') + '</b><span>Đang xem</span></div>' +
        '<div class="pill"><b>' + done + ' / ' + total + '</b><span>Bài đã làm</span></div>' +
        '<div class="pill hi"><b>' + (Math.round((sum / total) * 100) / 100) + ' / 10</b><span>Điểm tổng kết (điểm cao nhất mỗi bài, TB 15 bài)</span></div>';
      if (!view.length) {
        $('#hist').innerHTML = '<p class="empty">Chưa có bài nộp nào' + (mine ? ' cho mã sinh viên ' + esc(mine) : '') + '.</p>';
        return;
      }
      $('#hist').innerHTML =
        '<table><thead><tr><th>Thời gian</th><th>Mã SV</th><th>Bài</th><th>Điểm</th><th>Mã nguồn</th></tr></thead><tbody>' +
        view.map(function (r) {
          const idx = list.indexOf(r);
          return '<tr><td>' + fmtTime(r.time) + '</td><td>' + esc(r.mssv) + '</td><td>Bài ' + esc(r.ex) + '</td>' +
            '<td class="sc ' + scClass(r.score, r.max) + '">' + r.score + ' / ' + r.max + '</td>' +
            '<td><button class="btn btn-line btn-sm" data-view="' + idx + '" type="button">Xem</button></td></tr>';
        }).join('') + '</tbody></table>';
      $$('[data-view]').forEach(function (b) {
        b.addEventListener('click', function () {
          const r = loadResults()[Number(b.dataset.view)];
          if (!r) return;
          $('#modalTitle').textContent = 'Mã SV ' + r.mssv + ' · Bài ' + r.ex + ' · ' + r.score + '/' + r.max;
          $('#modalCode').textContent = r.code;
          modal.classList.add('open');
        });
      });
    }
    $('#modalClose').addEventListener('click', () => modal.classList.remove('open'));
    modal.addEventListener('click', (ev) => { if (ev.target === modal) modal.classList.remove('open'); });
    mssvEl.addEventListener('input', renderHistory);

    $('#csvBtn').addEventListener('click', function () {
      const list = loadResults();
      if (!list.length) { alert('Chưa có dữ liệu để xuất.'); return; }
      const q = (v) => '"' + String(v).replace(/"/g, '""') + '"';
      const lines = ['MaSV,Bai,Diem,DiemToiDa,ThoiGian'].concat(
        list.map((r) => [q(r.mssv), q(r.ex), r.score, r.max, q(fmtTime(r.time))].join(','))
      );
      const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'bang-diem-cpp.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
    });
    $('#resetBtn').addEventListener('click', function () {
      if (confirm('Xóa toàn bộ lịch sử nộp bài trên trình duyệt này?')) {
        try { localStorage.removeItem(KEY); } catch (e) { /* bỏ qua */ }
        renderHistory();
      }
    });
    renderHistory();
  }

  /* ---------------- Khởi động ---------------- */
  document.addEventListener('DOMContentLoaded', function () {
    renderHeader();
    const page = document.body.dataset.page;
    if (page === 'home') renderHome();
    else if (page === 'chapter') renderChapter();
    else if (page === 'practice') renderPractice();
    renderFooter();
    bindCopy(document);
  });
})();

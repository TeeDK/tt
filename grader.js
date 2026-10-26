/*
 * Bộ chấm điểm tự động theo tiêu chí.
 * Trình duyệt không thể biên dịch/chạy C++, nên bài làm được chấm bằng cách phân tích mã nguồn:
 *   - 2 điểm cho cấu trúc chương trình hợp lệ (có #include, có main, ngoặc cân đối);
 *   - 8 điểm cho các tiêu chí riêng của từng bài (cấu trúc lệnh, công thức, thuật toán cần có).
 * Thang điểm: 10.
 */
(function (root) {
  'use strict';

  /** Xóa chú thích // và /* *\/ nhưng giữ nguyên nội dung chuỗi/ký tự. */
  function stripComments(src) {
    let out = '';
    let i = 0;
    const n = src.length;
    while (i < n) {
      const c = src[i];
      const d = src[i + 1];
      if (c === '"' || c === "'") {
        const q = c;
        out += c;
        i++;
        while (i < n && src[i] !== q && src[i] !== '\n') {
          if (src[i] === '\\') {
            out += src[i] + (src[i + 1] || '');
            i += 2;
            continue;
          }
          out += src[i++];
        }
        if (i < n && src[i] === q) out += src[i++];
        continue;
      }
      if (c === '/' && d === '/') {
        while (i < n && src[i] !== '\n') i++;
        continue;
      }
      if (c === '/' && d === '*') {
        i += 2;
        while (i < n && !(src[i] === '*' && src[i + 1] === '/')) i++;
        i += 2;
        out += ' ';
        continue;
      }
      out += c;
      i++;
    }
    return out;
  }

  /** Bỏ nội dung chuỗi/ký tự để kiểm tra ngoặc không bị nhiễu. */
  function stripLiterals(src) {
    return src
      .replace(/"(?:\\.|[^"\\\n])*"/g, '""')
      .replace(/'(?:\\.|[^'\\\n])*'/g, "''")
      .replace(/#\s*include\s*<[^>\n]*>/g, '');
  }

  function balanced(src) {
    const s = stripLiterals(src);
    const pairs = { ')': '(', ']': '[', '}': '{' };
    const stack = [];
    for (const ch of s) {
      if (ch === '(' || ch === '[' || ch === '{') stack.push(ch);
      else if (pairs[ch]) {
        if (stack.pop() !== pairs[ch]) return false;
      }
    }
    return stack.length === 0;
  }

  function band(score) {
    if (score >= 9) return 'Xuất sắc';
    if (score >= 7) return 'Tốt';
    if (score >= 5) return 'Đạt';
    return 'Chưa đạt';
  }

  function round1(x) {
    return Math.round(x * 10) / 10;
  }

  function testCheck(check, src) {
    if (check.min) {
      const flags = check.re.flags.indexOf('g') >= 0 ? check.re.flags : check.re.flags + 'g';
      const m = src.match(new RegExp(check.re.source, flags));
      return !!m && m.length >= check.min;
    }
    const flags = check.re.flags.replace('g', '');
    return new RegExp(check.re.source, flags).test(src);
  }

  /** Chấm một bài. Trả về {score, max, band, parts[], empty}. */
  function grade(exercise, code) {
    const src = stripComments(code || '');
    const checks = exercise.checks || [];
    const max = round1(2 + checks.reduce((s, c) => s + c.pts, 0));

    if (!src.trim()) {
      return { score: 0, max: max, band: band(0), parts: [], empty: true };
    }

    const parts = [];
    parts.push({
      label: 'Có #include và hàm main()',
      pts: 1,
      ok: /#\s*include/.test(src) && /\bmain\s*\(/.test(src)
    });
    parts.push({
      label: 'Dấu ngoặc (), [], {} cân đối',
      pts: 1,
      ok: /\bmain\s*\(/.test(src) && balanced(src)
    });
    checks.forEach(function (c) {
      parts.push({ label: c.label, pts: c.pts, ok: testCheck(c, src) });
    });

    const got = parts.reduce((s, p) => s + (p.ok ? p.pts : 0), 0);
    const score = round1(Math.min(got, max));
    return { score: score, max: max, band: band(score), parts: parts, empty: false };
  }

  const api = { grade: grade, stripComments: stripComments, balanced: balanced, band: band };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.GRADER = api;
})(typeof window !== 'undefined' ? window : globalThis);

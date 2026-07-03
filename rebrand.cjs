const fs = require('fs');
let content = fs.readFileSync('src/App.jsx', 'utf8');

// 1. Text Replacements
content = content.replace(/APEX 수학학원/g, '독獨하게 푸는 수학 교습소');
content = content.replace(/APEX는/g, '독獨하게 푸는 수학 교습소는');
content = content.replace(/WHY APEX/g, '학원 특징');
content = content.replace(/\(주\)에이펙스교육그룹/g, '독獨하게 푸는 수학 교습소');
content = content.replace(/APEX Math Academy/g, '독獨하게 푸는 수학 교습소');
content = content.replace(/APEX 대표 원장 소개/g, '독獨하게 푸는 수학 교습소 원장 소개');

// 2. Logo Header Replacement
const headerLogoOld = `<div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center font-bold text-lg shadow-lg border border-zinc-800">
                  Σ
                </div>
                <span className="font-display font-black text-xl tracking-wider text-zinc-900">
                  APEX <span className="text-amber-600 font-sans font-bold text-lg ml-0.5">MATH</span>
                </span>`;
const headerLogoNew = `<span className="font-display font-black text-xl tracking-wider text-rose-600 flex items-end">
                  독獨하게 <span className="text-zinc-500 font-sans font-bold text-lg mx-1">푸는</span> 수학
                  <span className="text-blue-700 font-sans font-bold text-xs ml-1 mb-0.5">교습소</span>
                </span>`;
content = content.replace(headerLogoOld, headerLogoNew);

// 3. Logo Footer Replacement
const footerLogoOld = `<div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center font-bold text-lg shadow-lg border border-zinc-800">
                    Σ
                  </div>
                  <span className="font-display font-black text-3xl tracking-wider text-zinc-900">
                    APEX <span className="text-amber-600 font-sans font-extrabold text-xl ml-1">수학학원</span>
                  </span>`;
const footerLogoNew = `<span className="font-display font-black text-3xl tracking-wider text-rose-600 flex items-end">
                    독獨하게 <span className="text-zinc-500 font-sans font-extrabold text-xl mx-1">푸는</span> 수학
                    <span className="text-blue-700 font-sans font-bold text-sm ml-1 mb-1">교습소</span>
                  </span>`;
content = content.replace(footerLogoOld, footerLogoNew);

// 4. Address & Phone Replacement
content = content.replace(/인천 계양구 효서로363번길 4-1 2층/g, '서울 구로구 개봉로2길 133-29 3층(개봉동)');

const contactOld = `<strong className="text-zinc-950 block font-black mb-0.5">대표 유선 상담 번호</strong>
                    <span className="text-amber-750 font-black text-lg font-display tracking-tight">032-555-7890</span>
                    <span className="text-zinc-505 block text-xs mt-0.5 font-bold">(전화 상담 가능 시간: 평일 오후 1시 ~ 10시)</span>`;
const contactNew = `<strong className="text-zinc-950 block font-black mb-0.5">상담 문의</strong>
                    <span className="text-amber-750 font-black text-lg font-display tracking-tight">010-2573-9744</span>
                    <span className="text-zinc-505 block text-xs mt-0.5 font-bold">내선: 02-2613-0101 (상담: 평일 오후 1시 ~ 10시)</span>`;
content = content.replace(contactOld, contactNew);

const footerInfoOld = `(주)에이펙스교육그룹 | 대표자: 강재신 원장<br />
                  주소: 인천 계양구 효서로363번길 4-1 2층<br />
                  사업자등록번호: 120-00-56789 | 학원등록번호: 계양 제2048호`;
const footerInfoNew = `독獨하게 푸는 수학 교습소 | 대표자: 강재신 원장<br />
                  주소: 서울 구로구 개봉로2길 133-29 3층(개봉동)<br />
                  대표번호: 010-2573-9744 | 내선: 02-2613-0101`;
content = content.replace(footerInfoOld, footerInfoNew);

// Fallback replacement for any remaining APEX 
content = content.replace(/APEX/g, '독獨하게 푸는 수학 교습소');

fs.writeFileSync('src/App.jsx', content);

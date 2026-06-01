const fs = require('fs');
let content = fs.readFileSync('src/App.jsx', 'utf8');

// Replace all zinc-955 with zinc-950 globally
content = content.replace(/zinc-955/g, 'zinc-950');

// Fix footer specifically
content = content.replace(
  '<footer className="bg-zinc-950 border-t border-zinc-900 text-zinc-300 py-16 px-6 mt-auto">',
  '<footer className="bg-white border-t border-zinc-200 text-zinc-600 py-16 px-6 mt-auto">'
);

content = content.replace(
  '<span className="font-display font-black text-3xl tracking-wider text-white">',
  '<span className="font-display font-black text-3xl tracking-wider text-zinc-900">'
);

content = content.replace(
  'APEX <span className="text-white font-sans font-extrabold text-xl ml-1">수학학원</span>',
  'APEX <span className="text-amber-600 font-sans font-extrabold text-xl ml-1">수학학원</span>'
);

content = content.replace(
  '<p className="text-xs text-zinc-400 font-bold leading-relaxed max-w-sm">',
  '<p className="text-xs text-zinc-500 font-bold leading-relaxed max-w-sm">'
);

content = content.replace(
  /<div className="text-xs text-zinc-400 font-bold">/g,
  '<div className="text-xs text-zinc-500 font-bold">'
);

content = content.replace(
  /<h5 className="text-white font-bold text-sm">/g,
  '<h5 className="text-zinc-900 font-bold text-sm">'
);

content = content.replace(
  /text-zinc-400 hover:text-white/g,
  'text-zinc-600 hover:text-zinc-900'
);

fs.writeFileSync('src/App.jsx', content);

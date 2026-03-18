const fs = require('fs');
const path = require('path');
const HIST = 'C:/Users/works/AppData/Roaming/Code/User/History';
const folders = fs.readdirSync(HIST);

for (const f of folders) {
  const ep = path.join(HIST, f, 'entries.json');
  if (fs.existsSync(ep) === false) continue;
  try {
    const d = JSON.parse(fs.readFileSync(ep, 'utf8'));
    const res = decodeURIComponent(d.resource || '');
    if (res.includes('designer/packages/page.tsx') && res.indexOf('[id]') === -1) {
      console.log('FOLDER:', f);
      const entries = (d.entries || []).sort((a, b) => a.timestamp - b.timestamp);
      entries.forEach((e, i) => {
        console.log(i, e.id, '|', new Date(e.timestamp).toLocaleString(), '|', String(e.source || '').slice(0, 80));
      });
    }
  } catch (e) {}
}

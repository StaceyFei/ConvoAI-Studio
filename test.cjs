const https = require('https');
https.get('https://www.volcengine.com/docs/6348/2123348?lang=zh', { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const idx = data.indexOf('"DocumentID":2123348');
    if (idx > -1) {
      const contentStr = data.substring(idx).match(/"Content":"(.*?)","ContentType"/);
      if (contentStr) {
         const decoded = contentStr[1].replace(/\\\\/g, '\\').replace(/\\"/g, '"');
         try {
           const parsed = JSON.parse(decoded);
           let text = '';
           for (const key in parsed.data) {
             if (parsed.data[key].ops) {
               parsed.data[key].ops.forEach(op => {
                 if (typeof op.insert === 'string') text += op.insert;
               });
             }
           }
           console.log(text.substring(0, 3000));
         } catch(e) { console.log('Parse error', e); }
      }
    }
  });
});

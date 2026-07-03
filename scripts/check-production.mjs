import https from 'node:https';

const targets = [
  'https://conectavacantes.vercel.app',
  'https://conectavacantes.vercel.app/api/health'
];

const check = async (url) => {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        resolve({ status: res.statusCode, body });
      });
    }).on('error', reject);
  });
};

for (const target of targets) {
  try {
    const result = await check(target);
    console.log(`${target} -> ${result.status}`);
    console.log(result.body.slice(0, 300));
  } catch (error) {
    console.error(`${target} -> ERROR: ${error.message}`);
  }
}

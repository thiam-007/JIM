import https from 'https';

const url = 'https://vxbaqwyotalslelyhlxs.supabase.co/storage/v1/object/public/actualites/bf08ebf6-fe09-4f67-9ae7-db5609826308.jpeg';

https.get(url, (res) => {
  console.log('Status Code:', res.statusCode);
  console.log('Headers:', JSON.stringify(res.headers, null, 2));

  let chunks = [];
  res.on('data', (chunk) => chunks.push(chunk));
  res.on('end', () => {
    const buffer = Buffer.concat(chunks);
    console.log('Buffer size:', buffer.length);
    console.log('First 20 bytes (hex):', buffer.slice(0, 20).toString('hex'));
  });
}).on('error', (err) => {
  console.error('Error:', err);
});

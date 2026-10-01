import https from 'https';

const token = process.env.GITHUB_TOKEN;
const options = {
  hostname: 'api.github.com',
  path: '/repos/Sabharivarshan111/gmck/releases?per_page=10',
  method: 'GET',
  headers: {
    'User-Agent': 'Node.js',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    'Accept': 'application/vnd.github+json'
  }
};

const req = https.request(options, (res) => {
  let body = '';
  res.on('data', (d) => body += d);
  res.on('end', () => {
    try {
      const releases = JSON.parse(body);
      if (Array.isArray(releases)) {
        releases.forEach(r => console.log(`Tag: ${r.tag_name} | Name: ${r.name} | Pre-release: ${r.prerelease} | ID: ${r.id}`));
      } else {
        console.log(releases);
      }
    } catch (e) {
      console.error(e);
    }
  });
});
req.on('error', (e) => console.error(e));
req.end();

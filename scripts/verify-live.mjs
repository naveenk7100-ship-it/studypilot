const url = 'https://naveenk7100-ship-it.github.io/studypilot/';
console.log('Fetching live GitHub Pages URL:', url);

async function verify() {
  const res = await fetch(url);
  console.log('GET /studypilot/ HTTP Status:', res.status, res.statusText);
  const text = await res.text();
  console.log('HTML Document length:', text.length);
  console.log('Contains StudyPilot title:', text.includes('StudyPilot'));
  console.log('Contains /studypilot/ base assets:', text.includes('/studypilot/assets/index'));

  // Extract assets
  const cssMatch = text.match(/\/studypilot\/assets\/index-[^"']+\.css/);
  const jsMatch = text.match(/\/studypilot\/assets\/index-[^"']+\.js/);

  if (cssMatch) {
    const cssUrl = 'https://naveenk7100-ship-it.github.io' + cssMatch[0];
    const cssRes = await fetch(cssUrl);
    const cssBody = await cssRes.text();
    console.log(`CSS asset (${cssMatch[0]}):`, cssRes.status, 'size:', cssBody.length);
  }

  if (jsMatch) {
    const jsUrl = 'https://naveenk7100-ship-it.github.io' + jsMatch[0];
    const jsRes = await fetch(jsUrl);
    const jsBody = await jsRes.text();
    console.log(`JS bundle (${jsMatch[0]}):`, jsRes.status, 'size:', jsBody.length);
  }

  // Check 404.html SPA route
  const spaRes = await fetch('https://naveenk7100-ship-it.github.io/studypilot/404.html');
  console.log('SPA 404.html route:', spaRes.status, 'size:', (await spaRes.text()).length);

  // Check subroute like /tutor or /flashcards
  const tutorRes = await fetch('https://naveenk7100-ship-it.github.io/studypilot/tutor');
  console.log('SPA route /studypilot/tutor:', tutorRes.status, '(serves 404.html for client redirection)');
}

verify().catch(e => {
  console.error('Verification failed:', e);
  process.exit(1);
});

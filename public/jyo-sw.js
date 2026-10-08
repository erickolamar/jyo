/* Only deliberately downloaded, licensed content is stored offline. */
const SHELL='jyo-offline-shell-v1',PACKAGES='jyo-offline-files-v1';
self.addEventListener('install',event=>event.waitUntil(caches.open(SHELL).then(c=>c.addAll(['/offline.html','/offline.js','/favicon.svg'])).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);if(url.origin!==self.location.origin||event.request.method!=='GET')return;
 if(url.pathname.startsWith('/signout-with-chatgpt')){event.respondWith((async()=>{await caches.delete(PACKAGES);return fetch(event.request)})());return}
 if(['/offline.html','/offline.js','/favicon.svg'].includes(url.pathname)){event.respondWith(fetch(event.request).catch(async()=>await caches.match(url.pathname)||Response.error()));return}
 if(event.request.mode==='navigate'&&!url.pathname.startsWith('/api/')&&!url.pathname.startsWith('/signin-'))event.respondWith(fetch(event.request).catch(async()=>await caches.match('/offline.html')||Response.error()));
});

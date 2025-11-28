Attila RA. <racz.akacosi@gmail.com>
	
10:18 (0 perccel ezelőtt)
	
	
címzett: én

Ez egy klasszikus probléma a scraping világában. A Playwright + Chromium kombó "ágyúval verébre" módszer, de sajnos a modern védelem (Cloudflare, Akamai, Datadome) miatt sokszor ez az egyetlen működő ágyú.

Íme a technikai mélyfúrás arról, hogy miért működik a Chromium, és milyen könnyűsúlyú alternatíváid vannak.

Miért engedi át a Cloudflare a Chromiumot? (A "Titkos Szósz")

A Cloudflare nem csak egy dolgot néz, hanem egy összetett ujjlenyomatot (fingerprint) vizsgál. A "sima" HTTP kliensek (mint a Python requests vagy axios) elvéreznek, mert hiányzik belőlük a böngészők komplexitása.

A Chromium 3 fő szinten hitelesíti magát, amit egy saját "mini-böngészővel" emulálni pokoli nehéz:

1. TLS Fingerprinting (JA3/JA4) – Az alacsony szint

Mielőtt bármilyen adat átmenne, megtörténik a TLS Handshake. A Cloudflare már itt kiszűri a botok 90%-át.

    Mit néznek? A titkosítási algoritmusok (Ciphers), a TLS verziók és a kiterjesztések sorrendjét.

    A probléma: A Python SSL könyvtárának (OpenSSL) teljesen más a sorrendje és a "szava járása", mint a Chrome-nak (BoringSSL). A Cloudflare ránéz a handshake-re, és azt mondja: "Ez nem Chrome, ez egy Python script -> BLOKK."

2. JavaScript Execution & Environment

Ha a TLS-en átjutottál, jön a JavaScript kihívás (pl. Turnstile vagy a láthatatlan "Just a moment...").

    Mit csinál a Chromium? Futtatja a Cloudflare obfuszkált (összekuszált) JavaScript kódját. Ez a kód ellenőrzi a környezetet:

        Létezik-e a window.navigator?

        Van-e webdriver flag (ez árulja el a botokat)?

        Megfelelő-e a screen.width és a window.innerWidth aránya?

        Képes-e a böngésző canvas-t renderelni (grafikus ujjlenyomat)?

    Miért CPU intenzív? Mert ehhez egy teljes V8 JavaScript motort kell futtatni, ami ugyanaz, ami a Node.js-t hajtja, plusz a DOM (Document Object Model) felépítését.

3. HTTP/2 Fingerprinting

A modern böngészők HTTP/2-t használnak, speciális frame-sorrenddel és header tömörítéssel (HPACK). Ha a te kliensed HTTP/1.1-et beszél, vagy a HTTP/2 implementációja eltér a Chrome-étól, az gyanús.

Csinálhatsz "saját, lightweight böngészőt"?

Röviden: Nem éri meg, és technikailag majdnem lehetetlen.

Ahhoz, hogy átmenj a Cloudflare JS kihívásán, szükséged van:

    Egy JavaScript motorra (mint a V8 vagy SpiderMonkey).

    Egy Layout engine-re (hogy a JS tudja, hol vannak az elemek az oldalon, mert a védelem nézi az egérmozgást és a kattintásokat).

Ha ezt mind összerakod, gyakorlatilag újraírtad a Chromiumot, és ugyanúgy CPU-igényes lesz. A "könnyűsúlyú" megoldások (pl. JSDOM) nem futtatják elég pontosan a komplex JS-t, így a Cloudflare azonnal kiszúrja őket.

A Megoldás: Könnyűsúlyú Alternatívák

Ha a CPU a szűk keresztmetszet, két irányba indulhatsz el: a TLS-Spoofing (ha nincs kemény JS challenge) vagy a Chromium optimalizálása.

1. Az "Arany Középút": TLS-Spoofing Kliensek (Low CPU)

Ezek nem böngészők, hanem okos HTTP kliensek, amik hazudnak. Úgy építik fel a TLS handshake-et és a HTTP/2 kereteket, hogy a Cloudflare azt higgye, Chrome-mal beszél. Nem futtatnak JS-t (vagy csak nagyon keveset), így a CPU igényük minimális.

    Python: curl_cffi (Ez a legjobb tipped!)

    Ez egy Python wrapper a curl-impersonate köré. Képes pontosan emulálni a Chrome TLS ujjlenyomatát.
    Python

    from curl_cffi import requests

    # Ez úgy néz ki a Cloudflare-nek, mint egy Chrome 110-es böngésző
    response = requests.get(
        "https://target-site.com",
        impersonate="chrome110"
    )

    Előny: 100x gyorsabb és kevesebb CPU, mint a Playwright.

    *Hátrány: Ha az oldal aktív JS interakciót kér (pl. kattintani kell valamire a betöltés után), ez kevés lehet.

    Go: tls-client

    Ha nyitott vagy a Go nyelvre, ez a jelenlegi ipari standard a nagy teljesítményű scrapinghez.

2. Playwright Optimalizálása (Ha muszáj a böngésző)

Ha a curl_cffi nem működik (mert az oldal SPA - Single Page Application, vagy nagyon durva JS ellenőrzése van), akkor marad a Playwright, de fogyókúrára fogva:

    Resources Blokkálása: Ne tölts be képeket, CSS-t, fontokat. A Cloudflare JS-hez ezek nem kellenek, de a CPU-t eszik.
    JavaScript

    await page.route('**/*', (route) => {
      const type = route.request().resourceType();
      if (['image', 'stylesheet', 'font', 'media'].includes(type)) {
        return route.abort();
      }
      return route.continue();
    });

    New Headless Mode: Használd a --headless=new kapcsolót. A régi headless mód könnyen detektálható volt és lassabb.

    Stealth Plugin: Használd a playwright-stealth csomagot, hogy elrejtsd a webdriver flag-et, így nem buksz le azonnal.

Összegzés: Mit válassz?

Megoldás	CPU Igény	Cloudflare Átjutás	Mikor használd?
curl_cffi (Python)	⭐ (Alacsony)	⭐⭐⭐ (Jó)	Ha csak az adat kell a HTML-ből vagy API-ból, és nincs durva JS kattintgatás. Ezzel kezdd!
Playwright (Opt.)	⭐⭐⭐ (Közepes)	⭐⭐⭐⭐ (Nagyon jó)	Ha a curl_cffi elhasal, de optimalizálod (képek tiltása).
Saját "mini-böngésző"	💀 (Magas)	⭐ (Rossz)	Soha. Túl nagy munka, rossz eredmény.


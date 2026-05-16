const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
    
    // Wait a bit for map to render
    await new Promise(r => setTimeout(r, 2000));
    
    const data = await page.evaluate(() => {
        const results = [];
        // Check light DOM
        const gmElements = document.querySelectorAll('[class*="gm-"]');
        results.push(`Light DOM .gm- elements: ${gmElements.length}`);
        gmElements.forEach(el => results.push(`- ${el.className} (right: ${getComputedStyle(el).right}, bottom: ${getComputedStyle(el).bottom})`));
        
        // Check shadow DOMs
        const map3d = document.querySelector('gmp-map-3d');
        results.push(`gmp-map-3d found: ${!!map3d}`);
        if (map3d) {
            results.push(`shadowRoot available: ${!!map3d.shadowRoot}`);
            if (map3d.shadowRoot) {
                const shadowGm = map3d.shadowRoot.querySelectorAll('[class*="gm-"], div');
                results.push(`Shadow DOM elements: ${shadowGm.length}`);
                let rightAligned = 0;
                shadowGm.forEach(el => {
                    const style = getComputedStyle(el);
                    if (style.right === '0px' || style.right === '10px' || parseInt(style.right) < 50) {
                        rightAligned++;
                        results.push(`- Shadow element: ${el.tagName} ${el.className} (right: ${style.right}, bottom: ${style.bottom}, position: ${style.position})`);
                    }
                });
            }
        }
        return results;
    });
    
    console.log(data.join('\n'));
    await browser.close();
})();

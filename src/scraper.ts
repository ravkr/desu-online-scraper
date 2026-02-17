import puppeteer from 'puppeteer';
import {readFile, writeFile, mkdir} from "node:fs/promises";

const browser = await puppeteer.launch({
    browser: "firefox",
    headless: false
});

const DOMAIN = 'https://desu-online.pl/'
const SITEMAP_PATH = `sitemap_index.xml`

async function getCachedFile(path: string) {
    const cachePath = `./cache/${path}`;
    try {
        const data = await readFile(cachePath, 'utf-8');
        console.log(`Cache hit for ${path}`);
        return data;
    } catch (err) {
        console.log(`Cache miss for ${path}`);
        return null;
    }
}

async function downloadFile(filepath: string, saveCache: boolean = true) {
    const page = await browser.newPage();

    await page.setViewport({width: 1080, height: 1024});

    const response = await page.goto(`${DOMAIN}/${filepath}`);

    const data = await response!.text();
    console.log(`Got ${filepath}`);

    await page.close();

    if (saveCache) {
        const cachePath = `./cache/${filepath}`;
        await mkdir(`./cache`, {recursive: true});
        await writeFile(cachePath, data, 'utf-8');
    }

    return data;
}

async function getFile(path: string) {
    const cachedData = await getCachedFile(path);
    if (cachedData) {
        return cachedData;
    }

    return downloadFile(path, true);
}

async function main() {
    const sitemapText = await getFile(SITEMAP_PATH)

    console.log(sitemapText);
}

await main()

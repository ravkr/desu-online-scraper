import puppeteer from 'puppeteer';
import {readFile, writeFile, mkdir} from "node:fs/promises";
import {XMLParser} from "fast-xml-parser";

import {setTimeout} from "node:timers/promises";

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

    await page.setViewport(null);

    const response = await page.goto(`${DOMAIN}${filepath}`);

    // ProtocolError: Protocol error (network.getData): unknown error RangeError: source array is too long decodeResponseChunks@resource://devtools/shared/network-observer/NetworkUtils.sys.mjs:803:11
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

const sitemapQueue: string[] = [
    SITEMAP_PATH,
];

const foundUrls: Map<string, string[]> = new Map();

function getSitemapCategory(sitemapName: string) {
    const match = sitemapName.match(/^(.*?)-sitemap\d*\.xml$/);
    if (match) {
        return match[1];
    }
    return 'unknown';
}

function parseSitemap(sitemapName: string, result: any) {
    if (result.sitemapindex) {
        const sitemaps = result.sitemapindex.sitemap;
        for (const sitemap of sitemaps) {
            const loc = sitemap.loc;
            const path = loc.replace(DOMAIN, '');
            sitemapQueue.push(path);
            console.log(`Found sitemap: ${loc}`);
        }
    } else if (result.urlset) {
        const urls = result.urlset.url;
        const category = getSitemapCategory(sitemapName);
        const array = foundUrls.get(category) || [];
        foundUrls.set(category, array);

        for (const url of urls) {
            array.push(url.loc);
        }
    } else {
        console.warn('Unknown sitemap format');
    }
}

async function main() {

    let nextItem: string | undefined;
    while (nextItem = sitemapQueue.shift()) {
        console.log(`Processing ${nextItem}`);
        const sitemapText = await getFile(nextItem)

        const parser = new XMLParser({
            ignoreAttributes: false,
        });
        const result = parser.parse(sitemapText);
        parseSitemap(nextItem, result)
    }

    for (const [category, urls] of foundUrls.entries()) {
        console.log(`Category: ${category}, URLs: ${urls.length}`);
    }
}

async function main2() {
    const url = 'https://desu-online.pl/shingeki-no-kyojin-odcinek-1/'
    const page = await browser.newPage();

    await page.setViewport(null);

    const response = await page.goto(url);
    const data = await response!.text();
    console.log(data);

    await page.close();
}

const browser = await puppeteer.launch({
    // TODO: nie można użyć Firefoxa, bo:
    // ProtocolError: Protocol error (network.getData): unknown error RangeError: source array is too long decodeResponseChunks@resource://devtools/shared/network-observer/NetworkUtils.sys.mjs:803:11
    // browser: "firefox",
    headless: false,
});

// await main()


await main2()

await browser.close()

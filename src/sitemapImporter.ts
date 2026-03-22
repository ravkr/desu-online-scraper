import {config} from "./config.js";
import {AppDataSource} from "./database/database.js";
import {PageEntity} from "./database/entities/PageEntity.js";
import {XMLParser} from "fast-xml-parser";
import {BrowserController} from "./browser/BrowserController.js";
import {getFile} from "./browser/fileDownloadUtils.js";

const sitemapQueue: string[] = [
    config.sitemapPath,
];

const foundUrls: Map<string, { url: string, lastModified: string }[]> = new Map();

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
            const path = loc.replace(config.domain, '');
            sitemapQueue.push(path);
            console.log(`Found sitemap: ${loc}`);
        }
        return
    }

    if (result.urlset) {
        const urls = result.urlset.url;
        const category = getSitemapCategory(sitemapName);
        const array = foundUrls.get(category) || [];
        foundUrls.set(category, array);

        for (const url of urls) {
            array.push({
                url: url.loc,
                lastModified: url.lastmod
            });
        }
        return;
    }

    console.warn('Unknown sitemap format');
}

async function main() {
    const bc = BrowserController.getInstance()
    await bc.openBrowser()

    let nextItem: string | undefined;
    while (nextItem = sitemapQueue.shift()) {
        const sitemapText = await getFile(nextItem)

        const parser = new XMLParser({
            ignoreAttributes: false,
        });
        const result = parser.parse(sitemapText);
        parseSitemap(nextItem, result)
    }

    const pageRepository = AppDataSource.getRepository(PageEntity);

    console.time('Saving entries to database');
    for (const [category, pages] of foundUrls.entries()) {
        for (const page of pages) {
            try {
                await pageRepository.upsert(
                    {
                        url: page.url,
                        sitemapSource: category,
                        sitemapLastModified: page.lastModified !== undefined
                            ? new Date(page.lastModified)
                            : null,
                    },
                    ['url']
                );
            } catch (err) {
                console.error(`Error saving page`, category, page);
            }
        }
    }
    console.timeEnd('Saving entries to database');

    await bc.closeBrowser()
}

await main()

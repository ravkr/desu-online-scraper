import 'reflect-metadata';

import { PageEntity } from './database/entities/PageEntity.js';
import { AppDataSource } from './database/database.js';
import { BrowserController } from './browser/BrowserController.js';
import { YoastArticleTag, YoastSeo } from './types/YoastSeo.types.js';
import { EpisodeData } from './types/EpisodeData.type.js';
import { EpisodeEntity } from './database/entities/EpisodeEntity.js';
import { EpisodeSource } from './database/entities/EpisodeSource.js';
import { SourceStatus } from './database/SourceStatus.js';


async function scrapeEpisodePage() {
  const url = 'https://desu-online.pl/shingeki-no-kyojin-odcinek-1/';
  const bc = BrowserController.getInstance();
  await bc.openBrowser();

  const page = await bc.newPage();

  await page.setViewport(null);

  await page.setRequestInterception(true);
  page.on('request', interceptedRequest => {
    if (interceptedRequest.isInterceptResolutionHandled()) return;

    if (interceptedRequest.isNavigationRequest() && interceptedRequest.frame() === page.mainFrame()) {
      interceptedRequest.continue();

      return;
    }

    if (interceptedRequest.url().startsWith('data:image/')) {
      interceptedRequest.continue();

      return;
    }

    interceptedRequest.abort();
  });

  await page.goto(url);

  const resultObj = await page.evaluate('[...document.querySelectorAll(\'div.video-nav div.mobius select.mirror option[data-index]\')].map(el => ({code: atob(el.value), index: el.dataset.index, name: el.text}))');

  const yoastSeoString = await page.evaluate('document.querySelector(\'script[type="application/ld+json"].yoast-schema-graph\')?.textContent;') as string;

  const yoastSeo = JSON.parse(yoastSeoString) as YoastSeo;

  const articleTag = yoastSeo['@graph'].find((el: any) => el['@type'] === 'Article') as YoastArticleTag | undefined;

  const imageUrl = await page.evaluate('document.querySelector(\'meta[property="og:image"]\')?.content;') as string;

  const wpPageId = parseInt(await page.evaluate('document.querySelector(\'link[rel="alternate"][type="application/json"]\').href.match(/posts\\/(\\d+)$/)?.[1];') as string);

  const animeSeriesUrl = await page.evaluate('document.querySelector(\'div.lm > span.year > a\').href;') as string;
  const animeSeriesName = animeSeriesUrl.match(/anime\/([^/]+)\//)?.[1];

  const episodeData : EpisodeData = {
    title: articleTag?.headline || '',
    author: articleTag?.author?.name || '',
    datePublished: articleTag?.datePublished ? new Date(articleTag.datePublished) : undefined,
    dataModified: articleTag?.dateModified ? new Date(articleTag.dateModified) : undefined,
    seriesName: animeSeriesName,
    imageUrl,
    wpPageId
  } as EpisodeData;

  console.log(episodeData);

  await saveEpisodeData(url, episodeData, resultObj as any);

  await page.close();
  await bc.closeBrowser();
}

export function extractMirrorUrl(code: string): string | null {
  const match = code.match(/src=["']([^"']+)["']/i);

  return match ? match[1] : null;
}

async function saveEpisodeData(
  url: string,
  episodeData: EpisodeData,
  mirrors: {code: string, index: string, name: string}[]
) {
  await AppDataSource.transaction(async (manager) => {
    const pageRepository = manager.getRepository(PageEntity);
    const episodeRepository = manager.getRepository(EpisodeEntity);
    const sourceRepository = manager.getRepository(EpisodeSource);

    let pageEntity = await pageRepository.findOneBy({ url });

    if (!pageEntity) {
      console.warn(`Page with URL ${url} not found in database. Creating new entry.`);
      pageEntity = pageRepository.create({
        url,
        sitemapSource: 'unknown',
        sitemapLastModified: null
      });
      await pageRepository.save(pageEntity);
    }

    const result = await episodeRepository.upsert(
      {
        title: episodeData.title,
        pageId: pageEntity.id,
        wpPageId: episodeData.wpPageId,
        author: episodeData.author || null,
        datePublished: episodeData.datePublished || null,
        dateModified: episodeData.dataModified || null,
        seriesName: episodeData.seriesName,
        imageUrl: episodeData.imageUrl || null,
        pageEntity
      } as any,
      ['wpPageId']
    );

    console.log('result.identifiers', result.identifiers);

    const episode = await episodeRepository.findOneByOrFail({ wpPageId: episodeData.wpPageId });

    if (mirrors.length > 0) {
      const mirrorRows = mirrors.map((mirror) => ({
        episode,
        code: mirror.code,
        index: mirror.index,
        name: mirror.name,
        url: extractMirrorUrl(mirror.code),
        status: SourceStatus.UNKNOWN,
        lastCheckedAt: null
      }));

      await sourceRepository.upsert(mirrorRows as any, ['episode', 'code']);
    }

    console.log(`Saved episode ${episodeData.wpPageId} with ${mirrors.length} mirrors.`);
  });
}

await scrapeEpisodePage();

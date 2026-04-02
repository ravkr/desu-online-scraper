import 'reflect-metadata';

import { PageEntity } from './database/entities/PageEntity.js';
import { AppDataSource } from './database/database.js';
import { BrowserController } from './browser/BrowserController.js';
import { YoastArticleTag, YoastSeo } from './types/YoastSeo.types.js';
import { EpisodeData } from './types/EpisodeData.type.js';
import { EpisodeEntity } from './database/entities/EpisodeEntity.js';
import { EpisodeSourceEntity } from './database/entities/EpisodeSourceEntity.js';
import { SeriesEntity } from './database/entities/SeriesEntity.js';
import { ImageEntity } from './database/entities/ImageEntity.js';
import { SourceStatus } from './database/SourceStatus.js';
import { setTimeout } from 'node:timers/promises';
import { Page } from 'puppeteer';
import { handleAgeGate } from './browser/ageGateHandler.js';

type EpisodeMirror = {
  code: string;
  index: string;
  name: string;
};

async function getEpisodeNumber(page: Page, wpId: number): Promise<number> {
  // Getting episode number from URL is not reliable,
  // as sometimes "episode 7" might have "...-odcinek-6-2" instead of "...-odcinek-7".
  // Instead, we're getting position from list with all episodes. This list is sorted in reverse order.
  return await page.evaluate((dataId) => {
    const el = document.querySelector(`li[data-id="${dataId}"]`);

    if (!el || !el.parentElement) {
      throw new Error('Could not find episode number from episodes list.');
    }

    const children = Array.from(el.parentElement.children);

    return children.length - children.indexOf(el);
  }, wpId);
}

async function scrapeEpisodePage(url: string) {
  const bc = BrowserController.getInstance();

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
  await handleAgeGate(page);

  const episodeMirrors = await page.evaluate('[...document.querySelectorAll(\'div.video-nav div.mobius select.mirror option[data-index]\')].map(el => ({code: atob(el.value), index: el.dataset.index, name: el.text}))') as EpisodeMirror[];

  if (!episodeMirrors || episodeMirrors.length === 0) {
    console.warn(`No mirrors found for ${url}`);
    throw new Error(`No mirrors found for ${url}`);
  }

  const yoastSeoString = await page.evaluate('document.querySelector(\'script[type="application/ld+json"].yoast-schema-graph\')?.textContent;') as string;

  const yoastSeo = JSON.parse(yoastSeoString) as YoastSeo;

  const articleTag = yoastSeo['@graph'].find((el: any) => el['@type'] === 'Article') as YoastArticleTag | undefined;

  const imageUrl = await page.evaluate('document.querySelector(\'meta[property="og:image"]\')?.content;') as string;

  const wpPageId = parseInt(await page.evaluate('document.querySelector(\'link[rel="alternate"][type="application/json"]\').href.match(/posts\\/(\\d+)$/)?.[1];') as string);

  const animeSeriesUrl = await page.evaluate('document.querySelector(\'div.lm > span.year > a\').href;') as string;
  const animeSeriesName = animeSeriesUrl.match(/anime\/([^/]+)\//)?.[1];

  const episodeNumberName = await page.evaluate(() => {
    const content = document.querySelector('meta[itemprop="episodeNumber"]')?.getAttribute('content')?.trim();

    if (!content) {
      return null;
    }

    return content;
  });

  const episodeNumber = await getEpisodeNumber(page, wpPageId);

  if (!Number.isInteger(episodeNumber) || episodeNumber <= 0) {
    throw new Error(`Invalid episode number for ${url}`);
  }

  const normalizedEpisodeNumberName = typeof episodeNumberName === 'string' && episodeNumberName.trim().length > 0
    ? episodeNumberName.trim()
    : String(episodeNumber);

  const episodeData : EpisodeData = {
    title: articleTag?.headline || '',
    author: articleTag?.author?.name || '',
    datePublished: articleTag?.datePublished ? new Date(articleTag.datePublished) : undefined,
    dataModified: articleTag?.dateModified ? new Date(articleTag.dateModified) : undefined,
    seriesName: animeSeriesName,
    seriesTitle: articleTag?.articleSection?.[0],
    imageUrl,
    wpPageId,
    episodeNumber,
    episodeNumberName: normalizedEpisodeNumberName
  } as EpisodeData;

  await saveEpisodeData(url, episodeData, episodeMirrors);

  await page.close();
}

export function extractMirrorUrl(code: string): string | null {
  const match = code.match(/src=["']([^"']+)["']/i);

  return match ? match[1] : null;
}

async function saveEpisodeData(
  url: string,
  episodeData: EpisodeData,
  mirrors: EpisodeMirror[]
) {
  await AppDataSource.transaction(async (manager) => {
    const pageRepository = manager.getRepository(PageEntity);
    const episodeRepository = manager.getRepository(EpisodeEntity);
    const sourceRepository = manager.getRepository(EpisodeSourceEntity);
    const seriesRepository = manager.getRepository(SeriesEntity);
    const imageRepository = manager.getRepository(ImageEntity);

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

    if (!episodeData.seriesName) {
      throw new Error(`Series name not found for ${url}`);
    }

    const normalizedSeriesTitle = episodeData.seriesTitle?.trim() || null;
    let seriesEntity = await seriesRepository.findOneBy({ seriesName: episodeData.seriesName });

    if (!seriesEntity) {
      seriesEntity = await seriesRepository.save(seriesRepository.create({
        seriesName: episodeData.seriesName,
        seriesTitle: normalizedSeriesTitle
      }));
    } else if (normalizedSeriesTitle && seriesEntity.seriesTitle !== normalizedSeriesTitle) {
      seriesEntity.seriesTitle = normalizedSeriesTitle;
      seriesEntity = await seriesRepository.save(seriesEntity);
    }

    let imageEntity: ImageEntity | null = null;

    if (episodeData.imageUrl) {
      imageEntity = await imageRepository.findOneBy({ url: episodeData.imageUrl });

      if (!imageEntity) {
        imageEntity = await imageRepository.save(imageRepository.create({
          url: episodeData.imageUrl
        }));
      }
    }

    const result = await episodeRepository.upsert(
      {
        title: episodeData.title,
        pageId: pageEntity.id,
        wpPageId: episodeData.wpPageId,
        episodeNumber: episodeData.episodeNumber,
        episodeNumberName: episodeData.episodeNumberName,
        author: episodeData.author || null,
        datePublished: episodeData.datePublished || null,
        dateModified: episodeData.dataModified || null,
        seriesId: seriesEntity.id,
        imageId: imageEntity?.id || null,
        pageEntity
      } as any,
      ['wpPageId']
    );

    const episodeId = result.identifiers[0].id;

    if (mirrors.length > 0) {
      const mirrorRows = mirrors.map((mirror) => ({
        episode: { id: episodeId },
        code: mirror.code,
        index: mirror.index,
        name: mirror.name,
        url: extractMirrorUrl(mirror.code),
        status: SourceStatus.UNKNOWN,
        lastCheckedAt: null
      }));

      await sourceRepository.upsert(mirrorRows as any, ['episode', 'code']);
    }

    console.log(`Saved episode "${url}" (${episodeData.wpPageId}) with ${mirrors.length} mirrors.`);
  });
}

export async function getPagesToScrape(limit?: number): Promise<string[]> {
  if (limit !== undefined && limit <= 0) {
    return [];
  }

  const pageRepository = AppDataSource.getRepository(PageEntity);

  const query = pageRepository
    .createQueryBuilder('page')
    .leftJoin(EpisodeEntity, 'episodes', 'episodes."pageId" = page.id')
    .where(`episodes.id IS NULL AND page."sitemapSource" = 'post' AND page.skip IS NOT TRUE`)
    .orderBy('page.url', 'ASC')
    .select('page.url', 'url')
    .limit(limit);

  // console.log('query', query.getQuery(), query.getParameters());
  const rows = await query.getRawMany<{ url: string }>();

  return rows.map((row) => row.url);
}

async function scrapePages() {
  const bc = BrowserController.getInstance();
  await bc.openBrowser();

  const pages = await getPagesToScrape(100);

  for (const page of pages) {
    try {
      await scrapeEpisodePage(page);
    } catch (e) {
      console.error(e);
      await setTimeout(1000 * 60 * 60); // 1h
    }
  }

  await bc.closeBrowser();
}

await scrapePages();

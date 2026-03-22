# Desu Online scraper

## Prerequisites

```bash
npx puppeteer browsers install firefox
```

- PostgreSQL running locally (`localhost:5432`) with credentials from `src/database/database.ts`
- Database/user initialized, e.g. with `sql/init.sql`

## Importing sitemap
```bash
npm run import-sitemap
```

Imports URLs from Desu Online sitemap files into the `pages` table.

What it does:
- starts Puppeteer through `BrowserController`
- begins with `sitemap_index.xml` (`config.sitemapPath` in `src/config.ts`)
- recursively loads referenced sitemap files
- groups URLs by sitemap category (e.g. `post`, `anime`, `cast`)
- upserts records into PostgreSQL (`url`, `sitemapSource`, `sitemapLastModified`)

Input/output:
- input: sitemap XML files from `https://desu-online.pl/`
- cache: downloaded XML files are stored in `cache/`
- output: saved/updated rows in `pages`

## Scraping video sources
```bash
npm run start-scraper
```

Runs `src/scraper.ts`.

Current behavior:
- the example scraping function (`main2`) is present but not executed (call is commented out)
- script imports DB/browser-related modules, so DB initialization may still run
- because `main2` is commented, this command currently does not perform active scraping

If you want this command to scrape data, uncomment `await main2()` in `src/scraper.ts` and adjust the target URL/selectors as needed.

export type YoastArticleTag = {
  '@type': 'Article',
  'author': {
    name: string,
  }
  'headline': string,
  'datePublished': string,
  'dateModified': string,
  'articleSection': string[],
}

export type YoastSeo = {
  '@context': string,
  '@graph': Array<{
    '@type': string | string[],
    '@id': string,
    [key: string]: any
  }>
}

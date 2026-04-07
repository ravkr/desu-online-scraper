export type YoastGraphNode = {
  '@type': string | string[];
  '@id': string;
  [key: string]: unknown;
};

export type YoastArticleTag = YoastGraphNode & {
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
  '@graph': YoastGraphNode[]
}

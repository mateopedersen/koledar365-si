import { currentSiteAsset } from '../../lib/cloudflare/retired-pages.js';

export const onRequest = (context) => currentSiteAsset(context, '/free/search.json');

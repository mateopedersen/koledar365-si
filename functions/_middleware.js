import productionAdPaths from './advertising-routes.js';
import {advertisingResponse} from '../lib/advertising-csp.mjs';

const paths = new Set(productionAdPaths);
const hosts = ['koledar365.si', 'www.koledar365.si'];
const privatePath = /^\/(?:upravljanje|prijava|odjava|api|free)(?:\/|$)/;

export const onRequest = context => privatePath.test(new URL(context.request.url).pathname)
  ? context.next()
  : advertisingResponse(context, paths, hosts);

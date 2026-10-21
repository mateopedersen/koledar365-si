const noStore = (response, status = response.status) => {
  const headers = new Headers(response.headers);
  headers.set('Cache-Control', 'no-store, max-age=0');
  headers.set('CDN-Cache-Control', 'no-store');
  headers.set('Cloudflare-CDN-Cache-Control', 'no-store');
  return new Response(response.body, { status, headers });
};

export async function retiredNamePage(context) {
  const asset = await context.env.ASSETS.fetch(new URL('/404', context.request.url));
  const response = noStore(asset, 404);
  response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  return response;
}

export async function currentSiteAsset(context, path) {
  const asset = await context.env.ASSETS.fetch(new URL(path, context.request.url));
  return noStore(asset);
}

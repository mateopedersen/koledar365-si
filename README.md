# Koledar365.si

Standalone Slovenian coming-soon site for the koledar365.si Cloudflare Pages project. This repository is intentionally independent of the Lithuanian `kalendorius365` website.

## Build locally

Requires Ruby 3.4.11. The generator uses Ruby's standard library only.

```sh
ruby build.rb
```

The generated `dist/` directory is committed so Cloudflare Pages can deploy the exact reviewed files without running a build or installing dependencies.

## Cloudflare Pages

- Connect this repository to its own Pages project named `koledar365-si`.
- Production branch: `main`.
- Build command: leave empty.
- Build output directory: `dist`.
- Add `koledar365.si` as the custom domain for this project.

The page intentionally returns `noindex, nofollow` and blocks crawling while the full Slovenian site is being prepared. Remove both controls as part of the finished launch, then add the final canonical pages and sitemap.

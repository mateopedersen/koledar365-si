# syntax=docker/dockerfile:1
ARG RUBY_VERSION=4.0.7
FROM ruby:${RUBY_VERSION}-slim AS base
WORKDIR /rails
RUN apt-get update -qq && apt-get install --no-install-recommends -y \
    ca-certificates curl libpq5 libyaml-0-2 poppler-utils python3 python3-pil \
    && rm -rf /var/lib/apt/lists/*
ENV RAILS_ENV=production BUNDLE_DEPLOYMENT=1 BUNDLE_PATH=/usr/local/bundle BUNDLE_WITHOUT=test \
    PDFTOPPM_BIN=/usr/bin/pdftoppm PYTHON_BIN=/usr/bin/python3 PORT=3000
FROM base AS build
RUN apt-get update -qq && apt-get install --no-install-recommends -y \
    build-essential git libpq-dev libyaml-dev pkg-config \
    && rm -rf /var/lib/apt/lists/*
COPY Gemfile Gemfile.lock ./
RUN bundle install && rm -rf /usr/local/bundle/ruby/*/cache
COPY . .
RUN SECRET_KEY_BASE_DUMMY=1 ./bin/rails assets:precompile
FROM base AS runtime
RUN groupadd --system --gid 1000 rails && useradd --uid 1000 --gid 1000 --create-home rails
COPY --from=build --chown=rails:rails /usr/local/bundle /usr/local/bundle
COPY --from=build --chown=rails:rails /rails /rails
RUN mkdir -p /rails/storage /rails/tmp /rails/log && chown -R rails:rails /rails/storage /rails/tmp /rails/log
USER rails:rails
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 CMD curl -fsS http://127.0.0.1:3000/up || exit 1
ENTRYPOINT ["/rails/bin/docker-entrypoint"]
CMD ["./bin/rails", "server", "-b", "0.0.0.0", "-p", "3000"]

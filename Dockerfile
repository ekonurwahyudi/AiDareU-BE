# Backend (Laravel with Nginx + PHP-FPM)
FROM php:8.2-fpm-alpine

# Install Nginx, PHP extensions & tools
RUN apk add --no-cache \
    nginx \
    git zip unzip \
    libpq-dev icu-dev oniguruma-dev \
  && docker-php-ext-install intl mbstring bcmath pdo_pgsql

# Tambahkan Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Copy source code
COPY . /var/www/html

# Copy Nginx config
COPY nginx.conf /etc/nginx/http.d/default.conf

# Copy PHP configuration for file uploads
COPY php.ini /usr/local/etc/php/conf.d/uploads.ini

# EntryPoint untuk install deps dan jalankan artisan opsional
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Permission untuk storage & cache
RUN mkdir -p storage bootstrap/cache \
  && chown -R www-data:www-data /var/www/html

EXPOSE 8080
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["sh", "-c", "php-fpm -D && nginx -g 'daemon off;'"]
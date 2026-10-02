FROM php:8.3-apache-bookworm

RUN apt-get update \
 && apt-get install -y --no-install-recommends \
      libfreetype6-dev libjpeg62-turbo-dev libpng-dev \
      libicu-dev libzip-dev libonig-dev unzip git curl \
 && docker-php-ext-configure gd --with-freetype --with-jpeg \
 && docker-php-ext-install -j"$(nproc)" \
      pdo_mysql mysqli mbstring intl zip gd opcache bcmath \
 && a2enmod rewrite headers expires \
 && curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer \
 && rm -rf /var/lib/apt/lists/*

COPY apache-disaster.conf /etc/apache2/sites-available/000-default.conf
COPY php-disaster.ini /usr/local/etc/php/conf.d/zz-disaster.ini

WORKDIR /var/www/html

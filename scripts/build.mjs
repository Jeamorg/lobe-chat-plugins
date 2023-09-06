import { consola } from 'consola';
import { merge } from 'lodash-es';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import config from '../.i18nrc.js';
import { formatAndCheckSchema } from './check.mjs';
import { localesDir, meta, plugins, pluginsDir, root } from './const.mjs';

const build = async () => {
  const pluginsIndex = {
    ...meta,
    plugins: [],
  };

  const list = {};

  for (const file of plugins) {
    if (file.isFile()) {
      const data = readFileSync(resolve(pluginsDir, file.name), {
        encoding: 'utf8',
      });
      const plugin = formatAndCheckSchema(JSON.parse(data));
      if (!list[config.entryLocale]) list[config.entryLocale] = [];
      list[config.entryLocale].push(plugin);
      config.outputLocales.forEach((locale) => {
        if (!list[locale]) list[locale] = [];
        const localeFilePath = resolve(localesDir, file.name.replace('.json', `.${locale}.json`));
        const localeData = readFileSync(localeFilePath, {
          encoding: 'utf8',
        });
        list[locale].push(merge(plugin, JSON.parse(localeData)));
      });
    }
  }

  pluginsIndex.plugins = list[config.entryLocale].sort(
    (a, b) => new Date(b.createAt) - new Date(a.createAt),
  );

  const publicPath = resolve(root, 'public');

  if (!existsSync(publicPath)) mkdirSync(publicPath);

  writeFileSync(resolve(root, './public/index.json'), JSON.stringify(pluginsIndex, null, 2), {
    encoding: 'utf8',
  });

  consola.success('build index.json');

  config.outputLocales.forEach((locale) => {
    pluginsIndex.plugins = list[locale].sort((a, b) => new Date(b.createAt) - new Date(a.createAt));
    writeFileSync(
      resolve(root, `./public/index.${locale}.json`),
      JSON.stringify(pluginsIndex, null, 2),
      {
        encoding: 'utf8',
      },
    );
    consola.success(`build index.${locale}.json`);
  });
};

await build();
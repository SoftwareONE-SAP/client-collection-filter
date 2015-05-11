Package.describe({
  name: 'centiq:client-collection-filter',
  version: '0.3.0',
  // Brief, one-line summary of the package.
  summary: 'Wrap a mongo collection/array of data, and provide a filter service',
  // URL to the Git repository containing the source code for this package.
  git: 'https://github.com/Centiq/client-collection-filter',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('1.0.3.2');

  /**
   * Meteor libraries
   */
  api.use([
    'templating',
    'mongo',
    'underscore',
    'reactive-var',
    'tracker'
  ], 'client');

  /**
   * External packages
   */
  api.use([
    'richsilv:pikaday@=1.0.0',
    'momentjs:moment@=2.10.2'
  ], 'client');

  api.addFiles([
    'lib/client-collection-filter.js',
    'lib/filter-service.js',
    'lib/templates/default-filter-panel.html',
    'lib/templates/default-filter-panel.js',
    'lib/templates/default-filter-panel-field.html',
    'lib/templates/default-filter-panel-field.js',
    'lib/templates/default-filter-panel-date.html',
    'lib/templates/default-filter-panel-date.js',
    'lib/templates/default-filter-panel-enum.html',
    'lib/templates/default-filter-panel-enum.js',
    'lib/templates/default-filter-panel-range.html',
    'lib/templates/default-filter-panel-range.js',
    'lib/templates/default-filter-panel-text.html',
    'lib/templates/default-filter-panel-text.js'
  ], 'client');

  api.export('ClientCollectionFilter', 'client');
  api.export('FilterService', 'client');
});

Package.onTest(function(api) {
  api.use('tinytest');
  api.use([
    'templating',
    'mongo',
    'underscore',
    'reactive-var',
    'tracker',
    'momentjs:moment@=2.10.2'
  ], 'client');
  api.use('centiq:client-collection-filter');
  api.addFiles('tests/filter-service-tests.js', 'client');
  api.addFiles('tests/client-collection-filter-tests.js', 'client');
});

Package.describe({
  name: 'centiq:client-collection-filter',
  version: '0.1.0',
  // Brief, one-line summary of the package.
  summary: 'Wrap a mongo collection/array of data, and provide a filter service',
  // URL to the Git repository containing the source code for this package.
  git: '',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('1.0.3.2');

  api.use([
    'templating',
    'mongo',
    'underscore',
    'reactive-var',
    'tracker',
    'momentjs:moment@=2.10.2'
  ], 'client');

  api.addFiles([
    'lib/client-collection-filter.js',
    'lib/filter-service.js'
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

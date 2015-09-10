Changelog
=========

### 0.3.8

* Provide ability to disable all fields, add option for enum for resetOnDisable (bool)

### 0.3.7

* Provide ability for functions for processing custom fields, tweak enabled/disabled

### 0.3.6

* Ensure selector object on find method

### 0.3.5

* Revise structure on filters applied to collection on find request to prevent clashes

### 0.3.4

* Allow custom filter types to be injected

### 0.3.3

* Allow enum option enabled default, default: true

### 0.3.2

* Add getTextFilter method

### 0.3.1

* `options.data` for enum filters must be an array, for order preservation

### 0.3.0

* Return all fields from fields(), filter in template
* Move start and end from `options.data` to `options` for date filters
* Update tests

### 0.2.2

* Fix dates in setDateValues

### 0.2.1

* Update README
* Make collection available on ClientCollectionFilter.collection
* Add Text/Number filtering

### 0.2.0

* Rewrote FilterService to accept reactive models
* Make expected field objects more consistent
* Add default templates

ClientCollectionFilter = function(collection, filterService) {
  var self = this;

  /**
   * Ensure ClientCollectionFilter is instantiated with "new"
   */
  if (!(self instanceof ClientCollectionFilter)) {
    return new ClientCollectionFilter(collection, filterService);
  }

  self._collection = null;
  if (collection instanceof Mongo.Collection) {
    self._collection = collection;
  } else if (collection instanceof Array) {
    self._collection = new Mongo.Collection(null);
    _.each(collection, function(obj) {
      if (typeof obj === "object" && !(obj instanceof Array)) {
        self._collection.insert(obj);
      }
    })
  }

  if (self._collection === null) {
    throw new Error('`collection` must be of type Mongo.Collection or an array of objects')
  }

  if (!(filterService instanceof FilterService)) {
    throw new Error('filterService must by an instance of FilterService');
  }

  self._filterService = filterService;
}

ClientCollectionFilter.prototype.find = function(selector, options) {
  var self = this,
  selector = _.extend({}, selector, self._filterService.filters()),
  options = options || {};
  return self._collection.find(selector, options);
};

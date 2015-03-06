ClientCollectionFilter = function(collection, filterService) {
  var self = this;

  if (!(self instanceof ClientCollectionFilter)) {
    return new ClientCollectionFilter(collection, filterService);
    // throw new Error('use "new" to create an instance of ClientCollectionFilter');
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

ClientCollectionFilter.prototype.fetch = function() {
  var self = this;
  return self._collection.find(self._filterService.filters());
};

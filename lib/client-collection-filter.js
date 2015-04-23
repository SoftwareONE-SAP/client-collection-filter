ClientCollectionFilter = function(model, collection) {
  var self = this;

  /**
   * Ensure ClientCollectionFilter is instantiated with "new"
   */
  if (!(self instanceof ClientCollectionFilter)) {
    return new ClientCollectionFilter(collection, filterService);
  }

  self.collection = null;
  if (collection instanceof Mongo.Collection) {
    self.collection = collection;
  } else if (collection instanceof Array) {
    self.collection = new Mongo.Collection(null);
    _.each(collection, function(obj) {
      if (typeof obj === "object" && !(obj instanceof Array)) {
        self.collection.insert(obj);
      }
    });
  } else {
    self.collection = new Mongo.Collection(null);
  }

  if (self.collection === null) {
    throw new Meteor.Error(
      'ClientCollectionFilter-collection',
      '`collection` must be of type Mongo.Collection or an array of objects'
    );
  }

  if (!_.has(model, 'fields') || !model.fields.length) {
    throw new Meteor.Error(
      'ClientCollectionFilter-model',
      '`model` must have a `fields` array of field objects'
    );
  }

  self._filterService = new FilterService(model);
}

ClientCollectionFilter.prototype.find = function(selector, options) {
  var self = this,
    selector = _.extend({}, selector, self._filterService.filters()),
    options = options || {};
  return self.collection.find(selector, options);
};

ClientCollectionFilter.prototype.filter = function() {
  var self = this;
  return self._filterService;
};

/**
 * Proxy setModel request to the Filter Service
 * @param {Object} model New model for the filter service
 */
ClientCollectionFilter.prototype.setModel = function(model) {
  var self = this;
  return self._filterService.setModel(model);
};

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

  /**
   * Test model for fields array
   */
  var _model = (model instanceof ReactiveVar) ? model.get() : model;
  if (!_.has(_model, 'fields') && !_.isArray(_model.fields) /* || !_model.fields.length*/ ) {
    throw new Meteor.Error(
      'ClientCollectionFilter-model',
      '`model` must have a `fields` array of field objects'
    );
  }

  /**
   * Construct the FilterService using the model passed in
   */
  self._filterService = new FilterService(model);
}

ClientCollectionFilter.prototype.find = function(selector, options) {
  var self = this,
    selectors = [],
    options = options || {},
    filters = self._filterService.filters();

  if (Object.keys(selector).length) {
    selectors.push(selector);
  }
  if (Object.keys(filters).length) {
    selectors.push(filters);
  }

  var sel = (selectors.length) ? (selectors.length > 1) ? {
    $and: selectors
  } : selectors[0] : {};

  return self.collection.find(sel, options);
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

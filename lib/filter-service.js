FilterService = function(model) {
  var self = this;

  /**
   * Ensure model
   */
  if (!model || !_.isObject(model)) {
    throw new Error('FilterService: You must provide a `model` object for your data');
  }

  /**
   * Cache model
   */
  self._model = model;

  /**
   * Initial storage containers
   */
  self._fields = new ReactiveVar([]);
  self._fieldKeys = {};

  /**
   * Text/Number filter filter
   */
  self._filterText = new ReactiveVar('');

  /**
   * Generated MongoDB filter object
   */
  self._mongoFilter = new ReactiveVar({});

  /**
   * Setup the Filter instance
   */
  self._setup();

  /**
   * Start the auto calculation of the Mongo Filters object
   */
  self._generateFilterHandle = Tracker.autorun(function() {
    var fields = self._fields.get(),
      filterText = self._filterText.get(),
      filters = {},
      ands = [];

    /**
     * Process filterText
     */
    if (filterText !== '') {
      var regex = {
        $regex: new RegExp('.*' + filterText + '.*', 'i')
      };
      var conditions = [];
      _.each(fields, function(field) {
        if (field.type === 'string' && field.filterable === true) {
          var condition = {};
          condition[field.key] = regex;
          conditions.push(condition);
        }
      });
      if (!!conditions.length) {
        ands.push({
          $or: conditions
        });
      }
    }

    /**
     * Process fields
     */
    _.each(fields, function(field) {
      var filter = {};
      if (field.filterable && field.enabled) {
        if (field.type === 'enum') {
          filter[field.key] = {
            $in: _.map(_.filter(field.enumStatus, function(value) {
              return value.enabled;
            }), function(value) {
              return field.enumArray[value.index].value;
            })
          }
          ands.push(filter);
        }
      }
    });

    /**
     * Join all the filters together
     */
    if (ands.length > 1) {
      filters.$and = ands;
    } else if (ands.length === 1) {
      filters = ands[0];
    }

    /**
     * Set the filters
     */
    self._mongoFilter.set(filters);
  });
};

/**
 * Configure the Filter object based on the model
 */
FilterService.prototype._setup = function() {
  var self = this,
    fields = self._fields.get()
  _.each(self._model.fields, function(field, index) {
    var f = self._getField(field);

    self._fieldKeys[f.key] = index;
    fields[index] = f;
  });
  self._fields.set(fields);
};

/**
 * Returns the field object with all required keys
 * Note: Some defaults are for reactive-table, as that is what we assume we are
 * working with
 */
FilterService.prototype._getField = function(field) {
  var self = this,
    obj = _.extend({
      key: null,
      label: null,
      type: 'string',
      filterable: true,
      isVisisble: true,
      enumArray: [],
      enumStatus: {},
      enabled: false
    }, field);

  if (obj.key === null || typeof obj.key !== 'string') {
    throw new Error('FilterService: All fields in model must have a `key` string');
  }

  /**
   * Ensure label is set
   */
  if (!obj.label) {
    obj.label = obj.key.charAt(0)
      .toUpperCase() + obj.key.slice(1);
  }

  if (obj.type === 'enum') {
    if (obj.enumArray.length === 0) {
      throw new Error('FilterService: Field with type enum must have an enumArray');
    }
    /**
     * Set the enumStatus value (defaults true)
     */
    _.each(obj.enumArray, function(value, key) {
      enumEnabled = _.has(obj.enumStatus, key) && obj.enumStatus[key].enabled || true;
      obj.enumStatus[value.value] = {
        index: key,
        enabled: enumEnabled
      };
    });
  }
  return obj;
};

/**
 * Returns the fields available for the Filter
 */
FilterService.prototype.fields = function() {
  var self = this;
  return _.filter(self._fields.get(), function(field) {
    return !!field.filterable;
  });
};

/**
 * Returns the mongo filter object generated
 */
FilterService.prototype.filters = function() {
  var self = this;
  return self._mongoFilter.get();
};

/**
 * Returns true if filters are applied
 */
FilterService.prototype.isFiltering = function() {
  var self = this,
    filters = self._mongoFilter.get();
  return !_.isEmpty(filters);
};

/**
 * Resets the filters to a "like new" state
 */
FilterService.prototype.reset = function() {
  var self = this;
  self._filterText.set('');
  self._setup();
};

/**
 * Alias `clear` to `reset`
 */
FilterService.prototype.clear = function() {
  var self = this;
  self.reset();
};

/**
 * Enables/disables a filter
 */
FilterService.prototype.toggleFilter = function(field) {
  var self = this,
    fields = self._fields.get();
  if (_.has(self._fieldKeys, field)) {
    fields[self._fieldKeys[field]].enabled = !fields[self._fieldKeys[field]].enabled;
  }
  self._fields.set(fields);
};

/**
 * Enables/disables an enum value
 */
FilterService.prototype.toggleEnum = function(field, enumKey) {
  var self = this,
    fields = self._fields.get();
  if (_.has(self._fieldKeys, field)) {
    fields[self._fieldKeys[field]].enumStatus[enumKey].enabled = !fields[self._fieldKeys[field]].enumStatus[enumKey].enabled;
  }
  self._fields.set(fields);
};

/**
 * Set the text filter (throttled to 5 times a second)
 */
FilterService.prototype.setFilterText = _.throttle(function(text) {
  var self = this;
  self._filterText.set(text);
}, 200);

FilterService = function(model) {
  var self = this;

  /**
   * Ensure FilterService is instantiated with "new"
   */
  if (!(self instanceof FilterService)) {
    return new FilterService(model);
  }

  /**
   * Ensure model
   */
  if (!model || !_.isObject(model) || _.isArray(model)) {
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
   * Date Filter
   */
  self._dateFilter = new ReactiveVar(null);

  /**
   * Setup the Filter instance
   */
  self._setup();

  /**
   * Start the auto calculation of the Mongo Filters object
   */
  self._generateFilterHandle = Tracker.autorun(function() {
    var dateFilter = self._dateFilter.get(),
      fields = self._fields.get(),
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
     * Process dateFilter
     */
    if (!_.isNull(dateFilter) && dateFilter.enabled) {
      var startDate = dateFilter.startDate,
        endDate = dateFilter.endDate;
      if (_.isDate(startDate) && _.isDate(endDate)) {
        ands.push(dateFilter.fn(startDate, endDate));
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
        }
        else if (field.type === 'range') {
          if (_.isFunction(field.fn)) {
            filter = field.fn(field.rangeOptions.value);
          }
          else if (_.has(field, 'rangeType') && field.rangeType === 'min') {
            filter[field.key] = {
              $gte: field.rangeOptions.value
            };
          }
          else {
            filter[field.key] = {
              $lte: field.rangeOptions.value
            };
          }
        }
      }
      if (!_.isEmpty(filter)) {
        ands.push(filter);
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
    fields = self._fields.get(),
    df = null;

  _.each(self._model.fields, function(field, index) {
    var f = self._getField(field);

    self._fieldKeys[f.key] = index;
    fields[index] = f;
  });

  /**
   * Setup the Date Filter
   */
  if (_.has(self._model, 'dateFilter')) {
    df = self._model.dateFilter;
    if (!_.has(df, 'fn') || !_.isFunction(df.fn)) {
      throw new Error('FilterService: dateFilter object must have a function `fn` which produces a Mongo query object');
    }
    df.label = !!df.label && df.label || "Date Filter";
    df.enabled = _.has(df, 'enabled') && df.enabled || false;
    df.key = '_dateFilter';

    if (!_.isDate(df.startDate)) {
      var sDate = new Date(df.startDate);
      df.startDate = (sDate.toString() !== 'Invalid Date') && sDate || new Date();
    }
    if (!_.isDate(df.endDate)) {
      var eDate = new Date(df.endDate);
      df.endDate = (eDate.toString() !== 'Invalid Date') && eDate || new Date();
    }
  }

  /**
   * Set ReactiveVars
   */
  self._fields.set(fields);
  self._dateFilter.set(df);
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
      enumArray: [],
      enumStatus: {},
      enabled: false,
      rangeOptions: {}
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
 * Returns true if there is a dateFilter
 */
FilterService.prototype.dateFilter = function() {
  var self = this;
  return self._dateFilter.get();
};

/**
 * Returns true if there is a dateFilter
 */
FilterService.prototype.hasDateFilter = function() {
  var self = this,
    df = self._dateFilter.get();
  return !_.isNull(df);
};

/**
 * Set the start and end dates
 * If either date is null, it will not alter the value
 */
FilterService.prototype.setDateRange = function(startDate, endDate) {
  var self = this,
    df = self._dateFilter.get();
  if (_.isDate(startDate)) {
    df.startDate = startDate;
  }
  if (_.isDate(endDate)) {
    df.endDate = endDate;
  }
  self._dateFilter.set(df);
};

/**
 * Sets the value for the field
 */
FilterService.prototype.setRange = function(field, value) {
  var self = this,
    fields = self._fields.get(),
    fieldIndex = self._fieldKeys[field];
  if (_.isNumber(fieldIndex)) {
    fields[fieldIndex].rangeOptions.value = +value;
  }
  self._fields.set(fields);
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
  if (field === '_dateFilter') {
    var df = self._dateFilter.get();
    df.enabled = !df.enabled;
    self._dateFilter.set(df);
    return;
  }
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

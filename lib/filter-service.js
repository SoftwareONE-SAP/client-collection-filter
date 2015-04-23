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
    throw new Meteor.Error(
      'FilterService-model',
      'You must provide a `model` object for your data'
    );
  }

  /**
   * Cache model
   */
  if (model instanceof ReactiveVar) {
    self._model = model;
  } else {
    self._model = new ReactiveVar();
    self.setModel(model);
  }

  /**
   * Fields
   * Cache both a static and reactive copy of the fields, so as not to
   * invalidate the `_generateFields` computation.
   */
  self._fieldStatic = [];
  self._fields = new ReactiveVar([]);
  self._fieldMap = {};

  /**
   * Output
   */
  self._filters = new ReactiveVar({});

  /**
   * Filter text
   */
  self._filterText = new ReactiveVar('');

  /**
   * Monitor model for changes
   */
  self._generateFieldsHandle = Tracker.autorun(self._generateFields.bind(self));

  /**
   * Generate the output
   */
  self._generateFilterHandle = Tracker.autorun(self._generateFilters.bind(self));
}

/**
 * Sets the _fields array based upon the model
 */
FilterService.prototype._generateFields = function() {
  var self = this,
    model = self._model.get(),
    fields = [],
    newFieldMap = {};

  _.each(model.fields, function(field, index) {
    fields.push(
      self._generateField(
        field,
        self._fieldStatic[self._fieldMap[field.key]] || {}
      )
    );
    newFieldMap[field.key] = index;
  });

  self._fields.set(fields);
  self._fieldMap = newFieldMap;
  self._fieldStatic = fields;
};

/**
 * Returns the full field object
 * @param  {Object} field The field object to process
 * @return {Object}       The processed field object with all required
 *                        properties
 */
FilterService.prototype._generateField = function(field, existingField) {
  var self = this,
    obj = _.extend({
      key: null,
      label: null,
      type: 'string',
      enabled: false,
      options: {}
    }, existingField, field);

  if (obj.key === null || typeof obj.key !== 'string') {
    throw new Meteor.Error(
      'FilterService-fieldGeneration',
      'All fields in model must have a `key`'
    );
  }

  /**
   * Ensure label is set
   */
  if (!obj.label) {
    obj.label = self._ucFirst(obj.key);
  }

  /**
   * Check type
   */
  obj.type = String(obj.type).toLowerCase();

  var allowedTypes = [
    'date',
    'enum',
    'number',
    'range',
    'string'
  ];
  if (_.indexOf(allowedTypes, obj.type) < 0) {
    throw new Meteor.Error(
      'FilterService-field-type',
      'Unknown field type "' + obj.type + '"'
    );
  }

  /**
   * If the field's `options.data` is a ReactiveVar, use it's contents as the
   * field data
   */
  if (_.has(obj.options, 'data') && field.options.data instanceof ReactiveVar) {
    obj.options._data = _.extend(field.options.data.get(), obj.options._data);
  } else {
    obj.options._data = _.extend(obj.options.data, obj.options._data);
  }

  /**
   * Check data
   */
  self._processFieldData(obj);

  /**
   * Return the generated field
   */
  return obj;
};

/**
 * Processes the data for the field and ensures the options are valid
 * @param  {Object} field The field Object
 * @return {Object}       The processed field object
 */
FilterService.prototype._processFieldData = function(field) {
  var self = this,
    requiresData = function(field) {
      if (!_.has(field, 'options') ||
        !_.has(field.options, '_data')
      ) {
        throw new Meteor.Error(
          'FilterService-object-data',
          'Field for "' + field.type + '" type must have `options.data`'
        );
      }

      if (!_.isObject(field.options._data) || _.isArray(field.options._data)) {
        throw new Meteor.Error(
          'FilterService-object-data',
          '`options.data` for "' + field.type + '" type must be an object or ReactiveVar containing an object'
        );
      }
    };

  /**
   * Check type specific settings
   * @param  {String} field.type Type of field to check against
   */
  switch (field.type) {
    case 'enum':
      requiresData(field);

      /**
       * Check enum values
       * @type {Object}
       */
      _.each(field.options._data, function(option, index) {
        if (!_.has(option, 'value')) {
          throw new Meteor.Error(
            'FilterService-object-data',
            '`options.data` object element for "' + field.type + '" type must have a `value`'
          );
        }

        /**
         * Ensure there is a label
         */
        option.label = option.label || self._ucFirst(option.value);

        /**
         * Set field option enabled to false (or existing value)
         */
        option.enabled = option.enabled || false;
      });
      break;
    case 'range':

      /**
       * Set minimum to 0 if not present
       * @type {Number}
       */
      field.options.min = field.options.min || 0;
      if (!_.has(field.options, 'max')) {
        throw new Meteor.Error(
          'FilterService-object-data',
          '`options.max` for "range" type must be set'
        );
      }

      /**
       * Check maximum is not lower than or equal to minimum
       */
      if (field.options.max <= field.options.min) {
        throw new Meteor.Error(
          'FilterService-object-data',
          '`options.max` for "range" type must be greater than `options.min`'
        );
      }

      /**
       * Set value to mid point (rounded up)
       */
      if (!_.has(field.options, 'value')) {
        field.options.value = field.options.min +
          ((field.options.max - field.options.min) / 2);
      }

      /**
       * Check range type
       * Default: max
       */
      field.options.type = field.options.type || 'max';
      field.options._validTypes = ['min', 'max'];

      if (_.indexOf(field.options._validTypes, field.options.type) === -1) {
        throw new Meteor.Error(
          'FilterService-object-data',
          '`options.type` for "range" type must "min" or "max"'
        );
      }

      /**
       * Check if the range type can be changed
       * Default: false
       */
      field.options.allowTypeChange = field.options.allowTypeChange || false;
      break;
    case 'date':
      /**
       * Call checks if present, otherwise it is constructed below
       */
      if (_.has(field.options, '_data')) {
        requiresData(field);
      }

      /**
       * Start and end dates
       */
      _.each(['start', 'end'], function(key) {
        var originalValue = field.options._data[key];
        switch (typeof field.options._data[key]) {
          case 'object':
            if (field.options._data[key] instanceof Date) {
              break;
            }
          case 'string':
          case 'number':
            field.options._data[key] = new Date(field.options._data[key]);
            break;
          default:
            field.options._data[key] = new Date();
            break;
        }

        if (_.isNaN(field.options._data[key].getTime())) {
          throw new Meteor.Error(
            'FilterService-object-data',
            '`options.' + key + '` for "date" type must be a Date, an epoch time, or a valid date string (' + (typeof originalValue) + ': ' + originalValue + ')'
          );
        }
      });

      /**
       * Check range type
       * Default: between
       */
      field.options.type = field.options.type || 'between';
      field.options._validTypes = ['before', 'after', 'equals', 'between']

      if (_.indexOf(field.options._validTypes, field.options.type) === -1) {
        throw new Meteor.Error(
          'FilterService-object-data',
          '`options.type` for "date" type must "before", "after", "equals" or "between", not "' + field.options.type + '"'
        );
      }

      /**
       * Check if the range type can be changed
       * Default: false
       */
      field.options.allowTypeChange = field.options.allowTypeChange || false;

      break;
    default:
      if (field.type !== 'string' && field.type !== 'number') {
        throw new Meteor.Error(
          'FilterService-field-type',
          'Unknown field type "' + field.type + '"'
        );
      }
      break;
  }


  /**
   * Set field enabled to false (or existing value)
   */
  field.options.enabled = field.options.enabled || false;

  /**
   * Set default field function if function is not provided
   */
  if (!_.has(field.options, 'fn') || !_.isFunction(field.options.fn)) {
    field.options.fn = self._defaultFn[field.type] || null;
  }
};

/**
 * Map of default functions for field types
 * @type {Object}
 */
FilterService.prototype._defaultFn = {
  'date': function(field) {
    var filter = {};
    switch (field.options.type) {
      case 'before':
        filter[field.key] = {
          $lte: moment(field.options.start).endOf('day').toDate()
        };
        break;
      case 'after':
        filter[field.key] = {
          $gte: moment(field.options.start).startOf('day').toDate()
        };
        break;
      case 'between':
        filter[field.key] = {
          $gte: moment(field.options.start).startOf('day').toDate(),
          $lte: moment(field.options.end).endOf('day').toDate()
        };
        break;
      case 'equals':
        filter[field.key] = {
          $gte: moment(field.options.start).startOf('day').toDate(),
          $lte: moment(field.options.start).endOf('day').toDate()
        };
        break;
    }
    return filter;
  },
  'enum': function(field) {
    var filter = {};
    filter[field.key] = {
      $in: _.map(_.filter(field.options._data, function(value) {
        return value.enabled;
      }), function(value) {
        return value.value;
      })
    };
    return filter;
  },
  'range': function(field) {
    var filter = {};
    if (field.options.type === 'max') {
      filter[field.key] = {
        $lte: field.options.value
      };
    } else {
      filter[field.key] = {
        $gte: field.options.value
      };
    }
    return filter;
  }
};

/**
 * Returns a string with the first character in uppercase
 * @param  {String} str String to process
 * @return {String}
 */
FilterService.prototype._ucFirst = function(str) {
  return String(str).charAt(0).toUpperCase() + String(str).slice(1);
};

/**
 * Generates the mongo filters object based upon the fields and their options
 * @return {Object} A valid mongo selector object
 */
FilterService.prototype._generateFilters = function() {
  var self = this,
    fields = self.fields(),
    conditions = [],
    filters = {};
  /**
   * Process text and number fields
   * @todo  this^
   */


  /**
   * Process other fields
   */
  _.each(fields, function(field) {
    if (_.indexOf(['date', 'enum', 'range'], field.type) > -1 &&
      field.enabled
    ) {
      conditions.push(field.options.fn(field));
    }
  });

  if (conditions.length > 1) {
    filters.$and = conditions;
  } else if (conditions.length === 1) {
    filters = conditions[0];
  }

  self._filters.set(filters);
};

/**
 * Updates the field passed in both static and ReactiveVar
 * @param {Object} field field object to update
 */
FilterService.prototype._setField = function(field) {
  var self = this,
    fields = self.fields();

  fields[self._fieldMap[field.key]] = field;
  self._fieldStatic[self._fieldMap[field.key]] = field;
  return self._fields.set(fields);
};


/**
 * Updates the reactive var containing the model for this filter.  Used to
 * change the filters available in the filter.
 *
 * Note: The model can be passed as a Reactive Var, allowing the user to create
 * the model in a Tracker computation and have it update automatically.
 * @param {Object} model Model for the filter
 */
FilterService.prototype.setModel = function(model) {
  var self = this;
  return self._model.set(model);
};

/**
 * Returns the current set of filters as a MongoDB Selector object
 * @return {Object} MongoDB Selector
 */
FilterService.prototype.filters = function() {
  var self = this;
  return self._filters.get();
};

/**
 * -------------------------
 * Template Helper Functions
 * -------------------------
 */

/**
 * Returns the fields Array
 * @return {Array} Array of field objects for configuring the filter panel
 */
FilterService.prototype.fields = function() {
  var self = this;
  return self._fields.get();
};

FilterService.prototype.field = function(fieldKey) {
  var self = this;
  return _.filter(self.fields(), function(field) {
    return field.key === fieldKey;
  })[0] || false;
};

/**
 * Returns true if there are text or number type fields
 * @return {Boolean}
 */
FilterService.prototype.showTextFilter = function() {
  var self = this,
    fields = self.fields();
  return !!_.filter(fields, function(field) {
    return field.type === 'string' || field.type === 'number';
  }).length;
};

/**
 * Sets the enabled status of a field (whether it's filter is considered or not)
 * @param {String}  fieldKey The field's key
 * @param {Boolean} value    Whether the key is enabled or not
 */
FilterService.prototype.setFieldEnabled = function(fieldKey, value) {
  var self = this,
    field = self.field(fieldKey);
  field.enabled = !!value;
  return self._setField(field);
};

/**
 * Returns true if the field for the key provided is enabled
 * @param  {String}  fieldKey The field's key
 * @return {Boolean}          Whether the key is enabled or not
 */
FilterService.prototype.isFieldEnabled = function(fieldKey) {
  var self = this;
  return self.field(fieldKey).enabled;
};

/**
 * Set the `enabled` value for the option in the field
 * @param {String} fieldKey the field's `key`
 * @param {String} option   The option to change
 */
FilterService.prototype.setEnumOption = function(fieldKey, option, value) {
  var self = this,
    field = self.field(fieldKey);

  field.options._data[option].enabled = value;
  return self._setField(field);
};

/**
 * Set the value for the range slider
 * @param {String} fieldKey The field's key
 * @param {Number} value    The value to set the range slider to
 */
FilterService.prototype.setRangeValue = function(fieldKey, value) {
  var self = this,
    field = self.field(fieldKey);
  field.options.value = Number(value);
  return self._setField(field);
};

/**
 * Sets the date values
 * @param {String} fieldKey  The field's key
 * @param {Date}   startDate Start date object
 * @param {Date}   endDate   End date object
 */
FilterService.prototype.setDateValues = function(fieldKey, startDate, endDate) {
  var self = this,
    field = self.field(fieldKey);
  field.options.start = startDate;
  field.options.end = endDate;
  return self._setField(field);
};

/**
 * Set the type of range slider
 * @param {String} fieldKey The field's key
 * @param {String} type     Type for range slider (min, max)
 */
FilterService.prototype.setFieldSubType = function(fieldKey, type) {
  var self = this,
    field = self.field(fieldKey);
  if (!field.options.allowTypeChange || _.indexOf(field.options._validTypes, type) === -1) {
    return false;
  }
  field.options.type = type;
  return self._setField(field);
};

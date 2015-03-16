FilterService = function(model, name) {
  var self = this;

  if (!model || (typeof model) !== 'object') {
    throw new Error('FilterService: You must provide a `model` object for your data');
  }
  self._name = name || '';
  self._model = model;

  self._fields = self._getInitialFields(self._model);
  self._fieldKeys = self._mapFields();
  self._filters = self._getInitialFilters(self._fields);

  self._filterText = new ReactiveVar('');

  self._mongoFilters = new ReactiveVar({});
  self._setMongoFilters();
};

FilterService.prototype._getInitialFields = function(model) {
  var fields = model.fields || null;
  if (fields === null || (typeof fields === "object" && !(fields instanceof Array))) {
    throw new Error('FilterService: Model object must have `fields` object');
  }

  var fieldDefaults = {
    key: null,
    label: null,
    type: 'string',
    filterable: true,
    isVisisble: true,
    enumArray: [],
    enabled: new ReactiveVar(false)
  }

  var ucFirst = function(str) {
    return str.charAt(0)
      .toUpperCase() + str.slice(1);
  };

  var processedFields = _.map(fields, function(field) {
    var ret = _.extend({}, fieldDefaults, field);

    if (ret.key === null || typeof ret.key !== 'string') {
      throw new Error('FilterService: All fields in model must have a `key` string');
    }

    ret.label = !!ret.label && ret.label || ucFirst(ret.key);

    if (ret.type === 'enum' && ret.enumArray.length === 0) {
      throw new Error('FilterService: Field with type enum must have an enumArray');
    }

    return ret;
  });

  return processedFields;
};

FilterService.prototype._mapFields = function() {
  var self = this,
    fieldKeys = {};
  _.each(self._fields, function(field, index) {
    fieldKeys[field.key] = index;
  });
  return fieldKeys;
};

FilterService.prototype._getInitialFilters = function(fields) {
  var filters = {};
  _.each(fields, function(field) {
    if (!!field.filterable && field.type === 'enum') {
      filters[field.key] = new ReactiveVar();
      filters[field.key].set(_.map(field.enumArray, function(e) {
        return e.value;
      }));
    }
  });
  return filters;
};

FilterService.prototype._getFilter = function(key) {
  var self = this;
  return self._filters[key].get();
};

FilterService.prototype.getOptions = function() {
  return _.filter(this._fields, function(field) {
    return !!field.filterable;
  });
};

FilterService.prototype.filters = function() {
  var self = this;
  return self._mongoFilters.get();
};

FilterService.prototype._setMongoFilters = _.throttle(function() {
  var self = this,
    filters = {};
  filters.$and = _.map(self._filters, function(value, key) {
    var filter = {};
    if (key === '$or') {
      filter.$or = value.get();
    } else {
      if (self._fields[self._fieldKeys[key]].enabled.get()) {
        filter[key] = {
          $in: value.get()
        };
      }
    }
    return filter;
  });
  self._mongoFilters.set(filters);
}, 250);


FilterService.prototype.setFilterText = _.throttle(function(text) {
  var self = this;

  /**
   * If no filter text, remove the $or object from the _filters array
   */
  if (text === '') {
    if (self._filters.$or) {
      delete self._filters.$or;
    }
    return self._setMongoFilters();
  }

  /**
   * Otherwise create the text and number query options
   */
  var fields = self.getOptions(),
    textFields = [],
    numberFields = [],
    conditions = [];

  if (!self._filters.$or) {
    self._filters.$or = new ReactiveVar();
  }

  _.each(fields, function(field) {
    if (field.type === 'string') {
      textFields.push(field);
    } else if (field.type === 'number') {
      numberFields.push(field);
    }
  });

  /**
   * @TODO - Set the $or array for the number search
   * @TODO - Create the date filter
   * @TODO - Apply to invoices
   */

  var regex = {
    $regex: new RegExp('.*' + text + '.*', 'i')
  };
  _.each(textFields, function(field) {
    var condition = {};
    condition[field.key] = regex;
    conditions.push(condition);
  });

  self._filters.$or.set(conditions);

  return self._setMongoFilters();
}, 250);

FilterService.prototype.isChecked = function(key, value) {
  var self = this;
  return !!self._filters[key] && self._getFilter(key)
    .indexOf(value) > -1;
};

FilterService.prototype.toggleOption = function(key, value) {
  var self = this;
  if (self.isChecked(key, value)) {
    self.removeOption(key, value);
  } else {
    self.addOption(key, value);
  }
  self._setMongoFilters();
};

FilterService.prototype.addOption = function(key, value) {
  var self = this;
  self._filters[key].set(
    _.union(
      self._getFilter(key), [value]
    ));
};

FilterService.prototype.removeOption = function(key, value) {
  var self = this;
  self._filters[key].set(
    _.without(
      self._getFilter(key), value
    ));
};

FilterService.prototype.isEnabled = function(fieldName) {
  var self = this;
  return self._fields[self._fieldKeys[fieldName]].enabled.get();
};

FilterService.prototype.toggleField = function(fieldName) {
  var self = this,
    enabled = !self._fields[self._fieldKeys[fieldName]].enabled.get();
  self._fields[self._fieldKeys[fieldName]].enabled.set(enabled);
  self._setMongoFilters();
};

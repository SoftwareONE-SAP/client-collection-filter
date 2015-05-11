/**
 * Unit tests for FilterService
 */

/**
 * Instantiation tests
 */
Tinytest.add("centiq:client-collection-filter - FilterService - Instantiation", function(test) {

  /**
   * Instantiation without a Model object throws an error
   */
  test.throws(FilterService, 'You must provide a `model` object for your data [FilterService-model]');

  /**
   * Instantiation with an array throws an error
   */
  var predicate = function() {
    var x = new FilterService([]);
  };
  test.throws(predicate, 'You must provide a `model` object for your data [FilterService-model]');

  /**
   * Empty Model
   */
  var emptyModel = new FilterService({});

  /**
   * Test instantiated types
   */
  test.isTrue(emptyModel._model instanceof ReactiveVar);
  test.isTrue(emptyModel._fields instanceof ReactiveVar);
  test.equal(emptyModel._fields.get(), []);
  test.equal(emptyModel._fieldMap, {});
  test.isTrue(emptyModel._textFilter instanceof ReactiveVar);
  test.equal(emptyModel._textFilter.get(), '');
  test.isTrue(emptyModel._filters instanceof ReactiveVar);
  test.equal(emptyModel._filters.get(), {});
  test.isTrue(emptyModel._generateFieldsHandle instanceof Tracker.Computation);
  test.isTrue(emptyModel._generateFilterHandle instanceof Tracker.Computation);

  /**
   * Instiating without new returns correct instance
   */
  var noNew = FilterService({});
  test.isTrue(noNew instanceof FilterService);
});

/**
 * Test model
 * @type {Object}
 */
var filterTestModel = {
  fields: [
    /**
     * String (with type defined)
     */
    {
      key: 'foo1',
      type: 'string'
    },
    /**
     * Number
     */
    {
      key: 'foo2',
      label: 'foobar',
      type: 'number'
    },
    /**
     * Enum
     */
    {
      key: 'foo3',
      type: 'enum',
      options: {
        data: [{
          value: 0,
          label: 'bar0'
        }, {
          value: 1
        }]
      }
    },
    /**
     * Range
     */
    {
      key: 'foo4',
      type: 'range',
      options: {
        min: 0,
        max: 100,
        value: 0
      }
    },
    /**
     * String (with no type defined)
     */
    {
      key: 'foo5'
    },
    /**
     * Date
     */
    {
      key: 'foo6',
      type: 'date',
      options: {
        fn: function(startDate, endDate) {
          return {
            date: {
              $gte: startDate,
              $lte: endDate
            }
          };
        }
      }
    }
  ]
};

/**
 * Setup/Model Processing
 */
Tinytest.add("centiq:client-collection-filter - FilterService - Model Processing", function(test) {

  var withModel = new FilterService(filterTestModel);

  /**
   * Cached model matches what was passed in
   */
  test.equal(withModel._model.get(), filterTestModel);

  /**
   * Fields length is correct
   */
  test.equal(withModel.fields().length, filterTestModel.fields.length);

  /**
   * Checks on the default fields objects
   */
  var fields = withModel.fields();

  /**
   * Label is assigned correctly
   */
  test.isTrue(_.has(fields[0], 'label'));
  test.isTrue(_.has(fields[1], 'label'));
  test.isTrue(_.has(fields[2], 'label'));
  test.isTrue(_.has(fields[3], 'label'));
  test.isTrue(_.has(fields[4], 'label'));
  test.equal(fields[0].label, 'Foo1');
  test.equal(fields[1].label, 'foobar');
  test.equal(fields[2].label, 'Foo3');
  test.equal(fields[3].label, 'Foo4');
  test.equal(fields[4].label, 'Foo5');

  /**
   * Types pass through/are assigned correctly
   */
  test.isTrue(_.has(fields[0], 'type'));
  test.isTrue(_.has(fields[1], 'type'));
  test.isTrue(_.has(fields[2], 'type'));
  test.isTrue(_.has(fields[3], 'type'));
  test.isTrue(_.has(fields[4], 'type'));
  test.equal(fields[0].type, 'string');
  test.equal(fields[1].type, 'number');
  test.equal(fields[2].type, 'enum');
  test.equal(fields[3].type, 'range');
  test.equal(fields[4].type, 'string');

  /**
   * Check all fields enabled status is false by default
   */
  test.isTrue(_.has(fields[0], 'enabled'));
  test.isTrue(_.has(fields[1], 'enabled'));
  test.isTrue(_.has(fields[2], 'enabled'));
  test.isTrue(_.has(fields[3], 'enabled'));
  test.isTrue(_.has(fields[4], 'enabled'));
  test.isFalse(fields[0].enabled);
  test.isFalse(fields[1].enabled);
  test.isFalse(fields[2].enabled);
  test.isFalse(fields[3].enabled);
  test.isFalse(fields[4].enabled);

  /**
   * Check all non string and non number fields have a function assigned to them
   */
  test.isTrue(_.has(fields[0].options, 'fn'));
  test.isTrue(_.has(fields[1].options, 'fn'));
  test.isTrue(_.has(fields[2].options, 'fn'));
  test.isTrue(_.has(fields[3].options, 'fn'));
  test.isTrue(_.has(fields[4].options, 'fn'));
  test.isFalse(_.isFunction(fields[0].options.fn));
  test.isFalse(_.isFunction(fields[1].options.fn));
  test.isTrue(_.isFunction(fields[2].options.fn));
  test.isTrue(_.isFunction(fields[3].options.fn));
  test.isFalse(_.isFunction(fields[4].options.fn));

  /**
   * Type enum options are set correctly
   */
  var enumOpt = fields[2].options;
  test.isTrue(_.has(enumOpt, 'data'));
  test.isTrue(_.isArray(enumOpt.data));
  test.equal(enumOpt.data.length, 2);
  test.isFalse(enumOpt.data[0].enabled);
  test.isFalse(enumOpt.data[1].enabled);
  test.equal(enumOpt.data[0].label, 'bar0');
  test.equal(enumOpt.data[1].label, '1');

  /**
   * rangeOptions get set/assigned properly
   */
  var rangeOpt = fields[3].options;
  test.isTrue(_.has(rangeOpt, 'min'));
  test.isTrue(_.has(rangeOpt, 'max'));
  test.isTrue(_.has(rangeOpt, 'value'));
  test.isTrue(_.has(rangeOpt, '_validTypes'));
  test.isTrue(_.has(rangeOpt, 'allowTypeChange'));
  test.isTrue(_.has(rangeOpt, 'type'));
  test.equal(rangeOpt.min, filterTestModel.fields[3].options.min);
  test.equal(rangeOpt.max, filterTestModel.fields[3].options.max);
  test.equal(rangeOpt.value, filterTestModel.fields[3].options.value);
  test.isTrue(_.isUndefined(rangeOpt.data));
  test.isTrue(_.isArray(rangeOpt._validTypes));
  test.equal(rangeOpt._validTypes, ['min', 'max']);
  test.isFalse(_.isArray(rangeOpt.allowTypeChange));
  test.equal(rangeOpt.type, 'max');

  /**
   * rangeOptions get set/assigned properly
   */
  var dateOpt = fields[5].options;
  test.isTrue(_.has(dateOpt, 'start'));
  test.isTrue(_.has(dateOpt, 'end'));
  test.isTrue(_.isDate(dateOpt.start));
  test.isTrue(_.isDate(dateOpt.end));
  test.isTrue(_.has(dateOpt, '_validTypes'));
  test.isTrue(_.has(dateOpt, 'allowTypeChange'));
  test.isTrue(_.has(dateOpt, 'type'));
  test.isTrue(_.isUndefined(dateOpt.data));
  test.isTrue(_.isArray(dateOpt._validTypes));
  test.equal(dateOpt._validTypes, ['before', 'after', 'equals', 'between']);
  test.isFalse(_.isArray(dateOpt.allowTypeChange));
});

/**
 * @todo  Add tests for filter object
 * @todo  Add tests for manipulating data
 * @todo  Add tests for default data
 * @todo  Add tests for reactive model
 */

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
  test.throws(FilterService, 'FilterService: You must provide a `model` object for your data');

  /**
   * Instantiation with an array throws an error
   */
  var predicate = function() {
    var x = new FilterService([]);
  };
  test.throws(predicate, 'FilterService: You must provide a `model` object for your data');

  /**
   * Empty Model
   */
  var emptyModel = new FilterService({});

  /**
   * Test instantiated types
   */
  test.equal(emptyModel._model, {});
  test.isTrue(emptyModel._fields instanceof ReactiveVar);
  test.equal(emptyModel._fields.get(), []);
  test.equal(emptyModel._fieldKeys, {});
  test.isTrue(emptyModel._filterText instanceof ReactiveVar);
  test.equal(emptyModel._filterText.get(), '');
  test.isTrue(emptyModel._mongoFilter instanceof ReactiveVar);
  test.equal(emptyModel._mongoFilter.get(), {});
  test.isTrue(emptyModel._dateFilter instanceof ReactiveVar);
  test.equal(emptyModel._dateFilter.get(), null);
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
  fields: [{
    key: 'foo1',
    type: 'string'
  }, {
    key: 'foo2',
    label: 'foobar',
    type: 'number'
  }, {
    key: 'foo3',
    type: 'enum',
    enumArray: [{
      value: 0,
      text: 'bar0'
    }, {
      value: 1,
      text: 'bar1'
    }]
  }, {
    key: 'foo4',
    type: 'range',
    rangeOptions: {
      id: 'rangeFilter',
      name: 'range-filter',
      min: 0,
      max: 100,
      value: 0
    }
  }, {
    key: 'foo5'
  }],
  dateFilter: {
    fn: function(startDate, endDate) {
      return {
        date: {
          $gte: startDate,
          $lte: endDate
        }
      };
    }
  }
};

/**
 * Setup/Model Processing
 */
Tinytest.add("centiq:client-collection-filter - FilterService - Model Processing", function(test) {

  var withModel = new FilterService(filterTestModel);

  /**
   * Cached model matches what was passed in
   */
  test.equal(withModel._model, filterTestModel);

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
  test.equal(fields[0].label, 'Foo1');
  test.isTrue(_.has(fields[1], 'label'));
  test.equal(fields[1].label, 'foobar');
  test.isTrue(_.has(fields[2], 'label'));
  test.equal(fields[2].label, 'Foo3');
  test.isTrue(_.has(fields[3], 'label'));
  test.equal(fields[3].label, 'Foo4');
  test.isTrue(_.has(fields[4], 'label'));
  test.equal(fields[4].label, 'Foo5');

  /**
   * Types pass through/are assigned correctly
   */
  test.isTrue(_.has(fields[0], 'type'));
  test.equal(fields[0].type, 'string');
  test.isTrue(_.has(fields[1], 'type'));
  test.equal(fields[1].type, 'number');
  test.isTrue(_.has(fields[2], 'type'));
  test.equal(fields[2].type, 'enum');
  test.isTrue(_.has(fields[3], 'type'));
  test.equal(fields[3].type, 'range');
  test.isTrue(_.has(fields[4], 'type'));
  test.equal(fields[4].type, 'string');

  /**
   * enumArray is an empty array for non enum types
   */
  test.isTrue(_.has(fields[0], 'enumArray'));
  test.equal(fields[0].enumArray.length, 0);
  test.isTrue(_.has(fields[1], 'enumArray'));
  test.equal(fields[1].enumArray.length, 0);
  test.isTrue(_.has(fields[2], 'enumArray'));
  test.equal(fields[2].enumArray.length, 2);
  test.isTrue(_.has(fields[3], 'enumArray'));
  test.equal(fields[3].enumArray.length, 0);
  test.isTrue(_.has(fields[4], 'enumArray'));
  test.equal(fields[4].enumArray.length, 0);

  /**
   * enumStatus object is created properly for enum types
   */
  var enumStatus = {
    0: {
      index: 0,
      enabled: true
    },
    1: {
      index: 1,
      enabled: true
    }
  };
  test.isTrue(_.has(fields[0], 'enumStatus'));
  test.equal(fields[0].enumStatus, {});
  test.isTrue(_.has(fields[1], 'enumStatus'));
  test.equal(fields[1].enumStatus, {});
  test.isTrue(_.has(fields[2], 'enumStatus'));
  test.equal(fields[2].enumStatus, enumStatus);
  test.isTrue(_.has(fields[3], 'enumStatus'));
  test.equal(fields[3].enumStatus, {});
  test.isTrue(_.has(fields[4], 'enumStatus'));
  test.equal(fields[4].enumStatus, {});

  /**
   * All fields are disabled by default
   */
  test.isTrue(_.has(fields[0], 'enabled'));
  test.isFalse(fields[0].enabled);
  test.isTrue(_.has(fields[1], 'enabled'));
  test.isFalse(fields[1].enabled);
  test.isTrue(_.has(fields[2], 'enabled'));
  test.isFalse(fields[2].enabled);
  test.isTrue(_.has(fields[3], 'enabled'));
  test.isFalse(fields[3].enabled);
  test.isTrue(_.has(fields[4], 'enabled'));
  test.isFalse(fields[4].enabled);

  /**
   * rangeOptions get set/assigned properly
   */
  test.isTrue(_.has(fields[0], 'rangeOptions'));
  test.equal(fields[0].rangeOptions, {});
  test.isTrue(_.has(fields[1], 'rangeOptions'));
  test.equal(fields[1].rangeOptions, {});
  test.isTrue(_.has(fields[2], 'rangeOptions'));
  test.equal(fields[2].rangeOptions, {});
  test.isTrue(_.has(fields[3], 'rangeOptions'));
  test.equal(fields[3].rangeOptions, filterTestModel.fields[3].rangeOptions);
  test.isTrue(_.has(fields[4], 'rangeOptions'));
  test.equal(fields[4].rangeOptions, {});

  /**
   * dateFilter base checks
   */
  var df = withModel.dateFilter();

  /**
   * Check dateFilter has been set
   */
  test.isNotNull(df);

  /**
   * Test dateFilter defaults
   */
  test.isTrue(_.isFunction(df.fn));
  test.isTrue(_.has(df, 'label'));
  test.equal(df.label, 'Date Filter');
  test.isTrue(_.has(df, 'enabled'));
  test.isFalse(df.enabled);
  test.isTrue(_.has(df, 'key'));
  test.equal(df.key, '_dateFilter');
  test.isTrue(_.has(df, 'startDate'));
  test.isTrue(df.startDate instanceof Date);
  test.isTrue(_.has(df, 'endDate'));
  test.isTrue(df.endDate instanceof Date);

  /**
   * Test both functions output the same value
   */
  test.equal(df.fn(1,2), filterTestModel.dateFilter.fn(1,2));
});

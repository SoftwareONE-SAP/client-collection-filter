**Disclaimer: This is a very early version, and still under development.  The API is not fixed and likely to change.  When including in your project, lock to a specific version**

# Client Collection Filtering

Provides a wrapper to your collection to allow the generation of client side mongo queries.  The wrapper `ClientCollectionFilter` proxies just the `find()` method of the collection, mixing in the generated filters from the `FilterService`.

*Note: At present this has only been tested with client-side collections, not with any publications/subscriptions.*

## Modelling your filter

The `FilterService` accepts a model which describes what to allow filtering on. The model has a `fields` array, and a `dateFilter` object:

```javascript
var MyFilterModel = {
  fields: [{
    key: 'foo',
    label: 'bar',
    type: 'string'
  }]
};
```

Key | Type | Description
--- | ---- | -----------
`fields` | `(Array)` | Array of field objects to filter on
`textFilterLabel` | `(String)` | Optional text filter label


### Fields

You can pass in the following values in a field object:

Key | Type | Description
--- | ---- | -----------
`key`  | `(String)` | `*required` The field key on the object being filtered.
`label` | `(String)` | The text label to go show with the filter. Defaults to `key` with first letter in upper case.
`type` | `(String)` | The type of filter, can be one of `['string', 'number', 'enum', 'range']`.  Defaults to 'string'.
`options` | `(Object)` | A hash of options specific to the filter type
`enabled` | `(Boolean)` | Whether the filter is initially active or not. Default: `false`

If only a `key` value is passed in, the `type` defaults to string and the text filter will apply to that field.

For `date`, `enum` and `range` types, you must also include the options hash.

The `label` is only used in the templating.

The available filter types are below.

Type | Filter outcome
-------|---------------
`string` | Regex match `/.*sample text.*/i`
`number` | Exact match if the text filter input can be cast to a number.
`date` | Filters based on date values passed.
`enum` | Requires an array of enum objects, `enumArray`, described below
`range` | Requires a `rangeOptions` object, described below.


### String / Number

String and number types are both driven from the text filter box. 

The `string` type will use regex to check if the text filter box's value is anywhere in the field.

```javascript
{
  key: 'title',
  label: 'Title',
  type: 'string'
}
```

The `number` type will, if the text filter box's value can be cast to a number, match exactly.  The `number` type assumes you are applying to a field where the value is a number.

```javascript
{
  key: 'count',
  label: 'Member count',
  type: 'number'
}
```


### Date

A `date` filter will provide two dates, a `start` and `end`, and generate a filter based upon these values.  The `date` filter only works when the field in the collection has Date objects.

A `date` filter does not require an `options` object.  If no options are provided, both `start` and `end` dates will default to `new Date()`.

Key | Type | Description
--- | ---- | -----------
`start` | `(Date)` | Optional, Date object, date strings or epoch times. Default: `new Date()`
`end` | `(Date)` | Optional, Date object, date strings or epoch times. Default: `new Date()`
`type` | `(String)` | Optional, used in default filtering functions, one of [`before`, `after`, `between`, `equals`]. Default: `between`
`allowTypeChange` | `(Boolean)` | Optional, allows the type to change. Default: `false`

The default filter function takes into account the type.  In the default template, only the `between` type shows and uses both date boxes.

If `allowTypeChange` is `true`, then a set of radio buttons for changing the type is displayed.

Type | Filter
---- | ------
`before` | Dates up to and including the `start` date
`after` | Dates including and after the `start` date
`between` | Dates between the `start` and `end dates
`equals` | Dates matching the `start` date


```javascript
{
  key: 'expiry_date',
  label: 'Expires',
  type: 'date',
  options: {
    start: new Date('2015-01-01'),
    end: new Date('2015-02-01')
  }
}
```


### Enum

An `enum` filter allows you to create a filter which returns documents which have the enabled options.  The default template can render as a set of buttons or as a list of checkboxes.

An `enum` filter requires an `options` object.  

Key | Type | Description
--- | ---- | -----------
`data` | `(Object)` | Required, A hash of options objects (described below)
`list` | `(Boolean)` | Optional, used to display a list instead of buttons, default: `false`


The `data` object is a has of options objects, where the key for an object is a string representation of it's `value`:

Key | Type | Description
--- | ---- | -----------
`value` | `(String, Number, Boolean)` | Required, the value in the document
`label` | `(String)` | Optional, label to display for this option. Default: String `value` with first character in uppercase
`enabled` | `(Boolean)` | Optional, if the option is enabled when first rendered. Default: `false`

```javascript
{
  key: 'status',
  label: 'Status',
  type: 'enum',
  options: {
    data: {
      "0": {
        value: 0,
        label: 'New'
      },
      "1": {
        value: 1,
        label: 'Activated',
        enabled: true
      },
      "3": {
        value: 3,
        label: 'Deactivated'
      }
    }
  }
}
```


### Range

A `range` field is intended to be used with `<input type="range" />`.  It provides a slider and creates a filter with the value as an inclusive `min` or `max`.

A `range` filter requires an `options` object.  

Key | Type | Description
--- | ---- | -----------
`min` | `(Number)` | Required, The minimum value for the range slider
`max` | `(Number)` | Required, The maximum value for the range slider
`value` | `(Number)` | Optiona, The initial value for the slider, Default: `min` + ((`max` - `min`) / 2)
`type` | `(String)` | Optional, One of [`min`, `max`], default: `max`
`allowTypeChange` | `(Boolean)` | Optional, allows the type to change. Default: `false`

If `allowTypeChange` is `true`, then a set of radio buttons for changing the type is displayed.

An example field object:

```javascript
{
  key: 'length',
  label: 'Length',
  type: 'range',
  options: {
    min: 0,
    max: 1000,
    value: 100,
    type: 'min',
    allowTypeChange: true
  }
}
```

## Filter functions

For the `date`, `enum`, and `range` filter types, there are default functions to create the filter objects.  These can be overriden by providing a function in the `options` object as `fn`.  This function takes one parameter, `field`, as the field object itself.

During the processing of the field object, for `date` and `enum` types, the `options.data` key is used to generate the `options._data` key, and your functions should use the values in `options._data`.  This is so reactive data can be used.

An example `date` filter function, which checks if time between the `start_date` and `end_date` overlaps the date range provided:

```javascript
{
  key: 'start_date',
  label: 'Active between',
  type: 'date',
  options: {
    data: {
      start: new Date('2015-01-01'),
      end: new Date('2015-02-01')
    },
    fn: function(field) {
      return {
        start_date: {
          $lte: moment(field.options.end).endOf('day').toDate()
        },
        end_date: {
          $gte: moment(field.options.start).startOf('day').toDate()
        }
      };
    }
  }
}
```

## Using

The order of instantiation is shown below:

```javascript
// The source collection
MyCollection = new Meteor.Collection(null);

// The filter model
MyCollectionModel = {};

// The filtered collection
MyFilteredCollection = new ClientCollectionFilter(MyCollectionModel, MyCollection);
```

The `ClientCollectionFilter` takes a model as described above for it's first argument (required). The second, optional, argument is the collection it will be filtering.  If no collection is passed, an empty client side collection is created, and is available on `MyFilteredCollection.collection`.  The second argument may also be an array of data objects, which will be passed into a the collection.

The FilterService instance is available using the method `MyFilteredCollection.filter()`.

You can then replace your normal `find()` call with a call to `MyFilteredCollection.find()`, and the filters from the `FilterService` will be applied to the query in a reactive manner.


## Reactive Modelling

The model can be an object, or a `ReactiveVar` containing a model object. Additionally, for an `enum` or `date` field, the `options.data` value can be a `ReactiveVar` containing the `data` object as specified above.

This means you can use a `Tracker.autorun` to update the model or the `data` objects, and have those changes reflect on your filter panel.

For example, to generate an enum for all available values in a particular field:

```javascript
DataReactiveVar = new ReactiveVar({});

Model = {
  fields: [{
    key: 'type',
    type: 'enum',
    options: {
      data: DataReactiveVar
    }
  }]
};

MyFilteredCollection = new ClientCollectionFilter(Model);

DataTracker = Tracker.autorun(function() {
  var newData = {}
  MyFilteredCollection.collection.find({}, {
    fields: {
      type: 1
    }
  }).forEach(function(obj) {
    if (_.has(newData, obj.type)) {
      newData[obj.type].count++;
    } else {
      newData[obj.type] = {
        value: obj.type,
        count: 1
      };
    }
  });

  _.each(newData, function(option) {
    option.label = option.value + ' (' + option.count + ')';
    delete option.count;
  });

  DataReactiveVar.set(newData);
});
```

# To do

- [ ] Improve text filter
- [x] Provide basic templates
- [x] Refactor dateFilter to allow a field to be `date` or `dateRange` type.
- [ ] Complete testing
- [ ] Investigate having `$or` as root filter object instead of `$and`
- [x] Clean up argument names

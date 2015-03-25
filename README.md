**Disclaimer: This is a very early version, and still under development.  The
API is not fixed and likely to change.  When including in your project, lock to
a specific version**

# Client Collection Filtering

Provides a wrapper to your collection to allow the generation of client side
mongo queries.  The wrapper `ClientCollectionFilter` proxies just the `find()`
method of the collection, mixing in the generated filters from the
`FilterService`.

*Note: At present this has only been tested with client-side collections, not
with any publications/subscriptions. *

## Modelling your filter

The `FilterService` accepts a model which describes what to allow filtering on.
The model has a `fields` array, and a `dateFilter` object:

```javascript
var MyFilterModel = {
  fields: [{
    key: 'foo',
    label: 'bar',
    type: 'string'
  }],
  dateFilter: {
    fn: function(startDate, endDate) {
      return {
        created: {
          $gte: startDate,
          $lte: endDate
        }
      };
    }
  }
};
```

### Fields

You can pass in the following values in a field object:

Key | Type | Description
--- | --- | ---
`key`  | `(String)` | `*required` The field key on the object being filtered.
`label` | `(String)` | The text label to go show with the filter. Defaults to `key` with first letter in upper case.
`type` | `(String)` | The type of filter, can be one of `['string', 'number', 'enum', 'range']`.  Defaults to 'string'.

The `key` is the only required property for a field object.  When just as `key`
value is passed in, the `type` defaults to string and the text filter will apply
to that field.

The `label` is only used in the templating.

Type | Filter outcome
-------|---------------
`string` | Regex match `/.*sample text.*/i`
`number` | Exact match if the text filter input can be cast to a number.
`enum` | Requires an array of enum objects, `enumArray`, described below
`range` | Requires a `rangeOptions` object, described below.


### Enum

An enum filter will provide a set of toggle options for each option in the
`enumArray`:

```javascript
{
  key: 'status',
  label: 'Status',
  type: 'enum',
  enumArray: [{
    value: 0,
    text: 'New'
  }, {
    value: 1,
    text: 'Activated'
  }, {
    value: 3,
    text: 'Deactivated'
  }]
}
```

Each option can be toggled on and off by calling the `toggleEnum` method on the
instantiated Filter Service with the field `key` and the option `value`.

While not a strict enum, this allows you to order and restrict the options
available in the filter.  Options will be displayed in the order of the
`enumArray`.

### Range

A range field is intended to be used with `<input type="range" />`.  It requires
a `rangeOptions` object to passed in the field object.  There are two additional
field options which are not require:, `rangeType` and `fn`.

An example field object:

```javascript
{
  key: 'range',
  label: 'Range Between',
  type: 'range',
  rangeOptions: {
    min: 0,
    max: 2000000,
    value: 800000,
    name: 'fieldName-range',
    id: 'fieldNameRangeSlider'
  }
}
```

The `rangeOptions` object has the following available keys:

Key | Type | Description
--- | --- | ---
`min` | `(Number)` | `*required` Minimum value for the slider
`max` | `(Number)` | `*required` Maximum value for the slider
`value` | `(Number)` | Initial value for the slider. Default: `max`/2
`name` | `(String)` | Name for the range slider
`id` | `(String)` | Unique id for the range slider

Additional options for the field object:

Key | Type | Description
--- | --- | ---
`rangeType` | `(String)` | One of `['min', 'max']` - Changes whether the filter is up to or from the `value`. Default: `max`.
`fn` | `(Function)` | Overrides `rangeType`. A function taking a single `value` argument which returns the filter object that gets merged into the `filters()` output.

The `fn` function is useful when you need more complex login for filtering your
data. For example, if you had some invoice data with a status `0` for unpaid and
`1` for paid, and the table displaying the data had a balance column which
showed the `outstanding_balance` if unpaid, and the `value` if paid.  When the
filter is applied, you want to show only the records with a balance maxixmum of
the filter value, your `fn` function would be:

```javascript
fn: function(value) {
  return {
    $or: [{
      status: 0,
      outstanding_balance: {
        $lte: value
      }
    }, {
      status: 1,
      value: {
        $lte: value
      }
    }]
  };
}
```

### Date Filter

There is a single date filter available on the FilterService.  This requires
the `dateFilter` object to be configured.

The `dateFilter` object only has two keys:

Key | Type | Description
--- | --- | ---
`label` | `(String)` | Label to display above the Date Filter.  Defaults to "Date Filter".
`fn` | `(Function)` | `*required` A function taking two Date objects as the arguments, start and end dates, and returns the filter object to be used

An example `fn` function would be:

```javascript
fn: function(value) {
  return {
    date: {
      $gte: startDate,
      $lte: endDate
    }
  };
}
```



## Using

The order of instantiation is shown below:

```javascript
// The source collection
MyCollection = new Meteor.Collection(null);

// The filter model
MyCollectionModel = {};

// The filter itself
MyCollectionFilter = new FilterService(MyCollectionModel);

// The filtered collection
MyFilteredCollection = new ClientCollectionFilter(MyCollection, MyCollectionFilter);
```

The `FilterService` takes a model as described above for it's only argument.
The `ClientCollectionFilter` takes the collection it will be filtering as the
first argument and the `FilterService` instance for that collection as the
second.

You can then replace your normal `find()` call with a call to
`MyFilteredCollection.find()`, and the filters from the `FilterService` will be
applied to the query in a reactive manner.


# To do

- [] Improve text filter
- [] Provide basic templates
- [] Refactor dateFilter to allow a field to be `date` or `dateRange` type.
- [] Complete testing
- [] Investigate having `$or` as root filter object instead of `$and`
- [] Clean up argument names

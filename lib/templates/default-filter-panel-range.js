Template.DefaultFilterPanelRange.events({
  'change input[type="range"]': function(event, template) {
    return Template.parentData(5).filter.setRangeValue(
      template.data.key,
      event.currentTarget.value
    );
  },
  'click input[type="radio"]': function(event, template) {
    return Template.parentData(5).filter.setFieldSubType(
      template.data.key,
      event.currentTarget.value
    );
  }
});

Template.DefaultFilterPanelRange.helpers({
  attributes: function() {
    var attr = {
      type: 'range',
      min: this.options.min,
      max: this.options.max,
      value: this.options.value
    };
    return attr;
  },
  typeAttributes: function(type) {
    var attr = {
      id: 'rangeFilter_' + this.key + '_' + type,
      type: 'radio',
      name: 'rangeFilter_' + this.key + '_type',
      value: type
    };
    if (type === this.options.type) {
      attr.checked = true;
    }
    return attr;
  }
});

Template.DefaultFilterPanelDate.events({
  'change input[type="text"]': function(event, template) {
    if (!template.datesInitialised) {
      return;
    }

    var start = template.startPicker.getDate(),
      end = template.endPicker.getDate(),
      id = event.currentTarget.id;

    /**
     * Ensure range is valid
     */
    if ((start instanceof Date && end === null) || (id.indexOf('_start', id.length - 6) >= 0 && start > end)) {
      template.endPicker.setDate(start, true);
      end = template.endPicker.getDate();
    }
    if ((end instanceof Date && start === null) || (id.indexOf('_end', id.length - 4) >= 0 && end < start)) {
      template.startPicker.setDate(end, true);
      start = template.endPicker.getDate();
    }

    Template.parentData(5).filter.setDateValues(this.key, start, end);
  },
  'click input[type="radio"]': function(event, template) {
    return Template.parentData(5).filter.setFieldSubType(
      template.data.key,
      event.currentTarget.value
    );
  }
});

Template.DefaultFilterPanelDate.helpers({
  attributes: function(type) {
    var attr = {
      type: 'text',
      id: 'dateFilter_' + this.key + '_' + type
    };
    return attr;
  },
  typeAttributes: function(type) {
    var attr = {
      id: 'dateFilter_' + this.key + '_' + type,
      type: 'radio',
      name: 'dateFilter_' + this.key + '_type',
      value: type
    };
    if (type === this.options.type) {
      attr.checked = true;
    }
    return attr;
  },
  betweenAttributes: function() {
    var attr = {};
    if (this.options.type !== 'between') {
      attr.style = 'display: none;';
    }
    return attr;
  }
});

Template.DefaultFilterPanelDate.onRendered(function() {
  this.initialised = false;
  this.startPicker = new Pikaday({
    field: this.$("#dateFilter_" + this.data.key + "_start")[0],
    defaultDate: this.data.options.data.start,
    setDefaultDate: true
  });
  this.endPicker = new Pikaday({
    field: this.$("#dateFilter_" + this.data.key + "_end")[0],
    defaultDate: this.data.options.data.end,
    setDefaultDate: true
  });
  this.datesInitialised = true;
});

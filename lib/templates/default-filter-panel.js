Template.DefaultFilterPanel.events({
  'click h4': function(event, template) {
    return template.data.filter.setFieldEnabled(this.key, !this.enabled);
  }
});

Template.DefaultFilterPanel.helpers({
  /**
   * Return fields which have tempaltes (not string and number)
   * @return {Array} Array of field objects
   */
  fields: function() {
    return _.filter(this.filter.fields(), function(field) {
      return field.type === 'enum' ||
        field.type === 'date' ||
        field.type === 'range';
    });
  },

  /**
   * Check the fields type
   * @param  {String}  type Field type
   * @return {Boolean}      True if matches type provided
   */
  fieldType: function(type) {
    return this.type === type;
  },

  templateType: function() {
    return {
      date: 'DefaultFilterPanelDate',
      'enum': 'DefaultFilterPanelEnum',
      range: 'DefaultFilterPanelRange'
    }[this.type];
  },

  /**
   * Whether to show the global text filter input or not
   * @return {Boolean} True if should show input
   */
  showFilterText: function() {
    return this.filter.showTextFilter();
  },

  /**
   * Assumes context of field object
   * @return {Boolean} True if field is enabled
   */
  isFieldEnabled: function() {
    return Template.parentData().filter.isFieldEnabled(this.key);
  }
});

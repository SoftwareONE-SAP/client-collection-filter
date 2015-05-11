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
    return this.filter.fields();
  },

  /**
   * Returns true if there is a default filter panel template for the type
   * @return {Boolean}
   */
  hasDefaultPanel: function() {
    return this.type === 'enum' ||
      this.type === 'date' ||
      this.type === 'range';
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
  showTextFilter: function() {
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

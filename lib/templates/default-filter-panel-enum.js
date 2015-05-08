Template.DefaultFilterPanelEnum.events({
  'click button, click li': function(event, template) {
    return Template.parentData(5).filter.setEnumOption(
      template.data.key,
      this.value,
      !this.enabled
    );
  }
});

Template.DefaultFilterPanelEnum.helpers({
  attributes: function() {
    var attr = {};
    if (this.enabled) {
      attr.class = "enabled",
      attr.checked = true
    };
    return attr;
  },
  objectValues: function() {
    return _.values(this.options.data);
  }
});

Template.DefaultFilterPanelText.events({
  'keyup input': function(event, template) {
    this.filter.setTextFilter(event.currentTarget.value);
  }
});

Template.DefaultFilterPanelText.helpers({
  label: function() {
    return this.filter.textFilterLabel();
  }
});

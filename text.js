// Substance
// -------------

if (!window.Substance) { var Substance = window.Substance = {}; }


// Helpers
// -------------

_.tpl = function(tpl, ctx) {
  source = $("script[name="+tpl+"]").html();
  return _.template(source, ctx);
};


// Substance.Text
// --------------

// TODO:  Implement link types separatedly due to their CRUD nature?
//        Deleting a link, editing the current url...
//        the same workflow would ideally work for comments (Should we have a 
//        separate part in the UI dedicated to CRUDed elements?)
// TODO:  Should the link be attached to the surface too besides just styling it?
// TODO:  Should comments be always available? i.e. at the same time we are adding 
//        a link we comment about this link instead of having to re-select the range an 
//        adding a comment? this would allow to comment on why one emphasized a part of 
//        the text, or would make it possible to specify when color-marking this marked part is relevant...
// TODO:  Add link back to github from the demo

Substance.Text = Dance.Performer.extend({

  match: {},
  
  events: {
    'click a.tool': 'toggleCommand',
    'click a.toggle-link-interface': 'toggleLinkUI'
  },

  toggleCommand: function(e){
    e.preventDefault();
    var $clicked = $(e.currentTarget);
    var type = $clicked.attr('data-type');
    var isActive = $clicked.hasClass('active');
    var annotations = this.surface.annotations();

    if(isActive) {
      this.surface.remove(this.match);
      this.updateControls({empty: true});
      this.clearStatus();
    }else{
      
      switch(type){
        case 'em':
          this.surface.annotate({
            type: "em"
          });
          break;

        case 'lnk':
          $('div#add-link').hide();
          var url = $('input[data-type="lnk-url"]').val();
          this.surface.annotate({
            type: "lnk",
            data: {
              author: "John Doe",
              url: url
            }
          });

          break;

        case 'str':
          this.surface.annotate({
            type: "str"
          });
          break;

        case 'edit':
          this.surface.enable();
          break;

        case 'save':
          this.surface.disable();
          var content = this.surface.compile();
          $('td[data-type="content-data"]').text(content);
          break;

        case 'cancel':
          this.surface.cancel();
          this.surface.disable();
          break;
      }
    }

  },

  toggleLinkUI: function(){
    $('div#add-link').show();
  },

  initialize: function(options) {
    _.bindAll(this, 'updateControls');
    _.bindAll(this, 'clearStatus');
    _.bindAll(this, 'storeMatch');
    _.bindAll(this, 'setMode');
    _.bindAll(this, 'buildLog');
  },

  // Update Controls
  // ---------------

  updateControls: function(sel) {

    if(typeof sel.type !== 'undefined') {
      // We have a type, annotation has just been added
      // Returns all annotations
      var annotations = this.surface.annotations();
      $('a[data-type="' + sel.type + '"]').addClass('active');
      // debug
      // $log.empty();
    } else{
      // We don't have a type, we are just doing a selection
      // Returns all annotations matching the current selection
      var annotations = this.surface.annotations(sel);
    }

    // Debug
    // -----
    var $log = $('#annotationLog');
    if(sel.empty){
      $log.empty();
    }
    this.buildLog();
    // if it's not from a match event we add one item to the log
    if(!sel.match){
      this.buildLog();
    } else{
    // if it's from a match event we select the matching one
      $('tr#' + sel.id).addClass('active');
    }
  
  },

  storeMatch: function(matchel){
    this.match = matchel;
  },

  buildLog: function(){
    var annotations = this.surface.annotations();
    var $log = $('#annotationLog');

    _.each(annotations, function(annotation) {
      var $current = $('tr#' + annotation.id);
        var tplVars = {
          'id': annotation.id ,
          'type': annotation.type,
          'start': annotation.pos.start,
          'end': annotation.pos.end
        };


        if(typeof annotation.data !== 'undefined'){
          tplVars.autor = JSON.stringify(annotation.data.autor);
          tplVars.autor = JSON.stringify(annotation.data.url);
        }else{
          tplVars.data = 'empty';
        }
        var $tdebug = $('.debug');
        var $thead = $tdebug.find(' thead');
        
        if($thead.is(':hidden')){
          $thead.show();
          $tdebug.find('table[data-type="debug-content"]').show();
        }

      if($current.length === 0){
        $log.append(_.tpl('log', tplVars));
      }else{
        $current.replaceWith(_.tpl('log', tplVars));
      }
    });

  },

  // Clear all the UI selections
  // ----------------------------

  clearStatus: function(){
    // When the selection doesnt match we deselect everything
    $('.toggle-annotation').removeClass('active');
    $('.log').removeClass('active');
  },

  // Listen for Surface Events
  // -------------------------

  registerEvents: function() {
    this.surface.on('selection:change', this.updateControls);
    this.surface.on('annotation:change', this.updateControls);
    this.surface.on('annotation:change', this.storeMatch);
    this.surface.on('annotation:update', this.buildLog);
    this.surface.on('annotation:match', this.updateControls);
    this.surface.on('annotation:match', this.storeMatch);
    this.surface.on('annotation:nomatch', this.clearStatus);
    this.surface.on('mode:change', this.setMode);

    // Victor, what's going on here? :)
    // When we deselect a range i.e by clicking anywhere in surface,
    // we clear the active states from the UI
    this.surface.on('selection:clear', this.clearStatus);
  },

  setMode: function(mode){
    var speed = 100;
    var modes = this.surface.getModes();
    switch(mode){
      case modes.IDLE:
        $('.editor').fadeOut(speed);
        break;

      case modes.OFF:
        $('.editor').fadeOut(speed);
        $('.edit').fadeIn(speed);
        break;

      default:
        $('.edit').fadeOut(speed);
        $('.editor').fadeIn(speed);
        break;
    }
  },

  setValue: function(value){
    this.surface.setValue(value);
  },

  render: function() {
    $(this.el).html(_.tpl('text', {}));

    this.surface = new Substance.Surface(_.extend(this.options, {el: '#content'}));
    this.registerEvents();
    // TODO: smart partial rerenders based on state changes?
    // To be discussed.
    return this;
  }
});
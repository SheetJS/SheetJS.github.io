/** drop target **/
var _target = document.getElementById('drop');

/** Spinner **/
var spinner;

var _workstart = function() { spinner = new Spinner().spin(_target); }
var _workend = function() { spinner.stop(); }

/** Alerts **/
var _badfile = function() {
  alertify.alert('This file does not appear to be a valid Excel file.  If we made a mistake, please send this file to <a href="mailto:dev@sheetjs.com?subject=I+broke+your+stuff">dev@sheetjs.com</a> so we can take a look.', function(){});
};

var _pending = function() {
  alertify.alert('Please wait until the current file is processed.', function(){});
};

var _large = function(len, cb) {
  alertify.confirm("This file is " + len + " bytes and may take a few moments.  Your browser may lock up during this process.  Shall we play?", cb);
};

var _failed = function(e) {
  console.log(e, e.stack);
  alertify.alert('We unfortunately dropped the ball here.  We noticed some issues with the grid recently, so please test the file using the direct parsers for <a href="/js-xls/">XLS</a> and <a href="/js-xlsx/">XLSX</a> files.  If there are issues with the direct parsers, please send this file to <a href="mailto:dev@sheetjs.com?subject=I+broke+your+stuff">dev@sheetjs.com</a> so we can make things right.', function(){});
};

/** Handsontable magic **/
var boldRenderer = function (instance, td, row, col, prop, value, cellProperties) {
  Handsontable.TextCell.renderer.apply(this, arguments);
  $(td).css({'font-weight': 'bold'});
};

var $container, $parent, $window, availableWidth, availableHeight;
var calculateSize = function () {
  var offset = $container.offset();
  availableWidth = Math.max($window.width() - 250,600);
  availableHeight = Math.max($window.height() - 250, 400);
};

$(document).ready(function() {
  $container = $("#hot"); $parent = $container.parent();
  $window = $(window);
  $window.on('resize', calculateSize);
});

/* make the buttons for the sheets */
var make_buttons = function(sheetnames, cb) {
  var $buttons = $('#buttons');
  $buttons.html("");
  sheetnames.forEach(function(s,idx) {
    var button= $('<button/>').attr({ type:'button', name:'btn' +idx, text:s });
    button.append('<h3>' + s + '</h3>');
    button.click(function() { cb(idx); });
    $buttons.append(button);
    $buttons.append('<br/>');
  });
};

var _onsheet = function(json, cols, sheetnames, select_sheet_cb) {
  $('#footnote').hide();

  make_buttons(sheetnames, select_sheet_cb);
  calculateSize();

  /* add header row for table */
  if(!json) json = [];
  json.unshift(function(head){var o = {}; for(i=0;i!=head.length;++i) o[head[i]] = head[i]; return o;}(cols));
  calculateSize();
  /* showtime! */
  $("#hot").handsontable({
    data: json,
    startRows: 5,
    startCols: 3,
    fixedRowsTop: 1,
    stretchH: 'all',
    rowHeaders: true,
    columns: cols.map(function(x) { return {data:x}; }),
    colHeaders: cols.map(function(x,i) { return XLS.utils.encode_col(i); }),
    cells: function (r,c,p) {
      if(r === 0) this.renderer = boldRenderer;
    },
    width: function () { return availableWidth; },
    height: function () { return availableHeight; },
    stretchH: 'all'
  });
};

/** Drop it like it's hot **/
DropSheet({
  drop: _target,
  on: {
    workstart: _workstart,
    workend: _workend,
    sheet: _onsheet,
    foo: 'bar'
  },
  errors: {
    badfile: _badfile,
    pending: _pending,
    failed: _failed,
    large: _large,
    foo: 'bar'
  }
})

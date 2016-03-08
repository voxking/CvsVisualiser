console.log = console.log.bind(console);

var html = {
  DROP: "Drop a <i class=\"icon-file-excel\"></i> <code>.cvs<code> file here!",
  UPLD: "Drag a <i class=\"icon-file-excel\"></i> <code>.cvs<code> file here!<br />Or click here to upload one",
  WAIT: "<i class=\"icon-busy\"></i> please wait ..."
};

var canvas = document.createElement("canvas");
var ctx = canvas.getContext("2d");

var droparea = document.querySelector('.droparea');

var filein = document.querySelector('input#file');

var download = document.querySelector('.download');

var icons = new Image();
icons.src = "icons.png";

var reader = new FileReader;

var name;

filein.addEventListener('change', function () {
  if (this.files.length === 1) {
    var n = name = this.files[0].name;
    if (n.lastIndexOf(".csv") !== n.length - 4) return;
    disableInput();
    reader.readAsText(this.files[0]);
  }
}, false);

reader.addEventListener('load', function () {
  var data = reader.result.split(/\0?\n/g).map(function (row) {
      return row.split(',');
  });

  data.pop();

  var table = wrap(data);

  render(table);

  download.download = name.slice(0, name.lastIndexOf(".csv"))+".png";
  download.href = canvas.toDataURL("image/png");

  enableInput();
}, false);

function wrap(data) {
  var table = new Table();
  data.forEach(function (drow) {
    var row = table.row();
    drow.forEach(function (dval) {
      var match;
      if (match = dval.match(/(\d+(?:\.\d+)?)%\0?/)) {
        row.add(Number(match[1]/100), 1);
      } else {
        var number = Number(dval);
        if (!isNaN(number)) {
          row.add(number, 2);
        } else {
          row.add(dval, 3);
        }
      }
    })
  });
  return table;
}

var $layout = {
  width: 0,
  height: 0,
  column: {width: [], height: 0},
  font: "16px \"Open Sans\" \"Segoe UI\"",
  progress: 0,
  spacing: 0
};

function render(table) {
  ctx.translate(0.5, 0.5);
  layout(table);
  draw(table);
  fill(table);
  ctx.translate(-0.5, -0.5);
}

function fill(table) {
  table.rows.forEach(function (row, r) {
    var x = 0, widths = $layout.column.width, s = $layout.spacing;
    row.values.forEach(function (value, i) {
      var width = widths[i] + 4 * s;
      colone(value.type, value.content, r, x, width);
      x += width;
    })
  });
}

function colone(type,content, r, x, width) {
  color("#333");
  if (r === 0) return center(content, r, x, width);
  color("#111");
  if (type === 3) return left(content, r, x, width);
  if (type === 2) return right(content, r, x, width);
  if (type === 1) return percentage(content, r, x, width);
}

function percentage(content, r, x, width) {
  var n = (100 * content).toFixed(2);
  if (/\d+.00/.test(n)) n = n.slice(0, n.length - 3);
  left(n + "%", r, x, width);
  progressbar(x + width, r, content);
  icon(x + width, r, content);
}

function icon(x, y, value) {
  var s = $layout.spacing;
  ctx.drawImage(icons, x - 3 * s, y * ($layout.column.height + 2 * s) + s, 4, 4, value > 0.5 ? 0 : 4, 0, 4, 4);
}

function progressbar(x, y, value) {
  var s = $layout.spacing, p = $layout.progress;
  var top = y * ($layout.column.height + 2 * s) + s;
  var left = x - p - 5 * s;
  color("hsl(" + (160 * value - 20) + ", 30%, 85%)");
  ctx.fillRect(left, top, p, p / 4);
  color("hsl(" + (160 * value - 20) + ", 70%, 60%)");
  ctx.fillRect(left, top, p * value, p / 4);
}

function right(content, r, x, width) {
  var s = $layout.spacing;
  ctx.fillText(content, x + width - ctx.measureText(content).width - 2 * s, r * ($layout.column.height + 2 * s) + $layout.baseline + s, width);
}

function left(content, r, x, width) {
  var s = $layout.spacing;
  ctx.fillText(content, x + 2 * s, r * ($layout.column.height + 2 * s) + $layout.baseline + s, width);
}

function center(content, r, x, width) {
  var s = $layout.spacing;
  ctx.fillText(content, x + width * 0.5 - ctx.measureText(content).width * 0.5, r * ($layout.column.height + 2 * s)+ $layout.baseline + s, width);
}

function draw(table) {
  resize($layout.width, $layout.height);
  clear("white");
  color("#DDD");
  rectangle(true, 1, 1, 1, canvas.height - 1 - $layout.column.height - 2 * $layout.spacing);
  color("#333");
  rectangle(false, 1, 1, 1, 1);
  color("#444");
  var ch = $layout.column.height;
  var s = $layout.spacing;
  var t = 0; var widths = $layout.column.width;
  table.rows[0].values.forEach(function (_, i) {
    line(widths[i] + t + 4 * s, 1, widths[i] + t + 4 * s, canvas.height - 1);
    t += widths[i] + 4 * s;
  });
  table.rows.forEach(function (_, i) {
    line(1, (2 * s + ch) * (1 + i), canvas.width - 1, (2 * s + ch) * (1 + i));
  });
}

function line(xA, yA, xB, yB) {
  ctx.beginPath()
  ctx.moveTo(xA, yA);
  ctx.lineTo(xB, yB);
  ctx.stroke();
  ctx.closePath()
}

function layout(table) {
  var widths = new Uint16Array(table.rows[0].values.length);
  var match = $layout.font.match(/(\d+)px.*/);
  var size = (match ? parseInt(match[1]) : parseFloat($layout.font));
  $layout.column.height = size;
  $layout.baseline = 0.75 * size;
  $layout.spacing = 0.25 * size;
  $layout.progress = 4 * size;
  ctx.font = $layout.font;
  table.rows.forEach(function (row) {
    row.values.forEach(function (value, i) {
      var width;
      if (value.type > 1) {
        width = ctx.measureText(value.content).width;
      } else {
        var n = (100 * value.content).toFixed(2);
        if (/\d+.00/.test(n)) n = n.slice(0, n.length - 3);
        width = ctx.measureText(n + "%").width + $layout.progress + 3 * $layout.spacing;
      }
      if (widths[i] < width) widths[i] = width;
    });
  });
  $layout.width = widths.reduce(function (t, v) { return t+v + 4 * $layout.spacing }, 0);
  $layout.height = table.rows.length * ($layout.column.height + 2 * $layout.spacing);
  $layout.column.width = widths;
  console.log($layout);
}

function resize(width, height) {
  canvas.width = width;
  canvas.height = height;
}

function clear(clr) {
  ctx.translate(-0.5, -0.5);
  color(clr === void 8 ? "black" : clr);
  rectangle(true, 0, 0, 0, 0);
  ctx.translate(0.5, 0.5);
}

function color(color) {
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
}

function rectangle(fill, left, top, right, bottom) {
  if (fill) {
    ctx.fillRect(left, top, canvas.width - right, canvas.height - bottom);
  } else {
    ctx.strokeRect(left, top, canvas.width - right, canvas.height - bottom);
  }
}

function disableInput() {
  droparea.setAttribute('for', null);
  droparea.innerHTML = html.WAIT;
  download.hidden = true;
  droparea.style.cursor = "wait";
}

function enableInput() {
  droparea.setAttribute('for', 'file');
  droparea.innerHTML = html.UPLD;
  droparea.style.cursor = null;
  download.hidden = false;
}
droparea.setAttribute('for', 'file');
droparea.innerHTML = html.UPLD;
droparea.style.cursor = null;

var Table = (function () {
  function Table() {
    this.rows = [];
  }
  Table.prototype.row = function row() {
    var row = new Row();
    this.rows.push(row);
    return row;
  };
  return Table;
}())

var Row = (function () {
    function Row() {
        this.values = [];
    }
    Row.prototype.add = function add(value, type) {
        this.values.push(new Value(value, type));
    };
    return Row;
}())

var Value = (function () {
    function Value(content, type) {
        this.content = content;
        this.type = type;
    }
    return Value;
}())

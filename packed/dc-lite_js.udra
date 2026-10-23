/* dc-lite: renders a Design Component template (holes, sc-if, sc-for, events, refs)
   with its DCLogic class on React 18, so the canvas screen runs unchanged as a standalone page. */
(function () {
  var R = window.React, RD = window.ReactDOM;
  var EVT = {
    onclick: 'onClick', onchange: 'onChange', oninput: 'onInput', onkeydown: 'onKeyDown', onkeyup: 'onKeyUp',
    onpointerdown: 'onPointerDown', onpointerup: 'onPointerUp', onpointermove: 'onPointerMove', onpointercancel: 'onPointerCancel',
    onmousedown: 'onMouseDown', onmouseup: 'onMouseUp', onmousemove: 'onMouseMove', onfocus: 'onFocus', onblur: 'onBlur',
    ontouchstart: 'onTouchStart', ontouchend: 'onTouchEnd', ontouchmove: 'onTouchMove'
  };

  function DCLogic() { this.props = {}; this.state = null; }
  DCLogic.prototype.setState = function (o) { if (this.__host) this.__host.__set(o); else this.state = Object.assign({}, this.state, o); };
  DCLogic.prototype.forceUpdate = function () { if (this.__host) this.__host.forceUpdate(); };
  DCLogic.prototype.componentDidMount = function () {};
  DCLogic.prototype.componentDidUpdate = function () {};
  DCLogic.prototype.componentWillUnmount = function () {};
  DCLogic.prototype.renderVals = function () { return {}; };
  window.DCLogic = DCLogic;

  function lookup(path, scopes) {
    path = path.trim();
    if (path === 'true') return true;
    if (path === 'false') return false;
    if (path === 'null') return null;
    if (/^-?\d+(\.\d+)?$/.test(path)) return Number(path);
    var parts = path.split('.');
    for (var i = 0; i < scopes.length; i++) {
      var sc = scopes[i];
      if (sc && Object.prototype.hasOwnProperty.call(sc, parts[0])) {
        var v = sc[parts[0]];
        for (var j = 1; j < parts.length; j++) { if (v == null) return undefined; v = v[parts[j]]; }
        return v;
      }
    }
    return undefined;
  }
  var ONLY = /^\s*\{\{([^}]+)\}\}\s*$/;
  function text(str, scopes) {
    return str.replace(/\{\{([^}]+)\}\}/g, function (_, p) { var v = lookup(p, scopes); return v == null ? '' : String(v); });
  }
  function value(str, scopes) { var m = str.match(ONLY); return m ? lookup(m[1], scopes) : (str.indexOf('{{') >= 0 ? text(str, scopes) : str); }
  function styleObj(s) {
    var o = {};
    s.split(';').forEach(function (d) {
      var i = d.indexOf(':'); if (i < 0) return;
      var k = d.slice(0, i).trim(), v = d.slice(i + 1).trim(); if (!k) return;
      if (k.indexOf('--') !== 0) k = k.replace(/^-webkit-/, 'Webkit-').replace(/-([a-z])/g, function (_, c) { return c.toUpperCase(); });
      o[k] = v;
    });
    return o;
  }

  function compile(node) {
    if (node.nodeType === 3) {
      var t = node.nodeValue;
      if (t.indexOf('{{') < 0) return /^\s*$/.test(t) && t.indexOf('\n') >= 0 ? null : function () { return t; };
      return function (sc) { return text(t, sc); };
    }
    if (node.nodeType !== 1) return null;
    var tag = node.localName;
    if (tag === 'helmet' || tag === 'script') return null;
    var kids = [];
    node.childNodes.forEach(function (c) { var f = compile(c); if (f) kids.push(f); });
    function children(sc) { return kids.map(function (k) { return k(sc); }); }
    if (tag === 'sc-if') {
      var cond = node.getAttribute('value') || '';
      return function (sc) { return value(cond, sc) ? R.createElement.apply(null, [R.Fragment, null].concat(children(sc))) : null; };
    }
    if (tag === 'sc-for') {
      var list = node.getAttribute('list') || '', as = node.getAttribute('as') || 'item';
      return function (sc) {
        var arr = value(list, sc) || [];
        return R.createElement.apply(null, [R.Fragment, null].concat(arr.map(function (it, idx) {
          var local = { $index: idx }; local[as] = it;
          return R.createElement.apply(null, [R.Fragment, { key: idx }].concat(children([local].concat(sc))));
        })));
      };
    }
    var attrs = [];
    for (var i = 0; i < node.attributes.length; i++) {
      var a = node.attributes[i];
      if (a.name.indexOf('hint-') === 0) continue;
      attrs.push({ name: a.name, raw: a.value });
    }
    return function (sc) {
      var p = {};
      attrs.forEach(function (a) {
        var n = a.name, v = value(a.raw, sc);
        if (n === 'class') n = 'className';
        else if (n === 'for') n = 'htmlFor';
        else if (n.indexOf('on') === 0) { n = EVT[n.toLowerCase()] || n; if (typeof v !== 'function') return; }
        if (n === 'style') { p.style = typeof v === 'string' ? styleObj(v) : v; return; }
        if (n === 'ref') { if (typeof v === 'function') p.ref = v; return; }
        if (v === undefined || v === null) return;
        if (v === false) { if (n.indexOf('aria-') === 0) p[n] = 'false'; else if (n === 'disabled' || n === 'checked') p[n] = false; return; }
        if (v === true && n.indexOf('aria-') === 0) v = 'true';
        p[n] = v;
      });
      return R.createElement.apply(null, [tag, p].concat(children(sc)));
    };
  }

  function makeHost(Logic, renderers) {
    function Host(props) {
      R.Component.call(this, props);
      this.logic = new Logic();
      this.logic.props = props.props || {};
      this.logic.state = null;
      this.logic.__host = this;
      this.state = { v: 0 };
    }
    Host.prototype = Object.create(R.Component.prototype);
    Host.prototype.constructor = Host;
    Host.prototype.__set = function (o) {
      this.logic.state = Object.assign({}, this.logic.state, o);
      this.setState(function (s) { return { v: s.v + 1 }; });
    };
    Host.prototype.componentDidMount = function () { try { this.logic.componentDidMount(); } catch (e) { console.error(e); } };
    Host.prototype.componentDidUpdate = function () { try { this.logic.componentDidUpdate(); } catch (e) { console.error(e); } };
    Host.prototype.componentWillUnmount = function () { try { this.logic.componentWillUnmount(); } catch (e) { console.error(e); } };
    Host.prototype.render = function () {
      this.logic.props = this.props.props || {};
      var vals = this.logic.renderVals();
      return R.createElement.apply(null, [R.Fragment, null].concat(renderers.map(function (f) { return f([vals]); })));
    };
    return Host;
  }

  window.DCLite = {
    mount: function (el, templateEl, Logic, props) {
      var renderers = [];
      templateEl.content.childNodes.forEach(function (c) { var f = compile(c); if (f) renderers.push(f); });
      var Host = makeHost(Logic, renderers), root = RD.createRoot(el);
      var render = function (p) { root.render(R.createElement(Host, { props: p })); };
      render(props || {});
      return { update: render };
    }
  };
})();

"use strict";
/*! *****************************************************************************
	Copyright (c) Microsoft Corporation. All rights reserved.
	Licensed under the Apache License, Version 2.0 (the "License"); you may not use
	this file except in compliance with the License. You may obtain a copy of the
	License at http://www.apache.org/licenses/LICENSE-2.0

	THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
	KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
	WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
	MERCHANTABLITY OR NON-INFRINGEMENT.

	See the Apache Version 2.0 License for specific language governing permissions
	and limitations under the License.
	***************************************************************************** */
var _extendStatics = function extendStatics(d, b) {
	return (_extendStatics = Object.setPrototypeOf || {
			__proto__: []
		}
		instanceof Array && function (d, b) {
			d.__proto__ = b;
		} || function (d, b) {
			for (var p in b) {
				b.hasOwnProperty(p) && (d[p] = b[p]);
			}
		})(d, b);
};
var _assign = function __assign() {
	return (_assign = Object.assign || function (t) {
		for (var s, i = 1, n = arguments.length; i < n; i++) {
			for (var p in s = arguments[i]) {
				Object.prototype.hasOwnProperty.call(s, p) && (t[p] = s[p]);
			}
		}
		return t;
	}).apply(this, arguments);
};

function fill(v, val) {
	for (var i = 0; i < v.length; i++) {
		v[i] = val;
	}
	return v;
}

function map(v, func) {
	for (var i = 0; i < v.length; i++) {
		v[i] = func(v[i], i);
	}
	return v;
}

function reduce(v, func, r) {
	void 0 === r && (r = 0);
	for (var i = 0; i < v.length; i++) {
		r = func(r, v[i], i);
	}
	return r;
}
var EPS = Math.pow(2, -42);

function cuberoot(x) {
	var y = Math.pow(Math.abs(x), 1 / 3);
	return x < 0 ? -y : y;
}

function getQuadRoots(a, b, c) {
	if (Math.abs(a) < EPS) return Math.abs(b) < EPS ? [] : [-c / b];
	var D = b * b - 4 * a * c;
	return Math.abs(D) < EPS ? [-b / (2 * a)] : D > 0 ? [(-b + Math.sqrt(D)) / (2 * a), (-b - Math.sqrt(D)) / (2 * a)] : [];
}

function getCubicRoots(a, b, c, d) {
	if (Math.abs(a) < EPS) return getQuadRoots(b, c, d);
	var roots,
		p = (3 * a * c - b * b) / (3 * a * a),
		q = (2 * b * b * b - 9 * a * b * c + 27 * a * a * d) / (27 * a * a * a);
	if (Math.abs(p) < EPS) roots = [cuberoot(-q)];
	else if (Math.abs(q) < EPS) roots = [0].concat(p < 0 ? [Math.sqrt(-p), -Math.sqrt(-p)] : []);
	else {
		var D = q * q / 4 + p * p * p / 27;
		if (Math.abs(D) < EPS) roots = [-1.5 * q / p, 3 * q / p];
		else if (D > 0) {
			roots = [(u = cuberoot(-q / 2 - Math.sqrt(D))) - p / (3 * u)];
		} else {
			var u = 2 * Math.sqrt(-p / 3),
				t = Math.acos(3 * q / p / u) / 3,
				k = 2 * Math.PI / 3;
			roots = [u * Math.cos(t), u * Math.cos(t - k), u * Math.cos(t - 2 * k)];
		}
	}
	for (var i = 0; i < roots.length; i++) {
		roots[i] -= b / (3 * a);
	}
	return roots;
}

function getCoefficients(v0, v1, v2, v3, v, tension) {
	void 0 === v && (v = 0), void 0 === tension && (tension = .5);
	var c = (1 - tension) * (v2 - v0) * .5,
		x = (1 - tension) * (v3 - v1) * .5;
	return [2 * v1 - 2 * v2 + c + x, -3 * v1 + 3 * v2 - 2 * c - x, c, v1 - v];
}

function solveForT(t, tension, v0, v1, v2, v3) {
	if (Math.abs(t) < EPS) return v1;
	if (Math.abs(1 - t) < EPS) return v2;
	var t2 = t * t,
		t3 = t * t2,
		_a = getCoefficients(v0, v1, v2, v3, 0, tension);
	return _a[0] * t3 + _a[1] * t2 + _a[2] * t + _a[3];
}

function getDerivativeOfT(t, tension, v0, v1, v2, v3) {
	var t2 = t * t,
		_a = getCoefficients(v0, v1, v2, v3, 0, tension);
	return 3 * _a[0] * t2 + 2 * _a[1] * t + _a[2];
}

function distance(p1, p2) {
	return Math.sqrt(reduce(p2, function (s, c, i) {
		return s + Math.pow(c - p1[i], 2);
	}));
}

function normalize(v) {
	var squared = reduce(v, function (s, c) {
			return s + Math.pow(c, 2);
		}),
		l = Math.sqrt(squared);
	return 0 === l ? fill(v, 0) : map(v, function (c) {
		return c / l;
	});
}

function orthogonal(v) {
	if (v.length > 2) throw Error("Only supported for 2d vectors");
	var x = -v[1];
	return v[1] = v[0], v[0] = x, v;
}

function clamp(value, min, max) {
	return void 0 === min && (min = 0), void 0 === max && (max = 1), value < min ? min : value > max ? max : value;
}

function getControlPoints(idx, points, closed) {
	var p0,
		p1,
		p2,
		p3,
		maxIndex = points.length - 1;
	return closed ? (p0 = points[idx - 1 < 0 ? maxIndex : idx - 1], p1 = points[idx % points.length], p2 = points[(idx + 1) % points.length], p3 = points[(idx + 2) % points.length]) : (p0 = points[Math.max(0, idx - 1)], p1 = points[idx], p2 = points[Math.min(maxIndex, idx + 1)], p3 = points[Math.min(maxIndex, idx + 2)]), [p0, p1, p2, p3];
}

function getPointAtT(t, points, options, target) {
	void 0 === options && (options = {});
	var tension = Number.isFinite(options.tension) ? options.tension : .5,
		closed = !!options.closed,
		func = options.func || solveForT,
		nPoints = closed ? points.length : points.length - 1,
		p = nPoints * t,
		idx = Math.floor(p),
		weight = p - idx,
		_a = getControlPoints(idx, points, closed),
		p0 = _a[0],
		p1 = _a[1],
		p2 = _a[2],
		p3 = _a[3];
	target = target || new Array(p0.length);
	for (var i = 0; i < p0.length; i++) {
		target[i] = func(weight, tension, p0[i], p1[i], p2[i], p3[i]);
	}
	return 3 === nPoints && target[1], target;
}

function getTangentAtT(t, points, options, target) {
	void 0 === options && (options = {});
	var tension = Number.isFinite(options.tension) ? options.tension : .5,
		closed = !!options.closed;
	return 1 === tension && 0 === t ? t += EPS : 1 === tension && 1 === t && (t -= EPS), getPointAtT(t, points, {
		tension: tension,
		closed: closed,
		func: getDerivativeOfT
	}, target);
}

function getArcLengths(points, divisions, options) {
	void 0 === options && (options = {});
	var current,
		lengths = [],
		last = getPointAtT(0, points, options),
		sum = 0;
	divisions = divisions || 300, lengths.push(0);
	for (var p = 1; p <= divisions; p++) {
		sum += distance(current = getPointAtT(p / divisions, points, options), last), lengths.push(sum), last = current;
	}
	return lengths;
}

function getUtoTmapping(u, arcLengths) {
	for (var comparison, il = arcLengths.length, targetArcLength = u * arcLengths[il - 1], low = 0, high = il - 1, i = 0; low <= high;) {
		if ((comparison = arcLengths[i = Math.floor(low + (high - low) / 2)] - targetArcLength) < 0) low = i + 1;
		else {
			if (!(comparison > 0)) {
				high = i;
				break;
			}
			high = i - 1;
		}
	}
	if (arcLengths[i = high] === targetArcLength) return i / (il - 1);
	var lengthBefore = arcLengths[i];
	return (i + (targetArcLength - lengthBefore) / (arcLengths[i + 1] - lengthBefore)) / (il - 1);
}

function getTtoUmapping(t, arcLengths) {
	if (0 === t) return 0;
	if (1 === t) return 1;
	var al = arcLengths.length - 1,
		totalLength = arcLengths[al],
		tIdx = t * al,
		subIdx = Math.floor(tIdx),
		l1 = arcLengths[subIdx];
	return tIdx === subIdx ? l1 / totalLength : (l1 + (tIdx - subIdx) * (arcLengths[subIdx + 1] - l1)) / totalLength;
}

function getTAtValue(lookup, tension, v0, v1, v2, v3) {
	var _a = getCoefficients(v0, v1, v2, v3, lookup, tension),
		a = _a[0],
		b = _a[1],
		c = _a[2],
		d = _a[3];
	return 0 === a && 0 === b && 0 === c && 0 === d ? [0] : getCubicRoots(a, b, c, d).filter(function (t) {
		return t > -EPS && t <= 1 + EPS;
	}).map(function (t) {
		return clamp(t, 0, 1);
	});
}

function valuesLookup(lookup, points, options) {
	for (var _a = _assign({
			axis: 0,
			tension: .5,
			closed: !1,
			margin: .5,
			max: 0,
			processRefAxis: !1,
			func: solveForT
		}, options), func = _a.func, axis = _a.axis, tension = _a.tension, closed = _a.closed, margin = _a.margin, max = _a.max, processRefAxis = _a.processRefAxis, k = axis, solutions = [], nPoints = closed ? points.length : points.length - 1, i = 0; i < nPoints; i += 1) {
		var idx = max < 0 ? nPoints - (i + 1) : i,
			_b = getControlPoints(idx, points, closed),
			p0 = _b[0],
			p1 = _b[1],
			p2 = _b[2],
			p3 = _b[3],
			vmin = void 0,
			vmax = void 0;
		if (p1[k] < p2[k] ? (vmin = p1[k], vmax = p2[k]) : (vmin = p2[k], vmax = p1[k]), lookup - margin <= vmax && lookup + margin >= vmin) {
			var ts = getTAtValue(lookup, tension, p0[k], p1[k], p2[k], p3[k]);
			max < 0 ? ts.sort(function (a, b) {
				return b - a;
			}) : max >= 0 && ts.sort(function (a, b) {
				return a - b;
			});
			for (var j = 0; j < ts.length; j++) {
				if (!(0 === ts[j] && i > 0)) {
					for (var coord = [], c = 0; c < p0.length; c++) {
						var v = void 0;
						v = c !== k || processRefAxis ? func(ts[j], tension, p0[c], p1[c], p2[c], p3[c], idx - 1) : lookup, coord[c] = v;
					}
					if (solutions.push(coord), solutions.length === Math.abs(max)) return solutions;
				}
			}
		}
	}
	return solutions;
}

function positionsLookup(lookup, points, options) {
	for (var _a = _assign({
			axis: 0,
			tension: .5,
			closed: !1,
			margin: .5,
			max: 0
		}, options), axis = _a.axis, tension = _a.tension, closed = _a.closed, margin = _a.margin, max = _a.max, k = axis, solutions = new Set(), arcLengths = options.arcLengths || getArcLengths(points, options.arcDivisions || 300, {
			tension: tension,
			closed: closed
		}), nPoints = closed ? points.length : points.length - 1, i = 0; i < nPoints; i += 1) {
		var idx = max < 0 ? points.length - i : i,
			_b = getControlPoints(idx, points, closed),
			p0 = _b[0],
			p1 = _b[1],
			p2 = _b[2],
			p3 = _b[3],
			vmin = void 0,
			vmax = void 0;
		if (p1[k] < p2[k] ? (vmin = p1[k], vmax = p2[k]) : (vmin = p2[k], vmax = p1[k]), lookup - margin <= vmax && lookup + margin >= vmin) {
			var ts = getTAtValue(lookup, tension, p0[k], p1[k], p2[k], p3[k]);
			max < 0 ? ts.sort(function (a, b) {
				return b - a;
			}) : max >= 0 && ts.sort(function (a, b) {
				return a - b;
			});
			for (var j = 0; j < ts.length; j++) {
				if (!(0 === ts[j] && i > 0)) {
					var u = getTtoUmapping((ts[j] + idx) / nPoints, arcLengths);
					if (solutions.add(u), solutions.size === Math.abs(max)) return Array.from(solutions);
				}
			}
		}
	}
	return Array.from(solutions);
}

function getBoundingBox(points, options) {
	void 0 === options && (options = {});
	for (var _a = _assign({
			tension: .5,
			closed: !1,
			from: 0,
			to: 1,
			arcLengths: null,
			arcDivisions: 300
		}, options), tension = _a.tension, closed = _a.closed, u0 = _a.from, u1 = _a.to, arcLengths = _a.arcLengths, arcDivisions = _a.arcDivisions, nPoints = closed ? points.length : points.length - 1, t0 = getUtoTmapping(u0, arcLengths = arcLengths || getArcLengths(points, arcDivisions, {
			tension: tension,
			closed: closed
		})), t1 = getUtoTmapping(u1, arcLengths), i0 = Math.floor(nPoints * t0), i1 = Math.ceil(nPoints * t1), start = getPointAtT(t0, points, {
			tension: tension,
			closed: closed
		}), end = getPointAtT(t1, points, {
			tension: tension,
			closed: closed
		}), min = [], max = [], c = 0; c < start.length; c++) {
		min[c] = Math.min(start[c], end[c]), max[c] = Math.max(start[c], end[c]);
	}
	for (var _loop_1 = function _loop_1(i) {
			var _a = getControlPoints(i - 1, points, closed),
				p0 = _a[0],
				p1 = _a[1],
				p2 = _a[2],
				p3 = _a[3];
			if (i < i1)
				for (var c = 0; c < p2.length; c++) {
					p2[c] < min[c] && (min[c] = p2[c]), p2[c] > max[c] && (max[c] = p2[c]);
				}
			if (tension < 1) {
				var w0_1 = nPoints * t0 - (i - 1),
					w1_1 = nPoints * t1 - (i - 1),
					valid = function valid(t) {
						return t > -EPS && t <= 1 + EPS && (i - 1 !== i0 || t > w0_1) && (i !== i1 || t < w1_1);
					},
					_loop_2 = function _loop_2(c) {
						var _a = getCoefficients(p0[c], p1[c], p2[c], p3[c], 0, tension);
						getQuadRoots(3 * _a[0], 2 * _a[1], _a[2]).filter(valid).forEach(function (t) {
							var v = solveForT(t, tension, p0[c], p1[c], p2[c], p3[c]);
							v < min[c] && (min[c] = v), v > max[c] && (max[c] = v);
						});
					};
				for (c = 0; c < p0.length; c++) {
					_loop_2(c);
				}
			}
		}, i = i0 + 1; i <= i1; i++) {
		_loop_1(i);
	}
	return {
		min: min,
		max: max
	};
}
var CurveInterpolator = function () {
		function CurveInterpolator(points, options) {
			void 0 === options && (options = {}), options = _assign({
				tension: .5,
				arcDivisions: 300,
				closed: !1
			}, options), this._cache = {}, this._tension = options.tension, this._arcDivisions = options.arcDivisions, this._lmargin = options.lmargin || 1 - this._tension, this._closed = options.closed, this.points = points;
		}
		return CurveInterpolator.prototype.getT = function (position) {
			return getUtoTmapping(position, this.arcLengths);
		}, CurveInterpolator.prototype.getPointAt = function (position, target) {
			var options = {
				tension: this.tension,
				closed: this.closed
			};
			return getPointAtT(this.getT(position), this.points, options, target);
		}, CurveInterpolator.prototype.getTangentAt = function (position, target) {
			return void 0 === target && (target = null), normalize(getTangentAtT(this.getT(position), this.points, {
				tension: this.tension,
				closed: this.closed
			}, target));
		}, CurveInterpolator.prototype.getBoundingBox = function (from, to) {
			if (void 0 === from && (from = 0), void 0 === to && (to = 1), 0 === from && 1 === to && this._cache.bbox) return this._cache.bbox;
			var bbox = getBoundingBox(this.points, {
				from: from,
				to: to,
				tension: this.tension,
				closed: this.closed,
				arcLengths: this.arcLengths
			});
			return 0 === from && 1 === to && (this._cache.bbox = bbox), bbox;
		}, CurveInterpolator.prototype.getPoints = function (samples, returnType, from, to) {
			if (void 0 === samples && (samples = 100), void 0 === from && (from = 0), void 0 === to && (to = 1), !samples || samples <= 0) throw Error("Invalid arguments passed to getPoints(). You must specify at least 1 sample/segment.");
			if (!(from < 0 || to > 1 || to < from)) {
				for (var pts = [], d = 0; d <= samples; d++) {
					var u = 0 === from && 1 === to ? d / samples : from + d / samples * (to - from);
					pts.push(this.getPointAt(u, returnType && new returnType()));
				}
				return pts;
			}
		}, CurveInterpolator.prototype.lookup = function (v, axis, max, margin) {
			void 0 === axis && (axis = 0), void 0 === max && (max = 0), void 0 === margin && (margin = this._lmargin);
			var matches = valuesLookup(v, this.points, {
				axis: axis,
				tension: this.tension,
				closed: this.closed,
				max: max,
				margin: margin
			});
			return 1 === Math.abs(max) && 1 === matches.length ? matches[0] : matches;
		}, CurveInterpolator.prototype.lookupPositions = function (v, axis, max, margin) {
			return void 0 === axis && (axis = 0), void 0 === max && (max = 0), void 0 === margin && (margin = this._lmargin), positionsLookup(v, this.points, {
				axis: axis,
				arcLengths: this.arcLengths,
				tension: this.tension,
				closed: this.closed,
				max: max,
				margin: margin
			});
		}, CurveInterpolator.prototype.invalidateCache = function () {
			var _this = this;
			return Object.keys(this._cache).forEach(function (key) {
				delete _this._cache[key];
			}), this;
		}, Object.defineProperty(CurveInterpolator.prototype, "points", {
			get: function get() {
				return this._points;
			},
			set: function set(pts) {
				this._points = pts, this.invalidateCache();
			},
			enumerable: !0,
			configurable: !0
		}), Object.defineProperty(CurveInterpolator.prototype, "tension", {
			get: function get() {
				return this._tension;
			},
			set: function set(t) {
				t !== this._tension && (this._tension = t, this.invalidateCache());
			},
			enumerable: !0,
			configurable: !0
		}), Object.defineProperty(CurveInterpolator.prototype, "closed", {
			get: function get() {
				return this._closed;
			},
			set: function set(isClosed) {
				isClosed !== this._closed && (this._closed = isClosed, this.invalidateCache());
			},
			enumerable: !0,
			configurable: !0
		}), Object.defineProperty(CurveInterpolator.prototype, "arcDivisions", {
			get: function get() {
				return this._arcDivisions;
			},
			set: function set(n) {
				n !== this._arcDivisions && (this._arcDivisions = n, this.invalidateCache());
			},
			enumerable: !0,
			configurable: !0
		}), Object.defineProperty(CurveInterpolator.prototype, "arcLengths", {
			get: function get() {
				if (this._cache.arcLengths) return this._cache.arcLengths;
				var arcLengths = getArcLengths(this.points, this.arcDivisions, {
					tension: this.tension,
					closed: this.closed
				});
				return this._cache.arcLengths = arcLengths, arcLengths;
			},
			enumerable: !0,
			configurable: !0
		}), Object.defineProperty(CurveInterpolator.prototype, "length", {
			get: function get() {
				var lengths = this.arcLengths;
				return lengths[lengths.length - 1];
			},
			enumerable: !0,
			configurable: !0
		}), Object.defineProperty(CurveInterpolator.prototype, "minX", {
			get: function get() {
				return this.getBoundingBox().min[0];
			},
			enumerable: !0,
			configurable: !0
		}), Object.defineProperty(CurveInterpolator.prototype, "maxX", {
			get: function get() {
				return this.getBoundingBox().max[0];
			},
			enumerable: !0,
			configurable: !0
		}), Object.defineProperty(CurveInterpolator.prototype, "minY", {
			get: function get() {
				return this.getBoundingBox().min[1];
			},
			enumerable: !0,
			configurable: !0
		}), Object.defineProperty(CurveInterpolator.prototype, "maxY", {
			get: function get() {
				return this.getBoundingBox().max[1];
			},
			enumerable: !0,
			configurable: !0
		}), Object.defineProperty(CurveInterpolator.prototype, "minZ", {
			get: function get() {
				return this.getBoundingBox().min[2];
			},
			enumerable: !0,
			configurable: !0
		}), Object.defineProperty(CurveInterpolator.prototype, "maxZ", {
			get: function get() {
				return this.getBoundingBox().max[2];
			},
			enumerable: !0,
			configurable: !0
		}), CurveInterpolator;
	}(),
	CurveInterpolator2D = function (_super) {
		function CurveInterpolator2D(points, tension, arcDivisions, closed) {
			return void 0 === tension && (tension = .5), void 0 === arcDivisions && (arcDivisions = 300), void 0 === closed && (closed = !1), _super.call(this, points, {
				tension: tension,
				arcDivisions: arcDivisions,
				closed: closed
			}) || this;
		}
		return function (d, b) {
			function __() {
				this.constructor = d;
			}
			_extendStatics(d, b), d.prototype = null === b ? Object.create(b) : (__.prototype = b.prototype, new __());
		}(CurveInterpolator2D, _super), CurveInterpolator2D.prototype.x = function (y, max, margin) {
			void 0 === max && (max = 0), void 0 === margin && (margin = this._lmargin);
			var res = this.lookup(y, 1, max, margin);
			return 1 === Math.abs(max) ? res[0] : res.map(function (d) {
				return d[0];
			});
		}, CurveInterpolator2D.prototype.y = function (x, max, margin) {
			void 0 === max && (max = 0), void 0 === margin && (margin = this._lmargin);
			var res = this.lookup(x, 0, max, margin);
			return 1 === Math.abs(max) ? res[1] : res.map(function (d) {
				return d[1];
			});
		}, CurveInterpolator2D.prototype.getNormalAt = function (position, target) {
			return normalize(orthogonal(getTangentAtT(this.getT(position), this.points, {
				tension: this.tension,
				closed: this.closed
			}, target)));
		}, CurveInterpolator2D.prototype.getAngleAt = function (position) {
			var tan = getTangentAtT(this.getT(position), this.points, {
				tension: this.tension,
				closed: this.closed
			});
			return Math.atan2(tan[1], tan[0]);
		}, CurveInterpolator2D.prototype.getBoundingBox = function (from, to) {
			void 0 === from && (from = 0), void 0 === to && (to = 1);
			var bbox = _super.prototype.getBoundingBox.call(this, from, to);
			return {
				x1: bbox.min[0],
				x2: bbox.max[0],
				y1: bbox.min[1],
				y2: bbox.max[1],
				min: bbox.min,
				max: bbox.max
			};
		}, CurveInterpolator2D;
	}(CurveInterpolator),
	Point = function () {
		function Point(x, y, z, w) {
			void 0 === x && (x = 0), void 0 === y && (y = 0), void 0 === z && (z = null), void 0 === w && (w = null), this.x = x, this.y = y, this.z = z, this.w = w;
		}
		return Object.defineProperty(Point.prototype, 0, {
			get: function get() {
				return this.x;
			},
			set: function set(x) {
				this.x = x;
			},
			enumerable: !0,
			configurable: !0
		}), Object.defineProperty(Point.prototype, 1, {
			get: function get() {
				return this.y;
			},
			set: function set(y) {
				this.y = y;
			},
			enumerable: !0,
			configurable: !0
		}), Object.defineProperty(Point.prototype, 2, {
			get: function get() {
				return this.z;
			},
			set: function set(z) {
				this.z = z;
			},
			enumerable: !0,
			configurable: !0
		}), Object.defineProperty(Point.prototype, 3, {
			get: function get() {
				return this.w;
			},
			set: function set(w) {
				this.w = w;
			},
			enumerable: !0,
			configurable: !0
		}), Object.defineProperty(Point.prototype, "length", {
			get: function get() {
				return Number.isFinite(this.w) ? 4 : Number.isFinite(this.z) ? 3 : 2;
			},
			enumerable: !0,
			configurable: !0
		}), Point;
	}();
CurveInterpolator = CurveInterpolator;
CurveInterpolator2D = CurveInterpolator2D;
EPS = EPS;
Point = Point;
clamp = clamp;
distance = distance;
fill = fill;
getArcLengths = getArcLengths;
getBoundingBox = getBoundingBox;
getCoefficients = getCoefficients;
getCubicRoots = getCubicRoots;
getDerivativeOfT = getDerivativeOfT;
getPointAtT = getPointAtT;
getQuadRoots = getQuadRoots;
getTAtValue = getTAtValue;
getTangentAtT = getTangentAtT;
getTtoUmapping = getTtoUmapping;
getUtoTmapping = getUtoTmapping;
map = map;
normalize = normalize;
orthogonal = orthogonal;
positionsLookup = positionsLookup;
reduce = reduce;

var simplify2d = function (inputArr, maxOffset, maxDistance) {
	var _a;
	if (void 0 === maxOffset && (maxOffset = .001), void 0 === maxDistance && (maxDistance = 10), inputArr.length <= 4) return inputArr;
	for (var _b = inputArr[0], o0 = _b[0], o1 = _b[1], arr = inputArr.map(function (d) {
			return [d[0] - o0, d[1] - o1];
		}), _c = arr[0], a0 = _c[0], a1 = _c[1], sim = [inputArr[0]], i = 1; i + 1 < arr.length; i++) {
		var _d = arr[i],
			t0 = _d[0],
			t1 = _d[1],
			_e = arr[i + 1],
			b0 = _e[0],
			b1 = _e[1];
		if (b0 - t0 != 0 || b1 - t1 != 0) {
			var proximity = Math.abs(a0 * b1 - a1 * b0 + b0 * t1 - b1 * t0 + a1 * t0 - a0 * t1) / Math.sqrt(Math.pow(b0 - a0, 2) + Math.pow(b1 - a1, 2)),
				dir = [a0 - t0, a1 - t1],
				len = Math.sqrt(Math.pow(dir[0], 2) + Math.pow(dir[1], 2));
			(proximity > maxOffset || len >= maxDistance) && (sim.push([t0 + o0, t1 + o1]), a0 = (_a = [t0, t1])[0], a1 = _a[1]);
		}
	}
	var last = arr[arr.length - 1];
	return sim.push([last[0] + o0, last[1] + o1]), sim;
}

solveForT = solveForT;

var tangentsLookup = function (lookup, points, options) {
	return valuesLookup(lookup, points, _assign(_assign({}, options), {
		func: getDerivativeOfT,
		processRefAxis: !0
	}));
}

valuesLookup = valuesLookup;

/*Object.defineProperty(exports, "__esModule", {
	value: !0
});*/
/*\
title: $:/plugins/nico/pm/ui/pie.js
type: application/javascript
module-type: widget

```
<$pie tag="TiddlerTitle" />
```

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var PieWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

PieWidget.prototype = new Widget();

PieWidget.prototype.render = function(parent,nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();

	let svg = this.renderSVG();

	parent.insertBefore(svg, nextSibling);
	this.domNodes.push(svg);
};

PieWidget.prototype.renderSVG = function () {
	let svg = createSVG("svg");
	svg.classList.add("pm-icon");
	svg.classList.add("pm-pie");
	svg.setAttribute("height", "1em");
	svg.setAttribute("width", "1em");
	svg.setAttribute("viewBox", "0 0 30 30");
	svg.append(this.renderBorder());
	svg.append(this.renderProgress());
	return svg;
};

PieWidget.prototype.renderBorder = function () {
	let border = createSVG("circle");
	border.classList.add("border");
	border.setAttribute("r", "14");
	border.setAttribute("cx", "15");
	border.setAttribute("cy", "15");
	border.setAttribute("fill", "white");
	border.setAttribute("stroke", "tomato");
	border.setAttribute("stroke-width", "2");
	return border;
};

PieWidget.prototype.renderProgress = function () {
	let progress = createSVG("circle");
	progress.classList.add("border");
	progress.setAttribute("r", "5");
	progress.setAttribute("cx", "15");
	progress.setAttribute("cy", "15");
	progress.setAttribute("fill", "transparent");
	progress.setAttribute("stroke", "tomato");
	progress.setAttribute("stroke-width", "10");
	progress.setAttribute("stroke-dasharray", `${this.progress} 31.42`);
	progress.setAttribute("transform", "rotate(-90) translate(-30)");
	return progress;
};

/**
 * Compute the internal state of the widget
 */
PieWidget.prototype.execute = function () {
	this.tiddler = this.getAttribute("tag") || this.getVariable("currentTiddler");
	this.progress = this.computeProgress();
};

PieWidget.prototype.findAllTiddlers = function () {
	let filter = `[tag[${this.tiddler}]!has[draft.of]]`;
	return this.wiki.filterTiddlers(filter);
};

PieWidget.prototype.findClosedTiddlers = function () {
	let filter = `[tag[${this.tiddler}]!has[draft.of]tag[done]]`;
	return this.wiki.filterTiddlers(filter);
};

PieWidget.prototype.computeProgress = function () {
	let circumference = 2 * Math.PI * 5;
	let all = this.findAllTiddlers().length;
	let closed = this.findClosedTiddlers().length;

	if (!all) {
		return circumference;
	}

	return circumference * (closed / all);
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
PieWidget.prototype.refresh = function(changedTiddlers) {
	let changedAttributes = this.computeAttributes();
	let progress = this.computeProgress();

	if(changedAttributes.tiddler || progress !== this.progress) {
		this.refreshSelf();
		return true;
	} else {
		return false;
	}
};

const createSVG = (elt) => document.createElementNS("http://www.w3.org/2000/svg", elt);

exports.pie = PieWidget;

})();

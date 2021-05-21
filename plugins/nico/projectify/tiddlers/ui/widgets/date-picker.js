/*\
title: $:/plugins/nico/projectify/ui/widgets/date-picker.js
type: application/javascript
module-type: widget

py-date-picker widget factory.

This widget is intended to be used within a drop-down (with the tc-drop-down CSS
class). See $:/plugins/nico/projectify/ui/buttons/TodoDueDate for usages.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";


var Widget = require("$:/core/modules/widgets/widget.js").widget;
var Pikaday = require("$:/plugins/nico/projectify/lib/pikaday.js");

function getToday () {
	return new Date();
};

function getTomorrow () {
	let today = getToday();
	let tomorrow = new Date(today);
	tomorrow.setDate(today.getDate() + 1);
	return tomorrow;
};

function getNextMonday () {
	let tomorrow = getTomorrow();
	let monday = new Date(tomorrow);
	monday.setDate(monday.getDate() + (1 + 7 - tomorrow.getDay()) % 7);
	return monday;
};

var AbstractDatePickerWidget = function() {};
AbstractDatePickerWidget.prototype = new Widget();


/*
Compute the internal state of the widget
*/
AbstractDatePickerWidget.prototype.execute = function () {
	this.title = this.getAttribute("tiddler", this.getVariable("currentTiddler"));
	this.field = this.getAttribute("field", "due");
	this.makeChildWidgets();
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of
its children needed re-rendering
*/
AbstractDatePickerWidget.prototype.refresh = function(changedTiddlers) {
	let changedAttributes = this.computeAttributes();

	if(changedAttributes.tiddler || changedAttributes.field) {
		this.refreshSelf();
		return true;
	} else {
		return false;
	}
};

AbstractDatePickerWidget.prototype.getTiddler = function() {
	var tiddler = this.wiki.getTiddler(this.title);
	if(!tiddler) {
		this.wiki.addTiddler({title: this.title});
		tiddler = this.wiki.getTiddler(this.title);
	}

	return tiddler;
};

AbstractDatePickerWidget.prototype.getValue = function() {
	return $tw.utils.parseDate(this.getTiddler().getFieldString(this.field));
};

AbstractDatePickerWidget.prototype.setValue = function (date) {
	let updateFields = {
		title: this.title,
		[this.field]: date ? this.formatDate(date) : undefined
	};

	this.wiki.addTiddler(
		new $tw.Tiddler(
			this.wiki.getCreationFields(),
			this.getTiddler(),
			updateFields,
			this.wiki.getModificationFields()
		)
	);

	$tw.rootWidget.dispatchEvent({type: "tm-auto-save-wiki"});
};

AbstractDatePickerWidget.prototype.formatDate = function(date) {
	// TW format is YYYYMMDDHHmmssSSS
	return `${date.getFullYear()}${this.formatMonth(date)}${this.formatDay(date)}120000000`;
};

AbstractDatePickerWidget.prototype.formatMonth = function(date) {
	let month = `${date.getMonth() + 1}`;
	if (month.length === 1) {
		month = `0${month}`;
	}

	return month;
};

AbstractDatePickerWidget.prototype.formatDay = function(date) {
	let day = `${date.getDate()}`;
	if (day.length === 1) {
		day = `0${day}`;
	}

	return day;
};

var factory = function(getDate, cssClass) {
	var PickerWidget = function(parseTreeNode,options) {
		this.initialise(parseTreeNode,options);
	};

	PickerWidget.prototype = new AbstractDatePickerWidget();

	PickerWidget.prototype.render = function(parent,nextSibling) {
		this.parentDomNode = parent;
		this.computeAttributes();
		this.execute();

		this.domNode = this.createDomNode();

		parent.insertBefore(this.domNode, nextSibling);
		this.renderChildren(this.domNode, null);
		this.domNodes.push(this.domNode);
	};

	PickerWidget.prototype.createDomNode = function() {
		let btn = document.createElement("button");
		btn.classList.add("tc-btn-invisible", cssClass);
		btn.addEventListener("click", () => {
			this.setValue(getDate());
		});

		return btn;
	};

	return PickerWidget;
};

var CalendarWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

CalendarWidget.prototype = new AbstractDatePickerWidget();

CalendarWidget.prototype.render = function(parent,nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();

	this.domNode = this.renderCalendar();

	parent.insertBefore(this.domNode, nextSibling);
	this.renderChildren(this.domNode, null);
	this.domNodes.push(this.domNode);
};

CalendarWidget.prototype.renderCalendar = function() {
	let calendar = new Pikaday({
		firstDay: parseInt(this.wiki.getTiddlerText("$:/config/projectify/FirstDayOfWeek")),
		keyboardInput: false,
		i18n: this.getLabels(),
		onSelect: () => {
			this.setValue(calendar.getDate());
			// Close the popup
			$tw.popup.cancel(0);
		},
		onDraw: fixPopupClosing
	});

	calendar.setDate(this.getValue(), true);

	// Prevent the month and year pickers click events from closing the TW
	// popup. This function is called on each redraw (when a new month is
	// selected).
	function fixPopupClosing() {
		setTimeout(() => {
			calendar.el.querySelectorAll(".pika-label").forEach((elt) => {
				elt.classList.add("tc-popup-handle");
			});
		}, 0);
	}

	return calendar.el;
};

CalendarWidget.prototype.getLabels = function() {
	return {
        previousMonth : "Previous Month",
        nextMonth     : "Next Month",
        months        : this.getMonthLabels(),
        monthsShort   : this.getShortMonthLabels(),
        weekdays      : this.getDayLabels(),
        weekdaysShort : this.getShortDayLabels(),
    };
};

CalendarWidget.prototype.getMonthLabels = function() {
	return this._mapRange(12, i => this._getDateLabel(`Long/Month/${i+1}`));
};

CalendarWidget.prototype.getShortMonthLabels = function() {
	return this._mapRange(12, i => this._getDateLabel(`Short/Month/${i+1}`));
};

CalendarWidget.prototype.getDayLabels = function() {
	return this._mapRange(7, i => this._getDateLabel(`Long/Day/${i}`));
};

CalendarWidget.prototype.getShortDayLabels = function() {
	return this._mapRange(7, i => this._getDateLabel(`Short/Day/${i}`));
};

CalendarWidget.prototype._mapRange = function(n, f) {
	return Array.from(new Array(n)).map((_, i) => f(i));
};

CalendarWidget.prototype._getDateLabel = function(title) {
	return this.wiki.getTextReference(`$:/language/Date/${title}`);
};

exports["py-date-today"] = factory(getToday, "py-date-today");
exports["py-date-tomorrow"] = factory(getTomorrow, "py-date-tomorrow");
exports["py-date-next-week"] = factory(getNextMonday, "py-date-next-week");
exports["py-date-clear"] = factory(function() {return undefined;}, "py-date-clear");
exports["py-date-calendar"] = CalendarWidget;

})();

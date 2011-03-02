(function(window, document, $, datetime, _undefined) {
    if (!datetime) throw 'DateTime is required.';

    var defaults = {
        format: 'yyyy-MM-dd',
        time: false,
        buttons: {
            'Today': function(w, o) {
                w.dateselected(new Date());
            },
            'Clear': function(w, o) {
                w.dateselected('');
            }
        }
    };

    var calendar = $.calendar = function(options) {
        options = $.extend({}, calendar.defaults, defaults, options);
        options.date = datetime(options.date);

        var widget = $('<div class="ui-calendar"><div class="ui-calendar-box"/><div class="ui-calendar-buttons"/></div>'),
            buttons = widget.children('.ui-calendar-buttons');


        widget.render = function(years, months) {
            var date = options.dateRender || datetime(options.date);
            date.addMonths((months || 0) + (years || 0) * 12);
            options.dateRender = date;
            this.children('.ui-calendar-box').html(build(options));
            return this.trigger({
                type: 'day-rendered',
                options: options,
                date: options.dateRender
            });
        };

        widget.dateselected = function(date) {
            if (date !== '') options.date = datetime(date);
            else options.date = '';

            return this.trigger({
                type: 'day-selected',
                target: this,
                date: options.date,
                options: options,
                formatDate: function(format) {
                    format = format || options.format;
                    return options.date ? datetime.format(options.date, format, options) : _undefined;
                }
            });
        };

        widget.clear = function() {
            return this.goto('', true);
        };

        widget.select = function(date) {
            return widget.goto(date, true);
        };

        widget.goto = function(date, select) {
            options.dateRender = datetime(date) || options.dateRender;
            if (select) options.date = date === '' ? _undefined : datetime(options.dateRender);
            this.render();
            return this;
        };

        widget.render();

        $.each(options.buttons, function(i) {
            $('<button/>').text(i).click(function() {
                options.buttons[i].apply(widget, [widget, options]);
            }).appendTo(buttons);
        });

        widget.delegate('.month-prev', 'click.calendar', function() {
            widget.render(0, -1);
        }).delegate('.month-next', 'click.calendar', function() {
            widget.render(0, 1);
        }).delegate('.year-prev', 'click.calendar', function() {
            widget.render(-1, 0);
        }).delegate('.year-next', 'click.calendar', function() {
            widget.render(1, 0);
        }).delegate('.day.action', 'click.calendar', function(e) {
            var td = $(this);
            widget.find('.day-selected').removeClass('day-selected');
            widget.dateselected(td.addClass('day-selected').data('date'));

        });

        return widget;
    };

    var namespace = '.calendar';

    function create(self, options) {
        var calendar = $.calendar(options).bind('day-selected' + namespace, function(e) {
            self.data('datevalue', e.date).val(e.formatDate()).change().trigger('hide' + namespace);
        }).bind('click', function() {
            self.trigger('cancelhide' + namespace);
        }).css({
            position: 'absolute'
        }).hide().appendTo(document.body);

        self.data('widget' + namespace, calendar);
        return calendar;
    }

    $.fn.datepicker = function(o) {
        var calendar = this.data('widget' + namespace);

        if (!calendar) {

            this.each(function() {
                var self = $(this);
                options = $.extend({
                    format: self.data('format') || 'yyyy-MM-dd'
                }, o);
                if (options.time === _undefined) options.time = options.format.indexOf('H') > -1 || options.format.indexOf('h') > -1 || options.format.indexOf('m') > -1 || options.format.indexOf('s') > -1;

                self.bind('focus show' + namespace, function() {
                    clearTimeout(self.data('tmr' + namespace));
                    calendar = self.data('widget' + namespace);
                    if (!calendar) calendar = create(self, options);
                    off = self.offset();

                    calendar.select(self.data('datevalue') || self.val()).css({
                        top: off.top + self.outerHeight(),
                        left: off.left
                    }).show();

                }).bind('blur starthide' + namespace, function() {
                    self.trigger('cancelhide' + namespace).data('tmr' + namespace, setTimeout(function() {
                        self.trigger('hide' + namespace);
                    }, 300));

                }).bind('cancelhide' + namespace, function() {
                    clearTimeout(self.data('tmr' + namespace));
                }).bind('hide' + namespace, function() {
                    self.trigger('cancelhide' + namespace);
                    if (calendar) {
                        calendar.hide();
                    }

                }).bind('change', function() {
                    if (calendar) {
                        calendar.select(self.data('datevalue') || self.val());
                    }
                });

                if (o === 'widget') calendar = create(self, options);
            });
        }

        if (o === 'widget') return calendar;
        if (typeof o == 'string') this.trigger(o + namespace);
        return this;
    };

    $.fn.datetimepicker = function(o) {
        return this.each(function() {
            var self = $(this),
                options = $.extend({
                    time: true,
                    format: self.data('format') || 'yyyy-MM-dd HH:mm:ss'
                }, o);
            self.datepicker(options);
        });
    };

    function build(options) {
        var date = options.dateRender || (options.dateRender = datetime(options.date)),
            html = '',
            days = new Date(date.year, date.month, 0).getDate(),
            first = datetime(date.year, date.month, 1),
            rows = Math.ceil((days + first.dayOfWeek) / 7);

        html = '<div class="calender-header"><div><span class="action year-prev">&laquo;&laquo;</span><span class="action month-prev">&laquo;</span><span class="month-name">' + datetime.defaults.months[date.month - 1] + ' ' + date.year + '</span><span class="action month-next">&raquo;</span><span class="action year-next">&raquo;&raquo;</span></div><div>';
        for (var i = 0; i < 7; i++) {
            html += '<span class="day day-name ' + (i > 0 && i < 6 ? 'day-week' : 'day-weekend') + '">' + datetime.defaults.days[i].substr(0, 3) + '</span>';
        }
        html += '</div></div><div class="calendar-body">';

        var day = -first.dayOfWeek,
            dow = 0,
            shortNames = [];
        $.each(datetime.defaults.days, function(i, day) {
            shortNames.push(day.substr(0, 3).toLowerCase());
        });

        for (var rowi = 0; rowi < rows; rowi++) {
            html += '<div class="week ' + (rowi % 2 === 0 ? 'week-even' : 'week-odd') + '">';
            for (var j = 0; j < 7; j++) {
                day++;
                var display = day > 0 && day <= days;
                html += '<span';
                if (display) {
                    html += ' data-date="' + date.year + '-' + date.month + '-' + day + '"';
                }

                html += ' class="day day-' + shortNames[dow] + (dow > 0 && dow < 6 ? ' day-week' : ' day-weekend') + (display ? ' action' : '') + (options.date && day == options.date.day && date.month == options.date.month && date.year == options.date.year ? ' day-selected' : '') + '">';

                if (display) {
                    html += day;
                }
                html += '</span>';
                dow++;
                if (dow == 7) dow = 0;
            }
            html += '</div>';
        }

        html += '</div></div>';
        return html;
    }

    function getDaysInMonth(y, m) {
        return new Date(y, m, 0).getDate();
    }

    calendar.defaults = {};

})(window, document, jQuery, DateTime);
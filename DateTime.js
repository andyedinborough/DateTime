var DateTime = (function() {
    var datetime = function() {
        var result = this;
        if (!this.isDate) result = new datetime(true);

        if (arguments[0] !== true) result.fromDate(getDateFromArguments(arguments));

        return result;
    };

    datetime.defaults = {
        format: 'yyyy-MM-dd HH:mm:ss',
        months: 'January February March April May June July August September October November December'.split(' '),
        days: 'Sunday Monday Tuesday Wednesday Thursday Friday Saturday'.split(' ')
    };

    function getDateFromArguments(args) {
        if (args.length === 0 || !args[0]) return new Date();
        else if (args.length === 1) {
            if (args[0].isDate) return args[0].getDate();
            if (typeof args[0] == 'string') args[0] = args[0].replace(/-/g, '/').replace(/[TZ]/g, ' ');
            return new Date(args[0]);
        } else if (args.length === 3) return new Date(args[0], args[1] - 1, args[2]);
        else if (args.length === 5) return new Date(args[0], args[1] - 1, args[2], args[3], args[4]);
        else if (args.length === 6) return new Date(args[0], args[1] - 1, args[2], args[3], args[4], args[5]);
    }

    datetime.prototype = {
        fromDate: function(d, u) {
            if (isNaN(d.getFullYear())) d = new Date();
            var self = this;
            self.year = u ? d.getUTCFullYear() : d.getFullYear();
            self.month = (u ? d.getUTCMonth() : d.getMonth()) + 1;
            self.day = u ? d.getUTCDate() : d.getDate();
            self.hour = u ? d.getUTCHours() : d.getHours();
            self.minute = u ? d.getUTCMinutes() : d.getMinutes();
            self.second = u ? d.getUTCSeconds() : d.getSeconds();
            self.millisecond = u ? d.getUTCMilliseconds() : d.getMilliseconds();
            self.dayOfWeek = u ? d.getUTCDay() : d.getDay();

            self.isUtc = u === true;
            self.timezone = datetime.getTimezoneInfo(d, self.isUtc);
            self.utcOffset = self.timezone.utcOffset;
            self.isDaylightSavingTime = self.timezone.supportsDaylightSavingTime && self.utcOffset == self.timezone.daylightUtcOffset;

            return self;
        },
        format: function(f) {
            return datetime.format(this, f);
        },
        isDate: true,
        getDate: function() {
            return new Date(this.year, this.month - 1, this.day, this.hour, this.minute, this.second, this.millisecond);
        },
        addYears: function(i) {
            return this.addMonths(i * 12);
        },
        addMonths: function(i) {
            i = i || 0;
            var d = this;
            d.month += i;
            while (d.month < 1) {
                d.year--;
                d.month += 12;
            }
            while (d.month > 12) {
                d.year++;
                d.month -= 12;
            }

            var imonth = Math.floor(d.month),
                frac = d.month - imonth;
            if (frac > 0) {
                d.addDays(getDaysInMonth(d.year, d.month) * frac);
                d.month = imonth;
            }
            return d;
        },
        addDays: function(i) {
            return this.addHours(i * 24);
        },
        addHours: function(i) {
            return this.addMinutes(i * 60);
        },
        addMinutes: function(i) {
            return this.addSeconds(i * 60);
        },
        addSeconds: function(i) {
            return this.addMilliseconds(i * 1000);
        },
        addMilliseconds: function(i) {
            return this.fromDate(new Date(this.getDate().getTime() + i));
        },
        toUtc: function() {
            if (this.isUtc) return;
            this.fromDate(this.getDate(), true);
            return this;
        }
    };

    datetime.pretty = function(date) {
        date = datetime(date).getDate();
        var diff = (((new Date()).getTime() - date.getTime()) / 1000),
            day_diff = Math.floor(Math.abs(diff) / 86400),
            pre = '',
            post = ' ago',
            future = diff < 0,
            oneday = 'Yesterday';

        if (future) {
            diff = -diff;
            pre = 'in ';
            post = '';
            oneday = 'Tomorrow';
        }

        if (isNaN(day_diff) || day_diff >= 31) return;

        return day_diff === 0 && (
        diff < 60 && ((future ? '' : 'just ') + 'now') || diff < 120 && (pre + "1 minute" + post) || diff < 3600 && (pre + Math.floor(diff / 60) + " minutes" + post) || diff < 7200 && (pre + "1 hour" + post) || diff < 86400 && (pre + Math.floor(diff / 3600) + " hours" + post)) || day_diff == 1 && oneday || day_diff < 7 && (pre + day_diff + " days" + post) || day_diff < 31 && (pre + Math.ceil(day_diff / 7) + " weeks" + post);
    };

    function fill(number, prelen, plus) {
        var postlen = prelen < 0 ? -prelen : 0,
            pre = number < 0 ? '-' : (plus || '');
        number = Math.abs(number) + '';
        if (prelen < 0) postlen = Math.abs(prelen);
        while (Math.max(prelen, postlen) > number.length) {
            if (prelen-- > 0) number = '0' + number;
            if (postlen-- > 0) number = number + '0';
        }
        return pre + number;
    }

    var formats = datetime.formats = {
        'pretty': function(d, o) {
            return datetime.pretty(d);
        },
        'yyyy': function(d, o) {
            return d.year;
        },
        'MMMM': function(d, o) {
            return o.months[d.month - 1];
        },
        'dddd': function(d, o) {
            return o.days[d.dayOfWeek];
        },
        'zzzz': function(d, o) {
            return fill(Math.floor(d.utcOffset), 2, '+') + fill((d.utcOffset % 1) * 60, 2);
        },

        'MMM': function(d, o) {
            return o.months[d.month - 1].substr(0, 3);
        },
        'ddd': function(d, o) {
            return o.days[d.dayOfWeek].substr(0, 3);
        },
        'FFF': function(d, o) {
            return d.millisecond;
        },
        'fff': function(d, o) {
            return fill(d.millisecond, -3);
        },
        'zzz': function(d, o) {
            return fill(Math.floor(d.utcOffset), 2, '+') + ':' + fill((d.utcOffset % 1) * 60, 2);
        },

        'yy': function(d, o) {
            return d.year.toString().substr(2);
        },
        'MM': function(d, o) {
            return fill(d.month, 2);
        },
        'dd': function(d, o) {
            return fill(d.day, 2);
        },
        'HH': function(d, o) {
            return fill(d.hour, 2);
        },
        'hh': function(d, o) {
            return fill(d.hour === 0 ? 12 : d.hour - (d.hour > 12 ? 12 : 0), 2);
        },
        'mm': function(d, o) {
            return fill(d.minute, 2);
        },
        'ss': function(d, o) {
            return fill(d.second, 2);
        },
        'FF': function(d, o) {
            return Math.round(d.millisecond / 10);
        },
        'ff': function(d, o) {
            return fill(Math.round(d.millisecond / 10), -2);
        },
        'tt': function(d, o) {
            return d.hour >= 12 ? 'PM' : 'AM';
        },
        'zz': function(d, o) {
            return fill(d.utcOffset, 2, '+');
        },

        'M': function(d, o) {
            return d.month;
        },
        'd': function(d, o) {
            return d.day;
        },
        'H': function(d, o) {
            return d.hour;
        },
        'h': function(d, o) {
            return d.hour === 0 ? 12 : d.hour - (d.hour > 12 ? 12 : 0);
        },
        'm': function(d, o) {
            return d.minute;
        },
        's': function(d, o) {
            return d.second;
        },
        'F': function(d, o) {
            return Math.round(d.millisecond / 100);
        },
        't': function(d, o) {
            return d.hour >= 12 ? 'P' : 'A';
        },
        'z': function(d, o) {
            return fill(d.utcOffset, 1, '+');
        },
        'k': function(d, o) {
            return d.timezone.name;
        }

    },
        format_keys = [],
        common_formats = datetime.common_formats = {
            'd': 'M/d/yyyy',
            'D': 'dddd, MMM d, yyyy',
            'f': 'dddd, MMM d, yyyy h:mm tt',
            'F': 'dddd, MMM d, yyyy h:mm:ss tt',
            'g': 'M/d/yyyy h:mm tt',
            'G': 'M/d/yyyy h:mm:ss tt',
            'm': 'MMMM d',
            'o': "yyyy-MM-dd'T'HH:mmzzz",
            'O': "yyyy-MM-dd'T'HH:mm:ss.fffzzz",
            's': "yyyy-MM-dd'T'HH:mm:ss",
            't': 'h:mm tt',
            'T': 'h:mm:ss tt',
            'u': '!yyyy-MM-dd HH:mm:ssZ',
            'y': 'MMMM, yyyy',
            'r': "!ddd, dd MMM yyyy HH:mm:ss 'GMT'",
            'js': "ddd MMM dd yyyy HH:mm:ss 'GMT'zzzz (k)"
        };

    function getDaysInMonth(y, m) {
        return new Date(y, m, 0).getDate();
    }

    datetime.format = function(d, format) {
        d = datetime(d);
        format = format || datetime.defaults.format;
        format = common_formats[format] || common_formats[format.toLowerCase()] || format;

        if (format.substr(0, 1) == '!') {
            d.toUtc();
            format = format.substr(1);
        }

        if (format_keys.length === 0) {
            for (var prop in formats) {
                if (!(prop in Object.prototype)) {
                    format_keys.push(prop);
                }
            }
        }

        var parts = format.split("'");
        var ret = '';
        for (var i = 0, il = parts.length; i < il; i++) {
            if (i % 2 == 1) {
                ret += parts[i];
                continue;
            }

            var part = parts[i];
            while (part.length > 0) {
                var found = false;
                for (var k = 0, kl = format_keys.length; k < kl; k++) {
                    var key = format_keys[k],
                        test = part.substr(0, key.length);
                    if (test === key) {
                        found = true;
                        part = part.substr(key.length);
                        ret += formats[key](d, datetime.defaults);
                        break;
                    }
                }

                if (!found) {
                    ret += part.substr(0, 1);
                    part = part.substr(1);
                }
            }
        }
        return ret;
    };

    datetime.getTimezoneInfo = function(date, utc) {
        var rightNow = date || new Date(),
            jan1 = new Date(rightNow.getFullYear(), 0, 1),
            jul1 = new Date(rightNow.getFullYear(), 6, 1),
            jan1o = -jan1.getTimezoneOffset() / 60,
            jul1o = -jul1.getTimezoneOffset() / 60;

        return {
            utcOffset: utc ? 0 : -rightNow.getTimezoneOffset() / 60,
            baseUtcOffset: utc ? 0 : jan1o,
            supportsDaylightSavingTime: utc ? false : jan1o != jul1o,
            daylightUtcOffset: utc ? 0 : jul1o,
            name: utc ? "GMT" : (rightNow.toString().match(/\(([^)]+)/) || [])[1]
        };
    };

    return datetime;
})();
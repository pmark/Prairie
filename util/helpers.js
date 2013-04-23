// helpers.js

timestamp = function() {
    return parseInt(new Date().getTime() / 1000, 10);
};

minutesSince = function(tstamp) {
	if (tstamp === null) {
		return Infinity;
	}

	var sec = (timestamp() - tstamp);
	return (sec / 60);
};

initials = function(name, email) {
	var initials = null;

	if (!name) {
		return null;
	}

	var parts = name.replace(/\W/, '').split(" ");
	var a = [];
	parts.map(function(p) { a.push(p[0].toUpperCase()); })
	initials = a.join('');

	if (!initials && email) {
		initials = email.replace(/@.*/, '');
	}

	return initials;
};

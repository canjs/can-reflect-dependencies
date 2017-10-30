var canSymbol = require('can-symbol');
var canReflect = require('can-reflect');

var getValueDependenciesSymbol = canSymbol.for('can.getValueDependencies');

module.exports = function getValueDependencies(obj) {
	if (typeof obj[getValueDependenciesSymbol] === 'function') {
		return canReflect.getValueDependencies(obj);
	}
};

var canSymbol = require('can-symbol');
var canReflect = require('can-reflect');

var getKeyDependenciesSymbol = canSymbol.for('can.getKeyDependencies');

module.exports = function getKeyDependencies(obj, key) {
	if (typeof obj[getKeyDependenciesSymbol] === 'function') {
		return canReflect.getKeyDependencies(obj, key);
	}
};

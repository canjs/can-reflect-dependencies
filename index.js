var getKeyDependencies = require('./src/get-key-dependencies');
var getValueDependencies = require('./src/get-value-dependencies');

// state
// mutatedByMap :: { keys: Map<key, Entry>, value: Entry }
var mutatedByMap = new WeakMap();

// Entry :: { keyDependencies: Map, valueDependencies: Set }
var makeEntry = function makeEntry() {
	return {
		keyDependencies: new Map(),
		valueDependencies: new Set()
	};
};

module.exports = {
	// Track mutations between observable as dependencies
	// addMutatedBy(obs, obs2);
	// addMutatedBy(obs, key, obs2);
	// addMutatedBy(obs, { valueDependencies: [], keyDependencies: {}})
	// addMutatedBy(obs, key, { valueDependencies: [], keyDependencies: {}})
	addMutatedBy: function(mutated, key, mutator) {
		// normalize arguments
		if (arguments.length === 2) {
			mutator = key;
			key = undefined;
		}

		// retrieve entry in the state map or create a new one if missing
		var root = mutatedByMap.get(mutated);
		if (!root) {
			root = {
				keys: new Map(),   // maps [key] to its dependencies
				value: makeEntry() // holds the key and value deps of a value dep
			};
			mutatedByMap.set(mutated, root);
		}

		// retrieve or create a [key] entry if provided
		if (key) {
			root.keys.set(key, makeEntry());
		}

		var obj = key ? root.keys.get(key) : root.value;

		if (mutator.keyDependencies || mutator.valueDependencies) {
			if (mutator.valueDependencies) {
				mutator.valueDependencies.forEach(function(dep) {
					obj.valueDependencies.add(dep);
				});
			}

			if (mutator.keyDependencies) {
				Object.keys(mutator.keyDependencies).forEach(function(k) {
					var dep = mutator.keyDependencies[k];
					var keyEntry = obj.keyDependencies.get(dep);

					if (!keyEntry) {
						keyEntry = new Set([k]);
						obj.keyDependencies.set(dep, keyEntry);
					}

					keyEntry.add(k);
				});
			}
		} else {
			obj.valueDependencies.add(mutator);
		}
	},

	// Call this method with the same arguments as `addMutatedBy`
	// to unregister the mutation dependency
	deleteMutatedBy: function(mutated, key, mutator) {
		var root = mutatedByMap.get(mutated);

		// normalize arguments
		if (arguments.length === 2) {
			mutator = key;
			key = undefined;
		}

		var obj = key ? root.keys.get(key) : root.value;

		if (mutator.keyDependencies || mutator.valueDependencies) {
			if (mutator.valueDependencies) {
				mutator.valueDependencies.forEach(function(dep) {
					obj.valueDependencies.delete(dep);
				});
			}

			if (mutator.keyDependencies) {
				Object.keys(mutator.keyDependencies).forEach(function(k) {
					var dep = mutator.keyDependencies[k];
					var keyEntry = obj.keyDependencies.get(dep);

					if (keyEntry) {
						keyEntry.delete(k);

						if (!keyEntry.size) {
							obj.keyDependencies.delete(dep);
						}
					}
				});
			}
		} else {
			obj.valueDependencies.delete(mutator);
		}
	},

	// Extends the result of calling canReflect.getKeyDependencies
	// to include dependencies registered through `addMutatedBy`;
	// these dependencies are available on the `mutatedKeyDependencies`
	// and `mutatedValueDependencies` properties
	getKeyDependencies: function(obj, key) {
		var mutatedKeyDeps;
		var mutatedValueDeps;
		var keyDependencies = getKeyDependencies(obj, key);

		var root = mutatedByMap.get(obj);
		if (root && root.keys.has(key)) {
			var entry = root.keys.get(key);

			mutatedKeyDeps = entry.keyDependencies;
			mutatedValueDeps = entry.valueDependencies;
		}

		if (keyDependencies || mutatedKeyDeps.size || mutatedValueDeps.size) {
			var result = Object.assign({}, keyDependencies);

			if (mutatedKeyDeps.size) {
				result.mutatedKeyDependencies = mutatedKeyDeps;
			}

			if (mutatedValueDeps.size) {
				result.mutatedValueDependencies = mutatedValueDeps;
			}

			return result;
		}
	},

	// Extends the result of calling canReflect.getValueDependencies
	// to include dependencies registered through `addMutatedBy`;
	// these dependencies are available on the `mutatedKeyDependencies`
	// and `mutatedValueDependencies` properties
	getValueDependencies: function(obj) {
		var mutatedKeyDeps;
		var mutatedValueDeps;
		var valueDependencies = getValueDependencies(obj);

		var root = mutatedByMap.get(obj);
		if (root) {
			mutatedKeyDeps = root.value.keyDependencies;
			mutatedValueDeps = root.value.valueDependencies;
		}

		if (valueDependencies || mutatedKeyDeps.size || mutatedValueDeps.size) {
			var result = Object.assign({}, valueDependencies);

			if (mutatedKeyDeps.size) {
				result.mutatedKeyDependencies = mutatedKeyDeps;
			}

			if (mutatedValueDeps.size) {
				result.mutatedValueDependencies = mutatedValueDeps;
			}

			return result;
		}
	}
};

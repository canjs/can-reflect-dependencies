var canReflect = require('can-reflect');
var getKeyDependencies = require('./src/get-key-dependencies');
var getValueDependencies = require('./src/get-value-dependencies');

// mutatedByMap :: WeakMap<obj, {
//	mutateDependenciesForKey:   Map<key, DependencyRecord>,
//	mutateDependenciesForValue: DependencyRecord
// }>
var mutatedByMap = new WeakMap();

// DependencyRecord :: { keyDependencies: Map, valueDependencies: Set }
var makeDependencyRecord = function makeDependencyRecord() {
	return {
		keyDependencies: new Map(),
		valueDependencies: new Set()
	};
};

var makeRootRecord = function makeRootRecord() {
	return {
		// holds mutated key dependencies of a key-value like object, e.g:
		// if person.first is mutated by other observable, this map will have a
		// key `first` (the mutated property) mapped to a DependencyRecord
		mutateDependenciesForKey: new Map(),

		// holds mutated value dependencies of value-like objects
		mutateDependenciesForValue: makeDependencyRecord()
	};
};

// Extends the result of calling canReflect.getKeyDependencies or
// canReflect.valueDependencies (as baseDependencies) to include dependencies
// registered through `addMutatedBy` (as mutateDependencies)
// param {DependencyRecord} baseDependencies
// param {DependencyRecord} mutateDependencies
// return { ...DependencyRecord, mutatedKeyDependencies: Map, mutatedValueDependencies: Set }
var getMutateDependencies = function(baseDependencies, mutateDependencies) {
	// provide a default value for mutateDependencies
	mutateDependencies = mutateDependencies == null ?
		makeDependencyRecord() :
		mutateDependencies;

	var mutatedKeyDeps = mutateDependencies.keyDependencies;
	var mutatedValueDeps = mutateDependencies.valueDependencies;

	if (baseDependencies || mutatedKeyDeps.size || mutatedValueDeps.size) {
		var result = Object.assign({}, baseDependencies);

		if (mutatedKeyDeps.size) {
			result.mutatedKeyDependencies = mutatedKeyDeps;
		}

		if (mutatedValueDeps.size) {
			result.mutatedValueDependencies = mutatedValueDeps;
		}

		return result;
	}
};

module.exports = {
	// Track mutations between observable as dependencies
	// addMutatedBy(obs, obs2);
	// addMutatedBy(obs, key, obs2);
	// addMutatedBy(obs, { valueDependencies: Set, keyDependencies: Map })
	// addMutatedBy(obs, key, { valueDependencies: Set, keyDependencies: Map })
	addMutatedBy: function(mutated, key, mutator) {
		var gotKey = arguments.length === 3;

		// normalize arguments
		if (arguments.length === 2) {
			mutator = key;
			key = undefined;
		}

		// normalize mutator when shorthand is used
		if (!mutator.keyDependencies && !mutator.valueDependencies) {
			mutator = { valueDependencies: new Set([mutator]) };
		}

		// retrieve root record from the state map or create a new one
		var root = mutatedByMap.get(mutated);
		if (!root) {
			root = makeRootRecord();
			mutatedByMap.set(mutated, root);
		}

		// retrieve or create a [key] DependencyRecord, if [key] was provided
		if (gotKey) {
			root.mutateDependenciesForKey.set(key, makeDependencyRecord());
		}

		var dependencyRecord = gotKey ?
			root.mutateDependenciesForKey.get(key) :
			root.mutateDependenciesForValue;

		if (mutator.valueDependencies) {
			canReflect.addValues(
				dependencyRecord.valueDependencies,
				mutator.valueDependencies
			);
		}

		if (mutator.keyDependencies) {
			canReflect.each(mutator.keyDependencies, function(keysSet, obj) {
				var entry = dependencyRecord.keyDependencies.get(obj);

				if (!entry) {
					entry = new Set();
					dependencyRecord.keyDependencies.set(obj, entry);
				}

				canReflect.addValues(entry, keysSet);
			});
		}
	},

	// Call this method with the same arguments as `addMutatedBy`
	// to unregister the mutation dependency
	deleteMutatedBy: function(mutated, key, mutator) {
		var gotKey = arguments.length === 3;
		var root = mutatedByMap.get(mutated);

		// normalize arguments
		if (arguments.length === 2) {
			mutator = key;
			key = undefined;
		}

		// normalize mutator when shorthand is used
		if (!mutator.keyDependencies && !mutator.valueDependencies) {
			mutator = { valueDependencies: new Set([mutator]) };
		}

		var dependencyRecord = gotKey ?
			root.mutateDependenciesForKey.get(key) :
			root.mutateDependenciesForValue;

		if (mutator.valueDependencies) {
			canReflect.removeValues(
				dependencyRecord.valueDependencies,
				mutator.valueDependencies
			);
		}

		if (mutator.keyDependencies) {
			canReflect.each(mutator.keyDependencies, function(keysSet, obj) {
				var entry = dependencyRecord.keyDependencies.get(obj);

				if (entry) {
					canReflect.removeValues(entry, keysSet);
					if (!entry.size) {
						dependencyRecord.keyDependencies.delete(obj);
					}
				}
			});
		}
	},

	getKeyDependencies: function(obj, key) {
		var dependencyRecord;
		var root = mutatedByMap.get(obj);

		if (root && root.mutateDependenciesForKey.has(key)) {
			dependencyRecord = root.mutateDependenciesForKey.get(key);
		}

		return getMutateDependencies(getKeyDependencies(obj, key), dependencyRecord);
	},

	getValueDependencies: function(obj) {
		var dependencyRecord;
		var root = mutatedByMap.get(obj);

		if (root) {
			dependencyRecord = root.mutateDependenciesForValue;
		}

		return getMutateDependencies(getValueDependencies(obj), dependencyRecord);
	}
};

"use strict";
var addMutatedBy = require("./src/add-mutated-by");
var deleteMutatedBy = require("./src/delete-mutated-by");
var getDependencyDataOf = require("./src/get-dependency-data-of");

var setMutationGroup = require("./src/set-mutation-group");
var clearMutationGroup = require("./src/clear-mutation-group");

// mutatedByMap :: WeakMap<obj, {
//	mutateDependenciesForKey:   Map<key, DependencyRecord>,
//	mutateDependenciesForValue: DependencyRecord,
//
//	mutationGroupOfMutateDependenciesForKey: Map<key, Map<mutator, groupName>>
//	mutationGroupOfMutateDependenciesForValue: Map<mutator, groupName>
// }>
var mutatedByMap = window.mutatedByMap = new WeakMap();

function CurrentMutationSource() {}
var mutationGroupKey = new CurrentMutationSource();

module.exports = {
	// Track mutations between observable as dependencies
	// addMutatedBy(obs, obs2);
	// addMutatedBy(obs, key, obs2);
	// addMutatedBy(obs, { valueDependencies: Set, keyDependencies: Map })
	// addMutatedBy(obs, key, { valueDependencies: Set, keyDependencies: Map })
	addMutatedBy: addMutatedBy(mutatedByMap, mutationGroupKey),

	// Call this method with the same arguments as `addMutatedBy`
	// to unregister the mutation dependency
	deleteMutatedBy: deleteMutatedBy(mutatedByMap),

	// Returns an object with the dependecies of the given argument
	//	{
	//		whatIChange: { mutate: DependencyRecord, derive: DependencyRecord },
	//		whatChangesMe: { mutate: DependencyRecord, derive: DependencyRecord }
	//	}
	getDependencyDataOf: getDependencyDataOf(mutatedByMap),

	// add a "group" of mutations
	// any mutations added with addMutatedBy will be associiated with this group
	setMutationGroup: setMutationGroup(mutatedByMap, mutationGroupKey),

	// delete current mutation group
	clearMutationGroup: clearMutationGroup(mutatedByMap, mutationGroupKey)
};

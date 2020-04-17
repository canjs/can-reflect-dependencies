module.exports = function(mutatedByMap, mutationGroupKey) {
	return function setMutationGroup(groupName) {
		mutatedByMap.set(mutationGroupKey, groupName);
	}
};

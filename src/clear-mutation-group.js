module.exports = function(mutatedByMap, mutationGroupKey) {
	return function clearMutationGroup() {
		mutatedByMap.delete(mutationGroupKey);
	}
};

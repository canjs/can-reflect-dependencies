var mut = require('./index');
var QUnit = require('steal-qunit');
var SimpleMap = require('can-simple-map');
var SimpleObservable = require('can-simple-observable');

QUnit.module('can-reflect-mutate-dependencies: one to one');

QUnit.test('value - value dependency', function(assert) {
	var one = new SimpleObservable('one');
	var two = new SimpleObservable('two');

	// canReflect.onValue(two, _ => one.set('three'));
	mut.addMutatedBy(one, two);

	assert.deepEqual(
		mut.getValueDependencies(one).mutatedValueDependencies,
		new Set([two])
	);

	mut.deleteMutatedBy(one, two);
	assert.equal(
		typeof mut.getValueDependencies(one),
		'undefined'
	);
});

QUnit.test('value - key dependency', function(assert) {
	var value = new SimpleObservable('one');
	var map = new SimpleMap({foo: 'foo'});
	var mutator = {
		keyDependencies: {
			foo: map
		}
	};

	// map.on('foo', _ => value.set('two'));
	mut.addMutatedBy(value, mutator);

	var expectedKeyMap = new Map();
	expectedKeyMap.set(map, new Set(['foo']));

	assert.deepEqual(
		mut.getValueDependencies(value).mutatedKeyDependencies,
		expectedKeyMap
	);

	mut.deleteMutatedBy(value, mutator);
	assert.equal(typeof mut.getValueDependencies(value), 'undefined');
});

QUnit.test('key - value dependency', function(assert) {
	var one = new SimpleObservable('one');
	var map = new SimpleMap({ foo: 'foo' });

	// canReflect.onValue(value, _ => map.foo = 'bar');
	mut.addMutatedBy(map, 'foo', one);

	assert.equal(
		typeof mut.getValueDependencies(map),
		'undefined',
		'has no value dependencies'
	);

	assert.deepEqual(
		mut.getKeyDependencies(map, 'foo').mutatedValueDependencies,
		new Set([one])
	);

	mut.deleteMutatedBy(map, 'foo', one);
	assert.equal(typeof mut.getKeyDependencies(map, 'foo'), 'undefined');
});

QUnit.module('can-reflect-mutate-dependencies: one to many');

QUnit.test('value - key & value dependencies', function(assert) {
	var value = new SimpleObservable('value');

	var map = new SimpleMap({ foo: 'foo' });
	var one = new SimpleObservable('one');
	var mutator = {
		keyDependencies: { foo: map },
		valueDependencies: [one]
	};

	// canReflect.onValue(one, _ => value.set('qux'))
	// canReflect.onKeyValue(map, 'foo', _ => value.set('bar'))
	mut.addMutatedBy(value, mutator);

	var expectedKeyMap = new Map();
	expectedKeyMap.set(map, new Set(['foo']));

	var res = mut.getValueDependencies(value);
	assert.deepEqual(res.mutatedValueDependencies, new Set([one]));
	assert.deepEqual(res.mutatedKeyDependencies, expectedKeyMap);

	mut.deleteMutatedBy(value, mutator);
	assert.equal(typeof mut.getValueDependencies(value), 'undefined');
});

QUnit.test('key - key & value dependencies', function(assert) {
	var map = new SimpleMap({ foo: 'foo' });

	var one = new SimpleObservable('one');
	var map2 = new SimpleMap({ bar: 'bar' });
	var mutator = {
		keyDependencies: {bar: map2},
		valueDependencies: [one]
	};

	// canReflect.onValue(one, _ => map.foo = 'baz')
	// canReflect.onKeyValue(map2, 'bar', _ => map.foo = 'qux')
	mut.addMutatedBy(map, 'foo', mutator);

	var expectedKeyMap = new Map();
	expectedKeyMap.set(map2, new Set(['bar']));

	var res = mut.getKeyDependencies(map, 'foo');
	assert.deepEqual(res.mutatedValueDependencies, new Set([one]));
	assert.deepEqual(res.mutatedKeyDependencies, expectedKeyMap);

	mut.deleteMutatedBy(map, 'foo', mutator);
	assert.equal(typeof mut.getKeyDependencies(map, 'foo'), 'undefined');
});

var QUnit = require('steal-qunit');
var SimpleMap = require('can-simple-map');
var SimpleObservable = require('can-simple-observable');
var canReflectDeps = require('./can-reflect-dependencies');

QUnit.module('can-reflect-dependencies');

QUnit.test('getMutateDependencies should not throw (#4)', function(assert) {
	var one = new SimpleObservable('one');

	assert.equal(
		typeof canReflectDeps.getValueDependencies(one),
		'undefined',
		'it should throw when obj missing from internal registry'
	);
});

QUnit.module('can-reflect-dependencies: one to one');

var makeKeyDependencies = function makeKeyDependencies(key, value) {
	var keyDependencies = new Map();
	keyDependencies.set(key, new Set(value));
	return keyDependencies;
};

QUnit.test('value - value dependency', function(assert) {
	var one = new SimpleObservable('one');
	var two = new SimpleObservable('two');

	// canReflect.onValue(two, _ => one.set('three'));
	canReflectDeps.addMutatedBy(one, two);

	assert.deepEqual(
		canReflectDeps.getValueDependencies(one).mutatedValueDependencies,
		new Set([two])
	);

	canReflectDeps.deleteMutatedBy(one, two);
	assert.equal(
		typeof canReflectDeps.getValueDependencies(one),
		'undefined'
	);
});

QUnit.test('value - key dependency', function(assert) {
	var value = new SimpleObservable('one');
	var map = new SimpleMap({foo: 'foo'});

	var keyDependencies = makeKeyDependencies(map, ['foo']);
	var mutator = { keyDependencies: keyDependencies };

	// map.on('foo', _ => value.set('two'));
	canReflectDeps.addMutatedBy(value, mutator);

	assert.deepEqual(
		canReflectDeps.getValueDependencies(value).mutatedKeyDependencies,
		keyDependencies
	);

	canReflectDeps.deleteMutatedBy(value, mutator);
	assert.equal(typeof canReflectDeps.getValueDependencies(value), 'undefined');
});

QUnit.test('key - value dependency', function(assert) {
	var one = new SimpleObservable('one');
	var map = new SimpleMap({ foo: 'foo' });

	// canReflect.onValue(value, _ => map.foo = 'bar');
	canReflectDeps.addMutatedBy(map, 'foo', one);

	assert.equal(
		typeof canReflectDeps.getValueDependencies(map),
		'undefined',
		'has no value dependencies'
	);

	assert.deepEqual(
		canReflectDeps.getKeyDependencies(map, 'foo').mutatedValueDependencies,
		new Set([one])
	);

	canReflectDeps.deleteMutatedBy(map, 'foo', one);
	assert.equal(typeof canReflectDeps.getKeyDependencies(map, 'foo'), 'undefined');
});

QUnit.module('can-reflect-dependencies: one to many');

QUnit.test('value - key & value dependencies', function(assert) {
	var value = new SimpleObservable('value');

	var map = new SimpleMap({ foo: 'foo' });
	var one = new SimpleObservable('one');

	var keyDependencies = makeKeyDependencies(map, ['foo']);
	var mutator = {
		keyDependencies: keyDependencies,
		valueDependencies: new Set([one])
	};

	// canReflect.onValue(one, _ => value.set('qux'))
	// canReflect.onKeyValue(map, 'foo', _ => value.set('bar'))
	canReflectDeps.addMutatedBy(value, mutator);

	var res = canReflectDeps.getValueDependencies(value);
	assert.deepEqual(res.mutatedValueDependencies, new Set([one]));
	assert.deepEqual(res.mutatedKeyDependencies, keyDependencies);

	canReflectDeps.deleteMutatedBy(value, mutator);
	assert.equal(typeof canReflectDeps.getValueDependencies(value), 'undefined');
});

QUnit.test('key - key & value dependencies', function(assert) {
	var map = new SimpleMap({ foo: 'foo' });

	var one = new SimpleObservable('one');
	var map2 = new SimpleMap({ bar: 'bar' });

	var keyDependencies = makeKeyDependencies(map2, ['bar']);
	var mutator = {
		keyDependencies: keyDependencies,
		valueDependencies: new Set([one])
	};

	// canReflect.onValue(one, _ => map.foo = 'baz')
	// canReflect.onKeyValue(map2, 'bar', _ => map.foo = 'qux')
	canReflectDeps.addMutatedBy(map, 'foo', mutator);

	var expectedKeyMap = new Map();
	expectedKeyMap.set(map2, new Set(['bar']));

	var res = canReflectDeps.getKeyDependencies(map, 'foo');
	assert.deepEqual(res.mutatedValueDependencies, new Set([one]));
	assert.deepEqual(res.mutatedKeyDependencies, expectedKeyMap);

	canReflectDeps.deleteMutatedBy(map, 'foo', mutator);
	assert.equal(typeof canReflectDeps.getKeyDependencies(map, 'foo'), 'undefined');
});

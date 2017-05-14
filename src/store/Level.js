
var level = require('level');
var levelws = require('level-ws');

END = Class.extend({});

Store = module.exports = Class.extend({
	
	initialize: function(properties) {
		
		Object.assign(this, properties);
		this.database = level('database')
		this.database = levelws(this.database);
	},
	
	mount: function() {
		
		this.connection.mount({
			id: 'store-put',
			on: function(request) {
				request.accept({
					topic: 'store',
					action: 'put'
				});
			}.bind(this),
			run: function(stream) {
				stream.request.writable = stream.request.writable || this.database.createWriteStream();
				var object = {
					key : [stream.request.pattern.collection, stream.object.key].join('\x00'),
					value : JSON.stringify(stream.object.value)
				};
				stream.request.writable.write(object);
				stream.push({
					put : stream.object
				});
				stream.next();
			}.bind(this),
			ending : function(stream) {
				if (stream.request.writable) stream.request.writable.end();
				stream.next();
			}
		});
		
		this.connection.mount({									// here, *potentially* simplify the query for processing
			id: 'store-get-begin',
			before : 'store-get',
			on: function(request) {
				request.accept({
					topic: 'store',
					action: 'get'
				});
			}.bind(this),
			run: function(stream) {
				stream.push(stream.object);
				stream.next();
			}.bind(this)
		});
		
		this.connection.mount({									// get every object and pass on for filtering
			id: 'store-get',
			on: function(request) {
				request.accept({
					topic: 'store',
					action: 'get'
				});
			}.bind(this),
			run: function(stream) {
				if (! stream.request.readable) {
					stream.request.readable = this.database.createReadStream({
						gt : [stream.request.pattern.collection, stream.object.key].join('\x00') + '\x00',
						lt : [stream.request.pattern.collection, stream.object.key].join('\x00') + '\xFF'
					});
					stream.request.readable
					.on('data', function(data) {
						data.key = data.key.split('\x00').splice(1).join('\x00');
						data.value = JSON.parse(data.value);
						stream.push(data);
					})
					.on('error', function (error) {
						console.error('Level readstream error: ', error);
					})
					.on('close', function() {
						if (false) console.log('Level readstream closed.');
					})
					.on('end', function() {
						if (false) console.log('Level readstream ended.');
						stream.push(new END());
						stream.next();
						if (false) stream.request.readable.close();
					});
				}
			}.bind(this)
		});
		
		this.connection.mount({
			id: 'store-get-transform',
			after : ['store-get'],
			on: function(request) {
				request.accept({
					topic: 'store',
					action: 'get'
				});
			}.bind(this),
			run: function(stream) {
				if (! (stream.object instanceof END)) {
					stream.object.value.id = stream.object.key
				}
				stream.push(stream.object);
				stream.next();
			}.bind(this)
		});
		
		this.connection.mount({
			id: 'store-get-match',
			after : ['store-get-transform', 'store-get'],
			on: function(request) {
				request.accept({
					topic: 'store',
					action: 'get',
					has: ['match']
				});
			}.bind(this),
			run: function(stream) {
				if (stream.object instanceof END) {
					stream.push(stream.object);
				} else {					
					var matches = false;
					Object.keys(stream.request.pattern.match).forEach(function(key) {
						var value = stream.request.pattern.match[key];
						if (stream.object.value[key] == value) {
							matches = true;
						}
						if (key == 'id') {
							if (stream.object.key == value) {
								matches = true;
							}
						}
					}.bind(this));
					if (matches) {
						stream.push(stream.object);
					}
				}
				stream.next();
			}.bind(this)
		});
		
		this.connection.mount({
			id: 'store-get-sort',
			after : ['store-get-match', 'store-get-transform', 'store-get'],
			on: function(request) {
				request.accept({
					topic: 'store',
					action: 'get',
					has: ['sort']
				});
			}.bind(this),
			run: function(stream) {
				stream.request.results = stream.request.results || [];
				if (stream.object instanceof END) {
					var key = null;
					if (stream.request.pattern.sort) {
						var keys = Object.keys(stream.request.pattern.sort);
						if (keys.length > 1) {
							console.warn('Level store sorting currently only supports a single sort level/key.');
						}
						Object.keys(stream.request.pattern.sort).forEach(function(each) {
							key = each;
						}.bind(this));
						stream.request.results.sort(function(a, b) {			// sorting only on a single key for now
							if (a.value[key] > b.value[key]) {
								return 1;
							} else if (a.value[key] < b.value[key]) {
								return -1;
							} else {
								return 0;
							}
						}.bind(this));
					}
					stream.request.results.forEach(function(each) {
						stream.push(each);
					}.bind(this));
					stream.push(new END());
				} else {
					stream.request.results.push(stream.object);
				}
				stream.next();
			}.bind(this)
		});
		
		this.connection.mount({
			id: 'store-get-reduce',
			after : ['store-get-sort', 'store-get-match', 'store-get-transform', 'store-get'],
			on: function(request) {
				request.accept({
					topic: 'store',
					action: 'get',
					has: ['reduce']
				});
			}.bind(this),
			run: function(stream) {
				if (stream.object instanceof END) {
					stream.push(stream.object);
				} else {
					if (stream.request.pattern.reduce) {
						var offset = stream.request.pattern.reduce.offset;
						var limit = stream.request.pattern.reduce.limit;
						if (! stream.request.counter) {
							stream.request.counter = 0;
						}
						if ((offset <= stream.request.counter) && (stream.request.counter < offset + limit)) {
							stream.push(stream.object);
						}
						stream.request.counter++;
					} else {
						stream.push(stream.object);
					}
				}
				stream.next();
			}.bind(this)
		});
		
		this.connection.mount({
			id: 'store-get-pluck',
			after : ['store-get-reduce', 'store-get-sort', 'store-get-match', 'store-get-transform', 'store-get'],
			on: function(request) {
				request.accept({
					topic: 'store',
					action: 'get',
					has: ['pluck']
				});
			}.bind(this),
			run: function(stream) {
				if (stream.object instanceof END) {
					stream.push(stream.object);
				} else {
					if (stream.request.pattern.pluck) {
						var object = {
							key : stream.object.key,
							value : {}
						};
						Object.keys(stream.request.pattern.pluck).forEach(function(key) {
							object.value[key] = stream.object.value[key];
						}.bind(this));
						stream.push(object);
					} else {
						stream.push(stream.object);
					}
				}
				stream.next();
			}.bind(this)
		});
		
		this.connection.mount({
			id: 'store-get-end',
			after : ['store-get-pluck', 'store-get-reduce', 'store-get-sort', 'store-get-match', 'store-get-transform', 'store-get'],
			on: function(request) {
				request.accept({
					topic: 'store',
					action: 'get'
				});
			}.bind(this),
			run: function(stream) {
				if (! (stream.object instanceof END)) {
					delete stream.object.id;
					stream.push(stream.object);
				}
				stream.next();
			}.bind(this)
		});
	},
	
	unmount : function() {
		
		
	}
});

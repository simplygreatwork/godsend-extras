
END = Class.extend({});

Common = module.exports = Class.extend({
	
	initialize: function(properties) {
		
		Object.assign(this, properties);
	},
	
	install: function() {
		
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
					var keys = Object.keys(stream.request.pattern.sort);
					if (keys.length > 1) {
						console.warn('Level store sorting currently only supports a single sort level/key.');
					}
					var key = null;
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
					var offset = stream.request.pattern.reduce.offset;
					var limit = stream.request.pattern.reduce.limit;
					if (! stream.request.counter) {
						stream.request.counter = 0;
					}
					if ((offset <= stream.request.counter) && (stream.request.counter < offset + limit)) {
						stream.push(stream.object);
					}
					stream.request.counter++;
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
					var value = {};
					Object.keys(stream.request.pattern.pluck).forEach(function(key) {
						value[key] = stream.object.value[key];
					}.bind(this));
					stream.push({
						key : stream.object.key,
						value : value
					});
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
	
	uninstall : function() {
		
		
	}
});

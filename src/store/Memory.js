
Store = module.exports = Class.extend({
	
	initialize: function(properties) {
		
		Object.assign(this, properties);
		this.storage = {};
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
				var collection = stream.request.pattern.collection;
				this.storage[collection] = this.storage[collection] || {};
				collection = this.storage[collection];
				collection[stream.object.key] = stream.object.value;
				stream.push({
					put : stream.object
				});
				stream.next();
			}.bind(this)
		});
		
		this.connection.mount({
			id: 'store-get',
			on: function(request) {
				request.accept({
					topic: 'store',
					action: 'get'
				});
			}.bind(this),
			run: function(stream) {
				var collection = stream.request.pattern.collection;
				this.storage[collection] = this.storage[collection] || {};
				collection = this.storage[collection];
				var key = stream.object.key;
				if (key) {
					stream.push({
						key : key,
						value : collection[key]
					})
				}
				stream.next();
			}.bind(this)
		});
		
		this.connection.mount({
			id: 'store-find',
			on: function(request) {
				request.accept({
					topic: 'store',
					action: 'find'
				});
			}.bind(this),
			run: function(stream) {
				var collection = stream.request.pattern.collection;
				this.storage[collection] = this.storage[collection] || {};
				collection = this.storage[collection];
				if (stream.object.fields) {
					Object.keys(collection).forEach(function(key) {
						var each = collection[key];
						var object = {};
						Object.keys(stream.object.fields).forEach(function(property) {
							object[property] = each[property];
						}.bind(this));
						stream.push({
							key : key,
							value : object
						});
					}.bind(this));
				} else {
					Object.keys(collection).forEach(function(key) {
						stream.push({
							key : key,
							value : collection[key]
						});
					}.bind(this));
				}
				stream.next();
			}.bind(this)
		});
	},
	
	unmount : function() {
		
		this.connection.unmount({
			id: 'store-put'
		});
		this.connection.unmount({
			id: 'store-get'
		});
		this.connection.unmount({
			id: 'store-find'
		});
	}
});

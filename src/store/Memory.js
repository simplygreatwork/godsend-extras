
Store = module.exports = Class.extend({
	
	initialize: function(properties) {
		
		Object.assign(this, properties);
		this.storage = {};
	},
	
	install: function() {
		
		var service = new(require('./Common'))({
			connection : this.connection
		});
		service.install();
		
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
				Object.keys(collection).forEach(function(key) {
					stream.push({
						key : key,
						value : collection[key]
					})
				}.bind(this));
				stream.next();
			}.bind(this)
		});
	},
	
	uninstall : function() {
		
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

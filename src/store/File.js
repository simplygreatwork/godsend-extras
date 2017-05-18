
Store = module.exports = Class.extend({
	
	initialize: function(properties) {
		
		Object.assign(this, properties);
	},
	
	install: function() {
		
		this.connection.mount({
			id: 'store-put',
			on: function(request) {
				request.accept({
					topic: 'store',
					action: 'put'
				});
			}.bind(this),
			run: function(stream) {
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
				stream.next();
			}.bind(this)
		});
		
		this.connection.mount({
			id: 'store-recent',
			on: function(request) {
				request.accept({
					topic: 'store',
					action: 'recent'
				});
			}.bind(this),
			run: function(stream) {
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
				stream.next();
			}.bind(this)
		});
	},
	
	uninstall : function() {
		
		
	}
});

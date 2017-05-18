
Broadcaster = module.exports = Class.extend({
	
	initialize: function(properties) {
		
		Object.assign(this, properties);
	},
	
	install: function() {
		
		this.connection.mount({
			id: 'store-put-broadcast',
			after: 'store-put',
			on: function(request) {
				request.accept({
					topic: 'store',
					action: 'put'
				});
			}.bind(this),
			run: function(stream) {
				this.connection.send({
					pattern: {
						topic: 'store',
						action: 'put-broadcast',
						collection: stream.request.pattern.collection
					},
					data: stream.object,
					receive: function(result) {
						stream.push(stream.object);
						stream.next();
					}.bind(this)
				});
			}.bind(this)
		});
	},
	
	uninstall : function() {
		
		
	}
});

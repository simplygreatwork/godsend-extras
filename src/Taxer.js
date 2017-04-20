
Taxer = module.exports = Class.extend({
	
	initialize: function(properties) {
		
		Object.assign(this, properties);
	},
	
	mount: function() {
		
		this.connection.mount({
			id: 'taxer',
			weight: -100,
			on: function(request) {
				request.accept({
					topic: 'taxer',
					action: 'calculate',
				});
			}.bind(this),
			run: function(stream) {
				stream.object.tax = 0;
				stream.push(stream.object);
				stream.next();
			}.bind(this)
		});
		
		this.connection.mount({
			id: 'taxer-texas',
			on: function(request) {
				request.accept({
					topic: 'taxer',
					action: 'calculate',
					state : 'texas'
				});
			}.bind(this),
			run: function(stream) {
				stream.object.tax = stream.object.tax + stream.object.balance * 0.0625
				stream.push(stream.object);
				stream.next();
			}.bind(this)
		});
		
		this.connection.mount({
			id: 'taxer-texas-austin',
			on: function(request) {
				request.accept({
					topic: 'taxer',
					action: 'calculate',
					state : 'texas',
					city : 'austin'
				});
			}.bind(this),
			run: function(stream) {
				stream.object.tax = stream.object.tax + stream.object.balance * 0.02
				stream.push(stream.object);
				stream.next();
			}.bind(this)
		});
	},
	
	unmount : function() {
		
		
	}
});

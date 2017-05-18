
Encoder = module.exports = Class.extend({
	
	initialize: function(properties) {
		
		Object.assign(this, properties);
	},
	
	install: function(properties) {
		
		this.connection.mount({
			route : properties.route || 'rebound',
			id: 'encode',
			weight : 0,
			on: function(request) {
				request.accept();
			}.bind(this),
			run: function(stream) {
				stream.push({
					encoded : JSON.stringify(stream.object).split('').reverse().join('')
				});
				stream.next();
			}.bind(this)
		});
	},
	
	uninstall : function() {
		
		this.connection.unmount({
			id: 'encode'
		});
	}
});

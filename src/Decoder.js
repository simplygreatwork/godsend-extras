
Decoder = module.exports = Class.extend({
	
	initialize: function(properties) {
		
		Object.assign(this, properties);
	},
	
	install: function(properties) {
		
		this.connection.mount({
			route : properties.route || 'rebound',
			id: 'decode',
			weight : 0,
			on: function(request) {
				request.accept();
			}.bind(this),
			run: function(stream) {
				var string = stream.object.encoded.split('').reverse().join('');
				var object = JSON.parse(string);
				stream.push(object);
				stream.next();
			}.bind(this)
		});
	},
	
	uninstall : function() {
		
		this.connection.unmount({
			id: 'decode'
		});
	}
});

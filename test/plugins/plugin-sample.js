
const dutils = require('dmidz-utils')
	, Promise = require('bluebird')
;


function PluginSample( server, options ) {
	const me = this;
	me.server = server;
	me.options = dutils.mixin({//__ default options
		some_property : 777
	}, options, true );

}


PluginSample.prototype = {
	initialize : function(){
		let me = this;
		return new Promise( function( resolve, reject ){
			//___ 3 errors handling tests
			// throwing.an.error;
			// throw new Error('awfull error !');
			// reject( new Error('awfull error !') );

			me.server.expose({
				getSomeProperty : function(){   return me.options.some_property;}
			});

			me.server.route({
				method: 'GET'
				, path: '/hello'
				, config : {
					handler: function (request, reply) {
						return reply({ title: 'homepage', content:'Hello !' });
					}
				}
			});
			//__ allow to insure async things could be prepared before considering registered by the server
			setTimeout( resolve , 150 );
		})
		;
	}
};

exports.register = function( server, options, next ){
	return new PluginSample( server, options ).initialize().then( next, next );
};

exports.register.attributes = { name: 'plugin-sample', version: '1.0.0' };


const Hapi = require('hapi')
	, Path = require('path')
	, Promise = require('bluebird')
	, dutils = require('dmidz-utils')
	, Bunyan = require('bunyan')
    , bformat = require('bunyan-format')
    , formatOut = bformat({ outputMode: 'json' })
	;


function App( options ) {
	const me = this;
	me.options = dutils.mixin({//__ default options
		/*__ by default server is initialized but not started, best for testing requests by using inject */
		start_server : false
		/*__ server settings : will be passed to Hapi.Server constructor */
		, settings : {
			app : {
				root : process.cwd()
				, dirs : {
					plugins : Path.join( process.cwd(), 'plugins')
				}
			}
		}
		/*__ keys paired object list of plugins with properties, the key is the plugin module which will be require'd
			- custom : if true will require it from settings.dirs.plugins, else require as is (node_modules)
			- options : object that will be passed to the plugin
			- disabled : if true, the plugin will not be registered
			- register_options : object will be passed to server.register (ex : {routes:{prefix:'/api'}}
		*/
		, plugins : null

		// , directories : {
		// 	plugins : Path.join( __dirname, 'plugins')
		// }
	}, options, true );

	// console.log('new App', me.options );

	me.logger = me.options.logger || Bunyan.createLogger({ name: 'App'
		, src:1
		, stream: formatOut
		, hostname : '-'
	});

    //__ server
    me.server = new Hapi.Server(
    	me.options.settings
    );
    me.server.connection({
        host: 'localhost',
        port: me.normalizePort( me.options.port || 3000 )
    });
}

App.prototype = {
	initialize : function(){
		const me = this;
		if( me.options.routes ) me.server.route( me.options.routes );

		//__
		return me.registerPlugins( me.options.plugins ).then( function(){
			return me.server.initialize();
		}).then(function(){
			//__ catch error after route handlers, such JSON cyclic ref error
			me.server.on('request-error', function( request, err ){
				me.logger.error(err, '### request error (500) ['+request.id+'] ');
			});
			//__
			me.server.ext('onPreHandler', function(request, reply){
				// me.logger.info('onPreHandler' );
				request.app.view_ctx = {
					plugins : me.plugins_views_payload
				};
				reply.continue();
			});


			if( me.options.start_server ){
				return me.server.start().then(function(){
					me.logger.info( me.server.info , 'Server running :');
					return me;
				}).catch(function(err){
					me.logger.error( err, 'StartErr' );
				});
			}

			return me;
		}).catch(function( err ){
			me.logger.error( err, 'initialize error' );
			me.server.stop();
		});

	}
	, registerPlugins : function( plugins ){
		const me = this;

		const prs = [];
		if( plugins ){
			const pluginRegisterCallback = function(err){
				// console.log('- plugin registered');
				if (err){ me.logger.error( err, 'plugin registration error : '+this.key ); return err; }
				console.log('- plugin registered :', this.key );
				let po = plugins[this.key];
				if( po.onRegistered ) po.onRegistered( me );
				//__ default replyPayload from plugin exposed vars
				// me.plugins_views_payload[key] = me.server.plugins[this.key];
				// console.log('plugin_views_payload', me.server.plugins[this.key] );
			};
			//__ conf plugins
			for(let key in plugins){
				let po = plugins[key];
				if( check(po, 'f')) po = po( me );
				if( po.disabled )   continue;
				// console.log('wana register plugin', key );
				prs.push( me.server.register( {
						register : require( po.custom?Path.join( me.server.settings.app.dirs.plugins, key ):key )
						, options: po.options
					}, po.register_options||{} ).then( pluginRegisterCallback.bind({key:key}) )
				);
			}
		}

		// console.log('_prs', prs );

		//_ use each (sequencially) in prod
		return Promise.all( prs ).then(function(){

			// console.log('__ all plugins registered');

			me.server.decorate('server', 'getRegisterOptions', function( plugin_key, path, default_value ){
				let res = default_value;
				let plugin = me.options.plugins[plugin_key];
				if(!plugin) return res;
				res = plugin.register_options;
				if(!check(path,'s'))    return res;
				return dutils.get( res, path, default_value );
			});

			me.server.decorate('server', 'getAllRoutes', function(){
				let res = [];
				let routes = me.server.table();
				if(routes[0] && routes[0].table ){
					for(let i = 0, max = routes[0].table.length; i < max; i++){
						let route = routes[0].table[i];
						res.push( {
							path :route.path
							, method : route.method
						} );
					}
				}
				return res;
			});
		});
	}
	, normalizePort: function( val ){
		let port = parseInt( val, 10 );
		if( isNaN( port ) )  return val;// named pipe
		if( port >= 0 )  return port;// port number
		return false;
	}

};

//__________ exports
module.exports = App;

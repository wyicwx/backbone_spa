/**
 * 基于Backbone的MVC模块
 */
define('helper/base', function(require, exports) {
	var app = exports;
	/**
	 * 自动加载函数，cmd/amd
	 * @abstract
	 */
	app.autoload = function(module, callback) {
		throw new Error('app.autoload is abstract function, override it.');
	};
	
	app.BaseView = Backbone.View.extend({
		app: app,
		super: function(fn) {
			
		},
		constructor: function() {
			this.ajaxQueue = {};
			app.BaseView.__super__.constructor.apply(this, arguments);
		},
		viewWillAddStage: function() {},
		viewAddedStage: function() {},
		viewWillRemoveStage: function() {},
		viewRemovedStage: function() {},
		viewBeActive: function() {},
		viewBeInActive: function() {},
		ajax: function() {
			return Backbone.ajax.apply(this, arguments);
		}
	}, {
		singleton: function() {
			if(!this.__instache) {
				this.__instache = new this();
			}
			return this.__instache;
		}
	});

	app.BaseModel = Backbone.Model.extend({
		app: app
	}, {
		singleton: function() {
			if(!this.__singleton) {
				this.__singleton = new this();
			}
			return this.__singleton;
		}
	});

	app.BaseCollection = Backbone.Collection.extend({
		app: app
	}, {
		singleton: function() {
			if(!this.__singleton) {
				this.__singleton = new this();
			}
			return this.__singleton;
		}
	});

	app.MainView = app.BaseView.extend({});

	app.ActionView = app.BaseView.extend({});

	app.ControllerView = app.BaseView.extend({
		app: app,
		defaultAction: 'index',
		Actions: {},
		activeParams: null,
		activeAction: null,
		prepareAction: function(action) {
			if(!action || !(action in this.Actions)) {
				action = this.defaultAction;
			}
			if(!(action in this.actions)) {
				var ActionClass = this.Actions[action].extend({
					controller: this
				});
				this.actions[action] = new ActionClass();
				this.actions[action].$el.addClass(action+'Action');
				this.actions[action].viewWillAddStage();
				this.$el.append(this.actions[action].$el);
				this.actions[action].viewAddedStage();
			}
			return action;
		},
		dispath: function(action, rawParams) {
			var actionInstance = this.actions[action];

			this.activeParams = this.parseParams(rawParams);

			if(this.activeAction && this.activeAction != action && this.actions[this.activeAction]) {
				this.actions[this.activeAction].viewBeInActive();
			}
			this.activeAction = action;
			actionInstance.viewBeActive(this.activeParams);
		},
		destroyAction: function() {
			_.each(this.actions, function(action) {
				action.viewWillRemoveStage();
				action.$el.remove();
				action.viewRemovedStage();
			});
			this.actions = {};
		},
		constructor: function() {
			this.actions = {};
			app.ControllerView.__super__.constructor.apply(this, arguments);
		},
		parseParams: function(rawParams) {
			if(!rawParams) {
				return {};
			}
			// normalize
			rawParams.replace(/\/+/g, '\/');
			// split by /
			rawParams = rawParams.split('/');

			var keys = _.reject(rawParams, function(value, key){ return key % 2 == 1; });
			var values = _.reject(rawParams, function(value, key){ return key % 2 == 0; });

			return _.object(keys, values);
		}
	});

	/**
	 * router 控制controller行为
	 * controller 控制action行为
	 */
	app.Router = Backbone.Router.extend({
		app: app,
		routes: {
			'': 'router',
			':controller': 'router',
			':controller/:action': 'router',
			':controller/:action/*params': 'router'
		},
		previousController: null,
		activeController: null,
		previousAction: null,
		activeAction: null,
		rawParams: null,
		Controller: {},
		defaultController: 'index',
		errorController: null,
		mainView: null,
		// routing entrance
		router: function(controller, action, params) {
			params || (params = '');
			var rawParams;
			var self = this;
			if(!(controller in this.Controller)) {
				rawParams = _.compact([controller, action, params]).join('/');
				controller = this.errorController || this.defaultController;
			}

			this.prepareController(controller, function(controllerInstance) {
				var activeAction = controllerInstance.prepareAction(action);
				self.activeAction = activeAction;
				if(!rawParams) {
					if(activeAction != action) {
						rawParams = _.compact([action, params]).join('/');
					} else {
						rawParams = params;
					}
				}

				if(controller != self.activeController) {
					if(self.activeController) {
						self.controllers[self.activeController].destroyAction();
						self.controllers[self.activeController].viewWillRemoveStage();
						self.controllers[self.activeController].$el.remove();
						self.controllers[self.activeController].viewRemovedStage();
						self.previousController = self.activeController;
					}

					controllerInstance.viewWillAddStage();
					self.mainView.$el.append(controllerInstance.$el);
					controllerInstance.viewAddedStage();
				}
				self.activeController = controller;

				controllerInstance.viewBeActive();
				controllerInstance.dispath(activeAction, rawParams);
			});
		},
		prepareController: function(controller, callback) {
			var self = this;
			if(!(controller in this.controllers)) {
				app.autoload(this.Controller[controller], function(Controller) {
					var instance = self.controllers[controller] = Controller.singleton();
					instance.$el.addClass(controller+'Controller');
					callback(Controller.singleton());
				});
			} else {
				callback(this.controllers[controller]);
			}
		},
		constructor: function(args) {
			this.controllers = {};
			if(args) {
				_.extend(this, args);
			}
			app.Router.__super__.constructor.apply(this,arguments);
			if(!this.mainView) {
				throw new Error('Router.mainView is abstract property, override it.');
			}
		}
	});

});

var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
System.register("node_modules/angular2-jwt/angular2-jwt", ['angular2/core', 'angular2/http', 'rxjs/Observable'], function(exports_1) {
    var core_1, http_1, Observable_1;
    var AuthConfig, AuthHttp, JwtHelper;
    /**
     * Checks for presence of token and that token hasn't expired.
     * For use with the @CanActivate router decorator and NgIf
     */
    function tokenNotExpired(tokenName, jwt) {
        var authToken = tokenName || 'id_token';
        var token;
        if (jwt) {
            token = jwt;
        }
        else {
            token = localStorage.getItem(authToken);
        }
        var jwtHelper = new JwtHelper();
        if (!token || jwtHelper.isTokenExpired(token, null)) {
            return false;
        }
        else {
            return true;
        }
    }
    exports_1("tokenNotExpired", tokenNotExpired);
    return {
        setters:[
            function (core_1_1) {
                core_1 = core_1_1;
            },
            function (http_1_1) {
                http_1 = http_1_1;
            },
            function (Observable_1_1) {
                Observable_1 = Observable_1_1;
            }],
        execute: function() {
            /**
             * Sets up the authentication configuration.
             */
            AuthConfig = (function () {
                function AuthConfig(config) {
                    var _this = this;
                    this.config = config || {};
                    this.headerName = this.config.headerName || 'Authorization';
                    this.headerPrefix = this.config.headerPrefix || 'Bearer ';
                    this.tokenName = this.config.tokenName || 'id_token';
                    this.noJwtError = this.config.noJwtError || false;
                    this.tokenGetter = this.config.tokenGetter || (function () { return localStorage.getItem(_this.tokenName); });
                }
                AuthConfig.prototype.getConfig = function () {
                    return {
                        headerName: this.headerName,
                        headerPrefix: this.headerPrefix,
                        tokenName: this.tokenName,
                        tokenGetter: this.tokenGetter,
                        noJwtError: this.noJwtError
                    };
                };
                return AuthConfig;
            })();
            exports_1("AuthConfig", AuthConfig);
            /**
             * Allows for explicit authenticated HTTP requests.
             */
            AuthHttp = (function () {
                function AuthHttp(options, http) {
                    var _this = this;
                    this.http = http;
                    this._config = options.getConfig();
                    this.tokenStream = new Observable_1.Observable(function (obs) {
                        obs.next(_this._config.tokenGetter());
                    });
                }
                AuthHttp.prototype._request = function (url, options) {
                    var request;
                    if (!tokenNotExpired(null, this._config.tokenGetter())) {
                        if (!this._config.noJwtError) {
                            throw 'Invalid JWT';
                        }
                        else {
                            request = this.http.request(url, options);
                        }
                    }
                    else if (typeof url === 'string') {
                        var reqOpts = options || {};
                        if (!reqOpts.headers) {
                            reqOpts.headers = new http_1.Headers();
                        }
                        reqOpts.headers.set(this._config.headerName, this._config.headerPrefix + this._config.tokenGetter());
                        request = this.http.request(url, reqOpts);
                    }
                    else {
                        var req = url;
                        if (!req.headers) {
                            req.headers = new http_1.Headers();
                        }
                        req.headers.set(this._config.headerName, this._config.headerPrefix + this._config.tokenGetter());
                        request = this.http.request(req);
                    }
                    return request;
                };
                AuthHttp.prototype.requestHelper = function (requestArgs, additionalOptions) {
                    var options = new http_1.RequestOptions(requestArgs);
                    if (additionalOptions) {
                        options = options.merge(additionalOptions);
                    }
                    return this._request(new http_1.Request(options));
                };
                AuthHttp.prototype.get = function (url, options) {
                    return this.requestHelper({ url: url, method: http_1.RequestMethod.Get }, options);
                };
                AuthHttp.prototype.post = function (url, body, options) {
                    return this.requestHelper({ url: url, body: body, method: http_1.RequestMethod.Post }, options);
                };
                AuthHttp.prototype.put = function (url, body, options) {
                    return this.requestHelper({ url: url, body: body, method: http_1.RequestMethod.Put }, options);
                };
                AuthHttp.prototype.delete = function (url, options) {
                    return this.requestHelper({ url: url, method: http_1.RequestMethod.Delete }, options);
                };
                AuthHttp.prototype.patch = function (url, body, options) {
                    return this.requestHelper({ url: url, body: body, method: http_1.RequestMethod.Patch }, options);
                };
                AuthHttp.prototype.head = function (url, options) {
                    return this.requestHelper({ url: url, method: http_1.RequestMethod.Head }, options);
                };
                AuthHttp = __decorate([
                    core_1.Injectable(), 
                    __metadata('design:paramtypes', [AuthConfig, (typeof (_a = typeof http_1.Http !== 'undefined' && http_1.Http) === 'function' && _a) || Object])
                ], AuthHttp);
                return AuthHttp;
                var _a;
            })();
            exports_1("AuthHttp", AuthHttp);
            /**
             * Helper class to decode and find JWT expiration.
             */
            JwtHelper = (function () {
                function JwtHelper() {
                }
                JwtHelper.prototype.urlBase64Decode = function (str) {
                    var output = str.replace(/-/g, '+').replace(/_/g, '/');
                    switch (output.length % 4) {
                        case 0: {
                            break;
                        }
                        case 2: {
                            output += '==';
                            break;
                        }
                        case 3: {
                            output += '=';
                            break;
                        }
                        default: {
                            throw 'Illegal base64url string!';
                        }
                    }
                    return decodeURIComponent(escape(window.atob(output))); //polifyll https://github.com/davidchambers/Base64.js
                };
                JwtHelper.prototype.decodeToken = function (token) {
                    var parts = token.split('.');
                    if (parts.length !== 3) {
                        throw new Error('JWT must have 3 parts');
                    }
                    var decoded = this.urlBase64Decode(parts[1]);
                    if (!decoded) {
                        throw new Error('Cannot decode the token');
                    }
                    return JSON.parse(decoded);
                };
                JwtHelper.prototype.getTokenExpirationDate = function (token) {
                    var decoded;
                    decoded = this.decodeToken(token);
                    if (typeof decoded.exp === "undefined") {
                        return null;
                    }
                    var date = new Date(0); // The 0 here is the key, which sets the date to the epoch
                    date.setUTCSeconds(decoded.exp);
                    return date;
                };
                JwtHelper.prototype.isTokenExpired = function (token, offsetSeconds) {
                    var date = this.getTokenExpirationDate(token);
                    offsetSeconds = offsetSeconds || 0;
                    if (date === null) {
                        return false;
                    }
                    // Token expired?
                    return !(date.valueOf() > (new Date().valueOf() + (offsetSeconds * 1000)));
                };
                return JwtHelper;
            })();
            exports_1("JwtHelper", JwtHelper);
        }
    }
});
System.register("components/tree", ['angular2/core', 'angular2/router', "node_modules/angular2-jwt/angular2-jwt", 'angular2/common', 'services/tree', 'services/user', 'models/treeOptions', 'components/hooks/action', 'pipes/get'], function(exports_2) {
    var core_2, router_1, angular2_jwt_1, common_1, tree_1, user_1, treeOptions_1, action_1, get_1;
    var TreeComponent;
    return {
        setters:[
            function (core_2_1) {
                core_2 = core_2_1;
            },
            function (router_1_1) {
                router_1 = router_1_1;
            },
            function (angular2_jwt_1_1) {
                angular2_jwt_1 = angular2_jwt_1_1;
            },
            function (common_1_1) {
                common_1 = common_1_1;
            },
            function (tree_1_1) {
                tree_1 = tree_1_1;
            },
            function (user_1_1) {
                user_1 = user_1_1;
            },
            function (treeOptions_1_1) {
                treeOptions_1 = treeOptions_1_1;
            },
            function (action_1_1) {
                action_1 = action_1_1;
            },
            function (get_1_1) {
                get_1 = get_1_1;
            }],
        execute: function() {
            TreeComponent = (function () {
                function TreeComponent(treeService, _user, routeParams, router, location, builder) {
                    var _this = this;
                    this.treeService = treeService;
                    this._user = _user;
                    this.routeParams = routeParams;
                    this.router = router;
                    this.location = location;
                    this.breadcrumb = [];
                    this.pages = [];
                    this.options = new treeOptions_1.TreeOptions();
                    this.sortOptions = ['name', 'time', 'atime', 'size'];
                    this.params = {
                        search: [''],
                        page: [1],
                        sort: ['name'],
                        order: ['asc'],
                        limit: ['10'],
                        path: ['/']
                    };
                    this.paths = [];
                    this.term = new common_1.Control();
                    this.treeForm = builder.group(this.params);
                    this.tree = treeService.list(this.treeForm.valueChanges)
                        .do(function (tree) { return _this.onUpdate(tree); });
                }
                Object.defineProperty(TreeComponent.prototype, "user", {
                    get: function () {
                        return this._user.user;
                    },
                    enumerable: true,
                    configurable: true
                });
                /**
                 * Bind data to the view when request ends
                 */
                TreeComponent.prototype.onUpdate = function (tree) {
                    this.breadcrumb = tree.breadcrumb;
                    this.pages = tree.pages;
                    this.storageOptions = this.treeForm.value;
                    var instruction = this.router.generate(['Tree', this.treeForm.value]);
                    var home = this.location.normalize(this.user.home);
                    var path = instruction.toUrlPath().replace(home, '');
                    this.location.go(path, instruction.toUrlQuery());
                    this.options = tree.options;
                };
                /**
                 * Workaround as radio inputs are not implemented yet
                 */
                TreeComponent.prototype.setOrderValue = function (v) {
                    this.treeForm.controls.order.updateValue(v);
                };
                /**
                 * onLoad
                 * why the hack on setTimeout?
                 */
                TreeComponent.prototype.ngOnInit = function () {
                    var _this = this;
                    setTimeout(function () {
                        var params = _this.routeParams.params;
                        var options = _this.storageOptions;
                        for (var i in _this.options) {
                            if (i in params) {
                                _this.options[i] = params[i];
                            }
                            else {
                                _this.options[i] = _this.storageOptions[i];
                            }
                        }
                    });
                };
                /**
                 * Checkbox onChange
                 */
                TreeComponent.prototype.checkElement = function (event) {
                    var v = event.srcElement.value;
                    var index = this.paths.indexOf(v);
                    if (!~index) {
                        this.paths.push(v);
                    }
                    else {
                        this.paths.splice(index, 1);
                    }
                };
                Object.defineProperty(TreeComponent.prototype, "storageOptions", {
                    get: function () {
                        var opts = localStorage.getItem('tree_options');
                        if (!opts)
                            return {};
                        opts = JSON.parse(opts);
                        opts.search = '';
                        return opts;
                    },
                    set: function (opts) {
                        var o = {};
                        for (var i in opts) {
                            o = opts[i];
                        }
                        delete o.search;
                        return localStorage.setItem('tree_options', JSON.stringify(opts));
                    },
                    enumerable: true,
                    configurable: true
                });
                TreeComponent.prototype.navigate = function (options) {
                    var controls = this.treeForm.controls;
                    for (var i in options) {
                        if (i in controls && controls[i].value != options[i]) {
                            controls[i].updateValue(options[i]);
                        }
                    }
                };
                TreeComponent = __decorate([
                    core_2.Component({
                        templateUrl: 'templates/tree.html',
                        providers: [tree_1.TreeService, user_1.UserService],
                        directives: [router_1.RouterLink, action_1.ActionHooksComponent],
                        pipes: [get_1.Get]
                    }),
                    router_1.CanActivate(function () { return angular2_jwt_1.tokenNotExpired(); }), 
                    __metadata('design:paramtypes', [(typeof (_a = typeof tree_1.TreeService !== 'undefined' && tree_1.TreeService) === 'function' && _a) || Object, (typeof (_b = typeof user_1.UserService !== 'undefined' && user_1.UserService) === 'function' && _b) || Object, (typeof (_c = typeof router_1.RouteParams !== 'undefined' && router_1.RouteParams) === 'function' && _c) || Object, (typeof (_d = typeof router_1.Router !== 'undefined' && router_1.Router) === 'function' && _d) || Object, (typeof (_e = typeof router_1.Location !== 'undefined' && router_1.Location) === 'function' && _e) || Object, (typeof (_f = typeof common_1.FormBuilder !== 'undefined' && common_1.FormBuilder) === 'function' && _f) || Object])
                ], TreeComponent);
                return TreeComponent;
                var _a, _b, _c, _d, _e, _f;
            })();
            exports_2("TreeComponent", TreeComponent);
        }
    }
});
System.register("components/settings", ['angular2/core'], function(exports_3) {
    var core_3;
    var SettingsComponent;
    return {
        setters:[
            function (core_3_1) {
                core_3 = core_3_1;
            }],
        execute: function() {
            SettingsComponent = (function () {
                function SettingsComponent() {
                }
                SettingsComponent = __decorate([
                    core_3.Component({
                        templateUrl: 'templates/settings.html'
                    }), 
                    __metadata('design:paramtypes', [])
                ], SettingsComponent);
                return SettingsComponent;
            })();
            exports_3("SettingsComponent", SettingsComponent);
        }
    }
});
System.register("components/admin", ['angular2/core'], function(exports_4) {
    var core_4;
    var AdminComponent;
    return {
        setters:[
            function (core_4_1) {
                core_4 = core_4_1;
            }],
        execute: function() {
            AdminComponent = (function () {
                function AdminComponent() {
                }
                AdminComponent = __decorate([
                    core_4.Component({
                        templateUrl: 'templates/admin.html'
                    }), 
                    __metadata('design:paramtypes', [])
                ], AdminComponent);
                return AdminComponent;
            })();
            exports_4("AdminComponent", AdminComponent);
        }
    }
});
System.register("components/login", ['angular2/core', 'angular2/http', 'models/user', "node_modules/angular2-jwt/angular2-jwt", 'angular2/router', 'services/token'], function(exports_5) {
    var core_5, http_2, user_2, angular2_jwt_2, router_2, token_1;
    var LoginComponent;
    return {
        setters:[
            function (core_5_1) {
                core_5 = core_5_1;
            },
            function (http_2_1) {
                http_2 = http_2_1;
            },
            function (user_2_1) {
                user_2 = user_2_1;
            },
            function (angular2_jwt_2_1) {
                angular2_jwt_2 = angular2_jwt_2_1;
            },
            function (router_2_1) {
                router_2 = router_2_1;
            },
            function (token_1_1) {
                token_1 = token_1_1;
            }],
        execute: function() {
            LoginComponent = (function () {
                function LoginComponent(http, router, location, token) {
                    this.http = http;
                    this.router = router;
                    this.location = location;
                    this.token = token;
                    this.error = null;
                    this.user = new user_2.User();
                }
                LoginComponent.prototype.onSubmit = function () {
                    var _this = this;
                    var headers = new http_2.Headers();
                    headers.append('Content-Type', 'application/json');
                    this.http.post('/login', JSON.stringify(this.user), { headers: headers })
                        .map(function (res) { return res.json(); })
                        .subscribe(function (data) {
                        _this.token.token = data.token;
                        _this.location.replaceState('/');
                        _this.router.navigate(['Tree', { path: data.home }]);
                    }, function (err) { return _this.error = err; });
                };
                LoginComponent = __decorate([
                    core_5.Component({
                        templateUrl: 'templates/login.html'
                    }),
                    router_2.CanActivate(function () { return !angular2_jwt_2.tokenNotExpired(); }), 
                    __metadata('design:paramtypes', [(typeof (_a = typeof http_2.Http !== 'undefined' && http_2.Http) === 'function' && _a) || Object, (typeof (_b = typeof router_2.Router !== 'undefined' && router_2.Router) === 'function' && _b) || Object, (typeof (_c = typeof router_2.Location !== 'undefined' && router_2.Location) === 'function' && _c) || Object, (typeof (_d = typeof token_1.TokenService !== 'undefined' && token_1.TokenService) === 'function' && _d) || Object])
                ], LoginComponent);
                return LoginComponent;
                var _a, _b, _c, _d;
            })();
            exports_5("LoginComponent", LoginComponent);
        }
    }
});
System.register("components/notifications", ['angular2/core', 'services/notifications'], function(exports_6) {
    var core_6, notifications_1;
    var NotificationsComponent;
    return {
        setters:[
            function (core_6_1) {
                core_6 = core_6_1;
            },
            function (notifications_1_1) {
                notifications_1 = notifications_1_1;
            }],
        execute: function() {
            NotificationsComponent = (function () {
                function NotificationsComponent(el, renderer, _notifications) {
                    this.el = el;
                    this.renderer = renderer;
                    this._notifications = _notifications;
                }
                Object.defineProperty(NotificationsComponent.prototype, "notifications", {
                    get: function () {
                        return this._notifications.notifications;
                    },
                    enumerable: true,
                    configurable: true
                });
                NotificationsComponent.prototype.open = function () {
                    console.log(this.el);
                };
                NotificationsComponent = __decorate([
                    core_6.Component({
                        templateUrl: 'templates/notifications.html',
                        selector: 'explorer-notifications',
                        providers: [notifications_1.NotificationsService]
                    }), 
                    __metadata('design:paramtypes', [(typeof (_a = typeof core_6.ElementRef !== 'undefined' && core_6.ElementRef) === 'function' && _a) || Object, (typeof (_b = typeof core_6.Renderer !== 'undefined' && core_6.Renderer) === 'function' && _b) || Object, (typeof (_c = typeof notifications_1.NotificationsService !== 'undefined' && notifications_1.NotificationsService) === 'function' && _c) || Object])
                ], NotificationsComponent);
                return NotificationsComponent;
                var _a, _b, _c;
            })();
            exports_6("NotificationsComponent", NotificationsComponent);
        }
    }
});
System.register("components/messages", ['angular2/core', 'services/messages'], function(exports_7) {
    var core_7, messages_1;
    var MessagesComponent;
    return {
        setters:[
            function (core_7_1) {
                core_7 = core_7_1;
            },
            function (messages_1_1) {
                messages_1 = messages_1_1;
            }],
        execute: function() {
            MessagesComponent = (function () {
                function MessagesComponent(messages) {
                    this.messages = messages;
                }
                MessagesComponent = __decorate([
                    core_7.Component({
                        templateUrl: 'templates/messages.html',
                        selector: 'explorer-messages',
                        providers: [messages_1.MessagesService]
                    }), 
                    __metadata('design:paramtypes', [(typeof (_a = typeof messages_1.MessagesService !== 'undefined' && messages_1.MessagesService) === 'function' && _a) || Object])
                ], MessagesComponent);
                return MessagesComponent;
                var _a;
            })();
            exports_7("MessagesComponent", MessagesComponent);
        }
    }
});
System.register("components/menu", ['angular2/core', 'angular2/router', 'services/notifications', 'services/user', 'services/token'], function(exports_8) {
    var core_8, router_3, notifications_2, user_3, token_2;
    var MenuComponent;
    return {
        setters:[
            function (core_8_1) {
                core_8 = core_8_1;
            },
            function (router_3_1) {
                router_3 = router_3_1;
            },
            function (notifications_2_1) {
                notifications_2 = notifications_2_1;
            },
            function (user_3_1) {
                user_3 = user_3_1;
            },
            function (token_2_1) {
                token_2 = token_2_1;
            }],
        execute: function() {
            MenuComponent = (function () {
                function MenuComponent(notifications, _user, token) {
                    this.notifications = notifications;
                    this._user = _user;
                    this.token = token;
                }
                Object.defineProperty(MenuComponent.prototype, "user", {
                    get: function () {
                        return this._user.user;
                    },
                    enumerable: true,
                    configurable: true
                });
                //logout click
                MenuComponent.prototype.logout = function () {
                    this._user.logout();
                    this.router.navigate(['Login']);
                };
                __decorate([
                    core_8.Input(), 
                    __metadata('design:type', Object)
                ], MenuComponent.prototype, "open", void 0);
                MenuComponent = __decorate([
                    core_8.Component({
                        templateUrl: 'templates/menu.html',
                        selector: 'explorer-menu',
                        directives: [router_3.RouterLink],
                        providers: [notifications_2.NotificationsService, user_3.UserService, token_2.TokenService]
                    }), 
                    __metadata('design:paramtypes', [(typeof (_a = typeof notifications_2.NotificationsService !== 'undefined' && notifications_2.NotificationsService) === 'function' && _a) || Object, (typeof (_b = typeof user_3.UserService !== 'undefined' && user_3.UserService) === 'function' && _b) || Object, (typeof (_c = typeof token_2.TokenService !== 'undefined' && token_2.TokenService) === 'function' && _c) || Object])
                ], MenuComponent);
                return MenuComponent;
                var _a, _b, _c;
            })();
            exports_8("MenuComponent", MenuComponent);
        }
    }
});
System.register("components/app", ['angular2/core', 'angular2/router', "components/tree", "components/settings", "components/admin", "components/login", "components/notifications", "components/messages", "components/menu", 'services/token'], function(exports_9) {
    var core_9, router_4, tree_2, settings_1, admin_1, login_1, notifications_3, messages_2, menu_1, token_3;
    var AppComponent;
    return {
        setters:[
            function (core_9_1) {
                core_9 = core_9_1;
            },
            function (router_4_1) {
                router_4 = router_4_1;
            },
            function (tree_2_1) {
                tree_2 = tree_2_1;
            },
            function (settings_1_1) {
                settings_1 = settings_1_1;
            },
            function (admin_1_1) {
                admin_1 = admin_1_1;
            },
            function (login_1_1) {
                login_1 = login_1_1;
            },
            function (notifications_3_1) {
                notifications_3 = notifications_3_1;
            },
            function (messages_2_1) {
                messages_2 = messages_2_1;
            },
            function (menu_1_1) {
                menu_1 = menu_1_1;
            },
            function (token_3_1) {
                token_3 = token_3_1;
            }],
        execute: function() {
            AppComponent = (function () {
                function AppComponent(router, location, token) {
                    this.router = router;
                    this.location = location;
                    this.token = token;
                    this.open = { left: false, right: false };
                }
                AppComponent.prototype.inNav = function (el) {
                    var node = el.parentNode;
                    while (node != null) {
                        if (node.tagName === 'NAV')
                            return true;
                        node = node.parentNode;
                    }
                    return false;
                };
                AppComponent.prototype.close = function ($event) {
                    if (this.inNav($event.target)) {
                        return;
                    }
                    this.open.left = false;
                    this.open.right = false;
                };
                AppComponent.prototype.ngOnInit = function () {
                    if (this.token.expired() !== false ||
                        this.router.isRouteActive(this.router.generate(['/Login']))) {
                        return;
                    }
                    this.location.replaceState('/');
                    this.router.navigate(['Login']);
                };
                AppComponent = __decorate([
                    core_9.Component({
                        selector: 'explorer-app',
                        templateUrl: 'templates/app.html',
                        directives: [router_4.ROUTER_DIRECTIVES, notifications_3.NotificationsComponent, messages_2.MessagesComponent, menu_1.MenuComponent],
                        providers: [token_3.TokenService]
                    }),
                    router_4.RouteConfig([
                        { path: '/:path', name: 'Tree', component: tree_2.TreeComponent },
                        { path: '/login', name: 'Login', component: login_1.LoginComponent },
                        { path: '/settings', name: 'Settings', component: settings_1.SettingsComponent },
                        { path: '/admin', name: 'Admin', component: admin_1.AdminComponent }
                    ]), 
                    __metadata('design:paramtypes', [(typeof (_a = typeof router_4.Router !== 'undefined' && router_4.Router) === 'function' && _a) || Object, (typeof (_b = typeof router_4.Location !== 'undefined' && router_4.Location) === 'function' && _b) || Object, (typeof (_c = typeof token_3.TokenService !== 'undefined' && token_3.TokenService) === 'function' && _c) || Object])
                ], AppComponent);
                return AppComponent;
                var _a, _b, _c;
            })();
            exports_9("AppComponent", AppComponent);
        }
    }
});
System.register("boot", ['rxjs/add/operator/map', 'rxjs/add/operator/debounceTime', 'rxjs/add/operator/debounce', 'rxjs/add/operator/distinctUntilChanged', 'rxjs/add/operator/switchMap', 'rxjs/add/operator/do', 'rxjs/add/operator/delay', 'angular2/platform/browser', 'angular2/core', "components/app", 'angular2/router', 'angular2/http', "node_modules/angular2-jwt/angular2-jwt"], function(exports_10) {
    var browser_1, core_10, app_1, router_5, http_3, angular2_jwt_3;
    var ErrorResponseOptions;
    return {
        setters:[
            function (_1) {},
            function (_2) {},
            function (_3) {},
            function (_4) {},
            function (_5) {},
            function (_6) {},
            function (_7) {},
            function (browser_1_1) {
                browser_1 = browser_1_1;
            },
            function (core_10_1) {
                core_10 = core_10_1;
            },
            function (app_1_1) {
                app_1 = app_1_1;
            },
            function (router_5_1) {
                router_5 = router_5_1;
            },
            function (http_3_1) {
                http_3 = http_3_1;
            },
            function (angular2_jwt_3_1) {
                angular2_jwt_3 = angular2_jwt_3_1;
            }],
        execute: function() {
            ErrorResponseOptions = (function (_super) {
                __extends(ErrorResponseOptions, _super);
                function ErrorResponseOptions() {
                    _super.apply(this, arguments);
                }
                return ErrorResponseOptions;
            })(http_3.BaseResponseOptions);
            // class JsonRequestOptions extends RequestOptions {
            // }
            browser_1.bootstrap(app_1.AppComponent, [
                http_3.HTTP_PROVIDERS,
                // provide(RequestOptions, {useClass: JsonRequestOptions}),
                core_10.provide(angular2_jwt_3.AuthConfig, { useFactory: function () { return new angular2_jwt_3.AuthConfig(); } }),
                angular2_jwt_3.AuthHttp,
                router_5.ROUTER_PROVIDERS,
                // PathLocationStrategy,
                core_10.provide(router_5.APP_BASE_HREF, { useValue: window.location.origin })
            ])
                .catch(function (err) { return console.error(err); });
        }
    }
});
System.register("directives/notifications", ['angular2/core'], function(exports_11) {
    var core_11;
    var NotificationsDirective;
    return {
        setters:[
            function (core_11_1) {
                core_11 = core_11_1;
            }],
        execute: function() {
            NotificationsDirective = (function () {
                function NotificationsDirective(el, renderer) {
                    this.el = el;
                    this.renderer = renderer;
                }
                NotificationsDirective.prototype.onClick = function () { this._toggle(); };
                NotificationsDirective.prototype._toggle = function () {
                    console.log(this.renderer);
                };
                NotificationsDirective = __decorate([
                    core_11.Directive({
                        selector: '[notifications]',
                        host: {
                            '(click)': 'onClick'
                        }
                    }), 
                    __metadata('design:paramtypes', [(typeof (_a = typeof core_11.ElementRef !== 'undefined' && core_11.ElementRef) === 'function' && _a) || Object, (typeof (_b = typeof core_11.Renderer !== 'undefined' && core_11.Renderer) === 'function' && _b) || Object])
                ], NotificationsDirective);
                return NotificationsDirective;
                var _a, _b;
            })();
            exports_11("NotificationsDirective", NotificationsDirective);
        }
    }
});
System.register("pipes/get", ['angular2/core'], function(exports_12) {
    var core_12;
    var Get;
    return {
        setters:[
            function (core_12_1) {
                core_12 = core_12_1;
            }],
        execute: function() {
            Get = (function () {
                function Get() {
                }
                Get.prototype.transform = function (v, args) {
                    if (!v) {
                        return;
                    }
                    return v[args[0]];
                };
                Get = __decorate([
                    core_12.Pipe({ name: 'get' }), 
                    __metadata('design:paramtypes', [])
                ], Get);
                return Get;
            })();
            exports_12("Get", Get);
        }
    }
});
System.register("models/tree", ['models/treeOptions'], function(exports_13) {
    var treeOptions_2;
    var Tree;
    return {
        setters:[
            function (treeOptions_2_1) {
                treeOptions_2 = treeOptions_2_1;
            }],
        execute: function() {
            Tree = (function () {
                function Tree(tree) {
                    if (tree === void 0) { tree = {}; }
                    this.tree = tree.tree;
                    this.options = new treeOptions_2.TreeOptions(tree.options);
                    this.breadcrumb = tree.breadcrumb;
                }
                Tree.prototype.contains = function (property, value) {
                    var result = false;
                    for (var i in this.tree) {
                        var element = this.tree[i];
                        if (property in element) {
                            if (Array.isArray(value))
                                return ~value.indexOf(element.property);
                            else
                                return value == element.property;
                        }
                    }
                };
                Object.defineProperty(Tree.prototype, "pages", {
                    get: function () {
                        var pages = [];
                        for (var i = 0; i < this.options.pages; i++) {
                            pages[i] = i + 1;
                        }
                        return pages;
                    },
                    enumerable: true,
                    configurable: true
                });
                return Tree;
            })();
            exports_13("Tree", Tree);
        }
    }
});
System.register("models/treeOptions", [], function(exports_14) {
    var TreeOptions;
    return {
        setters:[],
        execute: function() {
            TreeOptions = (function () {
                function TreeOptions(opts) {
                    this.search = '';
                    this.page = 1;
                    this.sort = 'name';
                    this.order = 'asc';
                    this.limit = 10;
                    this.parent = '';
                    this.path = '';
                    this.root = '';
                    this.size = 0;
                    this.pages = 0;
                    this.num = 0;
                    this.canRemove = false;
                    if (!opts)
                        return;
                    for (var i in opts) {
                        if (i in this)
                            this[i] = opts[i];
                    }
                }
                return TreeOptions;
            })();
            exports_14("TreeOptions", TreeOptions);
        }
    }
});
System.register("models/user", [], function(exports_15) {
    var User;
    return {
        setters:[],
        execute: function() {
            User = (function () {
                function User(id, username, password, token) {
                    this.id = id;
                    this.username = username;
                    this.password = password;
                    this.token = token;
                }
                return User;
            })();
            exports_15("User", User);
        }
    }
});
System.register("services/hooks", ["node_modules/angular2-jwt/angular2-jwt", 'angular2/core', 'services/hooks/action'], function(exports_16) {
    var angular2_jwt_4, core_13, action_2;
    var HooksService;
    return {
        setters:[
            function (angular2_jwt_4_1) {
                angular2_jwt_4 = angular2_jwt_4_1;
            },
            function (core_13_1) {
                core_13 = core_13_1;
            },
            function (action_2_1) {
                action_2 = action_2_1;
            }],
        execute: function() {
            HooksService = (function () {
                function HooksService(_http, action) {
                    this._http = _http;
                    this.action = action;
                }
                HooksService = __decorate([
                    core_13.Injectable(), 
                    __metadata('design:paramtypes', [angular2_jwt_4.AuthHttp, (typeof (_a = typeof action_2.ActionHook !== 'undefined' && action_2.ActionHook) === 'function' && _a) || Object])
                ], HooksService);
                return HooksService;
                var _a;
            })();
            exports_16("HooksService", HooksService);
        }
    }
});
System.register("services/messages", ['angular2/core', 'angular2/http'], function(exports_17) {
    var core_14, http_4;
    var errors, infos, MessagesService;
    return {
        setters:[
            function (core_14_1) {
                core_14 = core_14_1;
            },
            function (http_4_1) {
                http_4 = http_4_1;
            }],
        execute: function() {
            errors = [];
            infos = [];
            MessagesService = (function () {
                function MessagesService() {
                    this.timeout = 1650;
                    this.infos = infos;
                    this.errors = errors;
                }
                MessagesService.prototype.handle = function (item, scope) {
                    var _this = this;
                    if (item instanceof http_4.Response) {
                        item = item.json();
                    }
                    this[scope].push(item);
                    setTimeout(function () { return _this.remove(item, scope); }, this.timeout);
                };
                MessagesService.prototype.hasMessages = function () {
                    return infos && infos.length || errors && errors.length;
                };
                MessagesService.prototype.error = function (err) {
                    return this.handle(err, 'errors');
                };
                MessagesService.prototype.info = function (info) {
                    return this.handle(info, 'infos');
                };
                MessagesService.prototype.remove = function (item, scope) {
                    var index = this[scope].indexOf(item);
                    if (~index)
                        this[scope].splice(index, 1);
                };
                MessagesService.prototype.removeError = function (err) {
                    return this.remove(err, 'errors');
                };
                MessagesService.prototype.removeInfo = function (info) {
                    return this.remove(info, 'infos');
                };
                MessagesService = __decorate([
                    core_14.Injectable(), 
                    __metadata('design:paramtypes', [])
                ], MessagesService);
                return MessagesService;
            })();
            exports_17("MessagesService", MessagesService);
        }
    }
});
System.register("services/notifications", ["node_modules/angular2-jwt/angular2-jwt", 'angular2/core', 'services/token'], function(exports_18) {
    var angular2_jwt_5, core_15, token_4;
    var NotificationsService;
    return {
        setters:[
            function (angular2_jwt_5_1) {
                angular2_jwt_5 = angular2_jwt_5_1;
            },
            function (core_15_1) {
                core_15 = core_15_1;
            },
            function (token_4_1) {
                token_4 = token_4_1;
            }],
        execute: function() {
            NotificationsService = (function () {
                function NotificationsService(token, http) {
                    var _this = this;
                    this.token = token;
                    this.http = http;
                    this.timeout = 1650;
                    this._notifications = [];
                    this._num = 0;
                    this.client = new Faye.Client(window.location.origin + '/socket', { timeout: this.timeout });
                    //@TODO
                    //http.get('/notif')
                    this.client.addExtension({
                        outgoing: function (message, callback) {
                            message.ext = message.ext || {};
                            message.ext.key = token.user.key;
                            return callback(message);
                        }
                    });
                    var notify = '/notify/' + this.token.user.username;
                    this.client.subscribe(notify, this.onNotifications);
                    this.http.get('/api/notifications')
                        .map(function (res) { return res.json(); })
                        .subscribe(function (response) {
                        _this._notifications = response.notifications;
                        _this._num = response.num;
                    });
                }
                Object.defineProperty(NotificationsService.prototype, "notifications", {
                    get: function () {
                        return this._notifications;
                    },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(NotificationsService.prototype, "num", {
                    get: function () {
                        return this._num;
                    },
                    enumerable: true,
                    configurable: true
                });
                NotificationsService.prototype.onNotifications = function (data) {
                    this._notifications.push(data);
                };
                NotificationsService.prototype.removeAll = function () {
                    console.log(arguments);
                };
                NotificationsService.prototype.remove = function (item) {
                    console.log(arguments);
                };
                NotificationsService = __decorate([
                    core_15.Injectable(), 
                    __metadata('design:paramtypes', [(typeof (_a = typeof token_4.TokenService !== 'undefined' && token_4.TokenService) === 'function' && _a) || Object, angular2_jwt_5.AuthHttp])
                ], NotificationsService);
                return NotificationsService;
                var _a;
            })();
            exports_18("NotificationsService", NotificationsService);
        }
    }
});
System.register("services/token", ["node_modules/angular2-jwt/angular2-jwt", 'angular2/core'], function(exports_19) {
    var angular2_jwt_6, core_16;
    var TokenService;
    return {
        setters:[
            function (angular2_jwt_6_1) {
                angular2_jwt_6 = angular2_jwt_6_1;
            },
            function (core_16_1) {
                core_16 = core_16_1;
            }],
        execute: function() {
            TokenService = (function () {
                function TokenService() {
                    this.jwtHelper = new angular2_jwt_6.JwtHelper();
                }
                TokenService.prototype.expired = function () {
                    var token = localStorage.getItem('id_token');
                    if (!token)
                        return true;
                    return this.jwtHelper.isTokenExpired(token);
                };
                Object.defineProperty(TokenService.prototype, "token", {
                    get: function () {
                        return localStorage.getItem('id_token');
                    },
                    set: function (token) {
                        return localStorage.setItem('id_token', token);
                    },
                    enumerable: true,
                    configurable: true
                });
                TokenService.prototype.remove = function () {
                    return localStorage.removeItem('id_token');
                };
                Object.defineProperty(TokenService.prototype, "user", {
                    get: function () {
                        var token = localStorage.getItem('id_token');
                        if (!token) {
                            this.userCache = null;
                            return {};
                        }
                        if (this.userCache)
                            return this.userCache;
                        this.userCache = this.jwtHelper.decodeToken(token);
                        return this.userCache;
                    },
                    enumerable: true,
                    configurable: true
                });
                TokenService = __decorate([
                    core_16.Injectable(), 
                    __metadata('design:paramtypes', [])
                ], TokenService);
                return TokenService;
            })();
            exports_19("TokenService", TokenService);
        }
    }
});
System.register("services/tree", ["node_modules/angular2-jwt/angular2-jwt", 'angular2/core', 'angular2/http', 'models/tree', 'rxjs/Rx'], function(exports_20) {
    var angular2_jwt_7, core_17, http_5, tree_3, Rx;
    var TreeService;
    return {
        setters:[
            function (angular2_jwt_7_1) {
                angular2_jwt_7 = angular2_jwt_7_1;
            },
            function (core_17_1) {
                core_17 = core_17_1;
            },
            function (http_5_1) {
                http_5 = http_5_1;
            },
            function (tree_3_1) {
                tree_3 = tree_3_1;
            },
            function (Rx_1) {
                Rx = Rx_1;
            }],
        execute: function() {
            TreeService = (function () {
                function TreeService(_http) {
                    this._http = _http;
                    this.search = '';
                    this.headers = new http_5.Headers();
                    this.headers.append('Content-Type', 'application/json');
                }
                TreeService.prototype.optionsToURLSearchParams = function (options) {
                    var search = new http_5.URLSearchParams();
                    for (var i in options) {
                        search.set(i, options[i]);
                    }
                    return search;
                };
                TreeService.prototype.getItems = function (options) {
                    var url = options.search ? 'search' : 'tree';
                    options = this.optionsToURLSearchParams(options);
                    return this._http.get("/api/" + url + "?" + options.toString())
                        .map(function (res) {
                        return new tree_3.Tree(res.json());
                    });
                };
                TreeService.prototype.list = function (options, debounceTime) {
                    var _this = this;
                    if (debounceTime === void 0) { debounceTime = 400; }
                    return options
                        .distinctUntilChanged()
                        .debounce(function (x) {
                        var debounce = false;
                        //new search
                        if (x.search && x.search != this.search) {
                            this.search = x.search;
                            if (x.page != 1)
                                x.page = 1;
                            debounce = true;
                        }
                        return Rx.Observable.timer(debounce ? debounceTime : 1);
                    })
                        .switchMap(function (options) { return _this.getItems(options); });
                };
                TreeService.prototype.actionHook = function (data) {
                    return this._http.post('/api/tree', JSON.stringify(data), { headers: this.headers });
                };
                TreeService = __decorate([
                    core_17.Injectable(), 
                    __metadata('design:paramtypes', [angular2_jwt_7.AuthHttp])
                ], TreeService);
                return TreeService;
            })();
            exports_20("TreeService", TreeService);
        }
    }
});
System.register("services/user", ['angular2/core', 'services/token'], function(exports_21) {
    var core_18, token_5;
    var UserService;
    return {
        setters:[
            function (core_18_1) {
                core_18 = core_18_1;
            },
            function (token_5_1) {
                token_5 = token_5_1;
            }],
        execute: function() {
            UserService = (function () {
                function UserService(_token) {
                    this._token = _token;
                }
                Object.defineProperty(UserService.prototype, "user", {
                    get: function () {
                        return this._token.user;
                    },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(UserService.prototype, "token", {
                    get: function () {
                        return this._token.token;
                    },
                    enumerable: true,
                    configurable: true
                });
                UserService.prototype.logout = function () {
                    var _this = this;
                    return this.http.get('/logout')
                        .subscribe(function () { return _this.token.remove(); });
                };
                UserService = __decorate([
                    core_18.Injectable(), 
                    __metadata('design:paramtypes', [(typeof (_a = typeof token_5.TokenService !== 'undefined' && token_5.TokenService) === 'function' && _a) || Object])
                ], UserService);
                return UserService;
                var _a;
            })();
            exports_21("UserService", UserService);
        }
    }
});
System.register("utils/url", [], function(exports_22) {
    function url(path, params) {
        var s = path;
        var first = true;
        for (var i in params) {
            s += first === true ? '?' : '&';
            s += i + '=' + encodeURIComponent(params[i]);
            first = false;
        }
        return s;
    }
    exports_22("url", url);
    return {
        setters:[],
        execute: function() {
        }
    }
});
System.register("utils/utils", [], function(exports_23) {
    function extend(v) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        for (var a in args)
            for (var k in args[a])
                v[k] = args[a][k];
        return v;
    }
    exports_23("extend", extend);
    return {
        setters:[],
        execute: function() {
        }
    }
});
System.register("components/hooks/action", ['angular2/core', 'services/hooks', 'services/hooks/action', 'services/tree', 'services/messages'], function(exports_24) {
    var core_19, hooks_1, action_3, tree_4, messages_3;
    var ActionHooksComponent;
    function toComponent(template, directives) {
        if (directives === void 0) { directives = []; }
        var DynamicComponent = (function () {
            function DynamicComponent() {
            }
            DynamicComponent = __decorate([
                core_19.Component({
                    selector: 'dynamic-component',
                    template: template
                }), 
                __metadata('design:paramtypes', [])
            ], DynamicComponent);
            return DynamicComponent;
        })();
        return DynamicComponent;
    }
    return {
        setters:[
            function (core_19_1) {
                core_19 = core_19_1;
            },
            function (hooks_1_1) {
                hooks_1 = hooks_1_1;
            },
            function (action_3_1) {
                action_3 = action_3_1;
            },
            function (tree_4_1) {
                tree_4 = tree_4_1;
            },
            function (messages_3_1) {
                messages_3 = messages_3_1;
            }],
        execute: function() {
            ActionHooksComponent = (function () {
                function ActionHooksComponent(loader, element, hooks, treeService, messages) {
                    this.loader = loader;
                    this.element = element;
                    this.hooks = hooks;
                    this.treeService = treeService;
                    this.messages = messages;
                }
                ActionHooksComponent.prototype.send = function () {
                    var _this = this;
                    if (this.action == 'archive.download') {
                        return document.getElementById('tree-form').submit();
                    }
                    this.hooks.action.post({ action: this.action, filename: this.filename, path: this.paths })
                        .subscribe(function (resp) {
                        _this.messages.info(resp);
                    }, function (err) {
                        _this.messages.error(err);
                    });
                };
                ActionHooksComponent.prototype.ngOnInit = function () {
                    var _this = this;
                    this.action = 'archive.download';
                    this.filename = 'archive-' + Date.now();
                    this.hooks.action.get()
                        .subscribe(function (res) {
                        _this.loader.loadAsRoot(toComponent(res), '#action-hook')
                            .then(function (componentRef) {
                            componentRef.instance.tree = _this.tree;
                            _this.dynamicComponent = componentRef.instance;
                        });
                    }, function (err) { return _this.messages.error(err); });
                };
                ActionHooksComponent = __decorate([
                    core_19.Component({
                        selector: 'action-hooks',
                        templateUrl: 'templates/hooks/action.html',
                        providers: [hooks_1.HooksService, tree_4.TreeService, messages_3.MessagesService, action_3.ActionHook],
                        inputs: ['tree', 'paths']
                    }), 
                    __metadata('design:paramtypes', [(typeof (_a = typeof core_19.DynamicComponentLoader !== 'undefined' && core_19.DynamicComponentLoader) === 'function' && _a) || Object, (typeof (_b = typeof core_19.ElementRef !== 'undefined' && core_19.ElementRef) === 'function' && _b) || Object, (typeof (_c = typeof hooks_1.HooksService !== 'undefined' && hooks_1.HooksService) === 'function' && _c) || Object, (typeof (_d = typeof tree_4.TreeService !== 'undefined' && tree_4.TreeService) === 'function' && _d) || Object, (typeof (_e = typeof messages_3.MessagesService !== 'undefined' && messages_3.MessagesService) === 'function' && _e) || Object])
                ], ActionHooksComponent);
                return ActionHooksComponent;
                var _a, _b, _c, _d, _e;
            })();
            exports_24("ActionHooksComponent", ActionHooksComponent);
        }
    }
});
System.register("services/hooks/action", ["node_modules/angular2-jwt/angular2-jwt", 'angular2/core', 'angular2/http'], function(exports_25) {
    var angular2_jwt_8, core_20, http_6;
    var ActionHook;
    return {
        setters:[
            function (angular2_jwt_8_1) {
                angular2_jwt_8 = angular2_jwt_8_1;
            },
            function (core_20_1) {
                core_20 = core_20_1;
            },
            function (http_6_1) {
                http_6 = http_6_1;
            }],
        execute: function() {
            ActionHook = (function () {
                function ActionHook(_http) {
                    this._http = _http;
                    this.headers = new http_6.Headers();
                    this.headers.append('Content-Type', 'application/json');
                }
                ActionHook.prototype.get = function () {
                    return this._http.get('/api/hooks/action')
                        .map(function (res) { return res.text(); });
                };
                ActionHook.prototype.post = function (data) {
                    return this._http.post('/api/tree', JSON.stringify(data), { headers: this.headers });
                };
                ActionHook = __decorate([
                    core_20.Injectable(), 
                    __metadata('design:paramtypes', [angular2_jwt_8.AuthHttp])
                ], ActionHook);
                return ActionHook;
            })();
            exports_25("ActionHook", ActionHook);
        }
    }
});

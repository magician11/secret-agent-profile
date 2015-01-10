angular.module('secretAgentProfile', ['firebase', 'ngRoute', 'ngCookies'])

.run(function($rootScope, $location, Browser, $window) {
    $rootScope.$on("$routeChangeError", function(event, next, previous, error) {
        // Catch the error thrown when the $requireAuth promise is rejected due to not being logged in
        // and redirect the user back to the login page
        if (error === "AUTH_REQUIRED") {
            $location.path('/login');
        }
    });

    // check if Speech Synthesis is supported by their browser
    $rootScope.$on( "$locationChangeStart", function(event, next, current) {

        if(!$window.speechSynthesis) {
            $location.path('/browser');
        }
    });

})

.factory('Browser', function($window) {

    var getBrowser = function() {

        var userAgent = $window.navigator.userAgent;

        var browsers = {chrome: /chrome/i, safari: /safari/i, firefox: /firefox/i, ie: /internet explorer/i};

        for(var key in browsers) {
            if (browsers[key].test(userAgent)) {
                return key;
            }
        };

        return 'unknown';
    };

    return getBrowser;

})

.factory('Auth', function($firebaseAuth) {

    var init = function() {
        var ref = new Firebase('https://popping-heat-7331.firebaseio.com');
        return $firebaseAuth(ref);
    };

    // booleans to check whether that controller was loaded
    // used to prevent callbacks being added multiple times on reloads
    var visitedLoginView = false;
    var visitedProfileView = false;

    return {
        firebaseAuth: init,
        visitedLoginView: visitedLoginView,
        visitedProfileView: visitedProfileView
    }
})

.factory('Command', function($location, $rootScope) {

    // change pages/routes and speak message
    var changePage = function(message, location) {
        var headOffice = new SpeechSynthesisUtterance(message);

        headOffice.onend = function(event) {
            $rootScope.$apply(function() {
                $location.path(location);
            });
        };

        setTimeout(function() {
            window.speechSynthesis.speak(headOffice);
        }, 100);
    };

    var commandMessage = function(message) {
        var headOffice = new SpeechSynthesisUtterance(message);
        window.speechSynthesis.speak(headOffice);
    }

    return {
        changePage: changePage,
        speakFromCommand: commandMessage
    }
})

.config(function($routeProvider, $locationProvider) {
    $routeProvider

    .when('/login', {
        templateUrl: 'pages/login.html',
        controller: 'SecretAgentLoginCtrl',
        resolve: {
            'currentAuth': function(Auth) {
                return Auth.firebaseAuth().$waitForAuth();
            }
        }
    }).when('/', {
        templateUrl: 'pages/profile.html',
        controller: 'SecretAgentProfileCtrl',
        resolve: {
            'currentAuth': function(Auth) {
                return Auth.firebaseAuth().$requireAuth();
            }
        }
    }).when('/browser', {
        templateUrl: 'pages/browser.html'
    }).otherwise({
        redirectTo: '/'
    });
    /*
    $locationProvider.html5Mode({
        enabled: true,
        requireBase: false
    });
    */
})

.controller("SecretAgentLoginCtrl", function($scope, Auth, Command, $cookies, $timeout) {
    function authDataCallback(authData) {

        if (authData) {    
            $scope.$apply();
            Command.changePage('Thank you ' + authData.google.displayName + '. Verification confirmed.', '/');
        }

    }

    $scope.auth = Auth.firebaseAuth();

    if(!Auth.visitedLoginView) {
        $scope.auth.$onAuth(authDataCallback);
        Auth.visitedLoginView = true;
    }

    if(!$cookies.alreadyVisited) {
        Command.speakFromCommand('You are in a restricted area. Please authenticate.');
        $cookies.alreadyVisited = true;
    }
})

.controller("SecretAgentProfileCtrl", function($scope, Auth, Command) {

    function authDataCallback(authData) {

        $scope.user = authData;

        if (authData == null) {
            Command.changePage('Logging out.', '/login');
        }
    }

    $scope.auth = Auth.firebaseAuth();
    if(!Auth.visitedProfileView) {
        $scope.auth.$onAuth(authDataCallback);
        Auth.visitedProfileView = true;
    }

    $scope.user = $scope.auth.$getAuth();

    Command.speakFromCommand('Welcome back!');
});
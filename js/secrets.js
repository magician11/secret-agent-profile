angular.module('secretAgentProfile', ['firebase', 'ngRoute', 'ngCookies'])

.run(function($rootScope, $location, Browser, $window) {
    $rootScope.$on("$routeChangeError", function(event, next, previous, error) {
        // Catch the error thrown when the $requireAuth promise is rejected due to not being logged in
        // and redirect the user back to the login page
        if (error === "AUTH_REQUIRED") {
            console.log("Authentication required.. going to login screen..");
            $location.path('/login');
        }
    });

    // check if Speech Synthesis is supported by their browser
    $rootScope.$on( "$locationChangeStart", function(event, next, current) {

        if(!$window.speechSynthesis) {
            console.log("User is using " + Browser() + " and speech synthesis is " + $window.speechSynthesis);
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
    var ref = new Firebase('https://popping-heat-7331.firebaseio.com');
    return $firebaseAuth(ref);
})

.factory('Command', function($location, $rootScope) {

    var changePage = function(message, location) {
        var headOffice = new SpeechSynthesisUtterance(message);

        headOffice.onend = function(event) {
            $rootScope.$apply(function() {
                console.log("Going to " + location);
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
                return Auth.$waitForAuth();
            }
        }
    }).when('/', {
        templateUrl: 'pages/profile.html',
        controller: 'SecretAgentProfileCtrl',
        resolve: {
            'currentAuth': function(Auth) {
                return Auth.$requireAuth();
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

.controller("SecretAgentLoginCtrl", function($scope, Auth, Command, $cookies) {
    function authDataCallback(authData) {
        $scope.user = authData;

        if (authData) {    
            Command.changePage('Thank you ' + $scope.user.google.displayName + '. Verification confirmed.', '/');
        }
    }

    $scope.auth = Auth;
    $scope.auth.$onAuth(authDataCallback);

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

    $scope.auth = Auth;
    $scope.auth.$onAuth(authDataCallback);
    $scope.user = $scope.auth.$getAuth();

    Command.speakFromCommand('Welcome back!');
});
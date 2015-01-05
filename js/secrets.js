angular.module('secretAgentProfile', ['firebase', 'ngRoute', 'ngCookies'])

.run(function($rootScope, $location) {
    $rootScope.$on("$routeChangeError", function(event, next, previous, error) {
        // We can catch the error thrown when the $requireAuth promise is rejected
        // and redirect the user back to the home page
        if (error === "AUTH_REQUIRED") {
            console.log("Authentication required.. going to login screen..");
            $location.path('/login');
        }
    });
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
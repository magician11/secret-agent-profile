angular.module('secretAgentProfile', ['firebase'])

.controller("SecretAgentLoginCtrl", function($scope, $firebaseAuth) {
    function authDataCallback(authData) {
        $scope.user = authData;

        if (authData) {
            var headOffice = new SpeechSynthesisUtterance('Welcome back ' + $scope.user.google.displayName);
            window.speechSynthesis.speak(headOffice);
            $scope.$apply();
        } else {
            //console.log("User is logged out");
        }
    }

    // Register the callback to be fired every time auth state changes
    var ref = new Firebase("https://popping-heat-7331.firebaseio.com");
    $scope.auth = $firebaseAuth(ref);
    ref.onAuth(authDataCallback);
})
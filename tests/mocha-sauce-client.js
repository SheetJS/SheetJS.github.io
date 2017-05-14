function JSONReport(runner) {
	var root = null;
	var res = {};

	runner.on('end', function() {
		recurse(this.suite, res);
		window.jsonReport = res;
	});

	function recurse(suite, result) {
		result.durationSec = 0;
		result.passed = true;
		if(suite.title) result.description = suite.title;

		if(suite.tests.length) {
			result.specs = [];
			for (var i = 0; i < suite.tests.length; i++) {
				result.specs.push({
					"description": suite.tests[i].title,
					"durationSec": (suite.tests[i].duration / 1000) || 0,
					"passed": suite.tests[i].state === "passed"
				});

				result.durationSec += (suite.tests[i].duration / 1000) || 0;
				if(suite.tests[i].state === "failed") result.passed = false;
			}
		}

		if(suite.suites.length) {
			result.suites = [];
			for (var j = 0; j < suite.suites.length; j++) {
				var sub = {};
				recurse(suite.suites[j], sub);
				result.suites.push(sub);
				result.durationSec += sub.durationSec || 0;
				result.passed = !sub.failed;
			}
		}
		return result;
	}
}


function mocha_sauce() {
	(function(runner) {
		mocha.reporter(JSONReport);
		new mocha._reporter(runner);

		runner.on('end', function() {
			runner.stats.jsonReport = jsonReport;
			window.mochaResults = runner.stats;
			window.chocoReady = true;
		});

	})(mocha.run());
}

(function() {
	
	var program = chinachu.getProgramById(request.param.id, data.recording);
	
	if (program === null) return response.error(404);
	
	switch (request.method) {
		case 'GET':
			response.head(200);
			response.end(JSON.stringify(program, null, '  '));
			return;
		
		case 'DELETE':
			if (process_platform === 'win32') {
				var killCmd = 'taskkill /pid ' + program.pid;
			} else {
				var killCmd = 'kill -TERM ' + program.pid;
			}
			child_process.exec(killCmd, function(err, stdout, stderr) {
				if (err) return response.error(500);
				
				response.head(200);
				response.end('{}');
			});
			return;
	}

})();
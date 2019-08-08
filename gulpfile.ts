import { exec } from 'child_process';
import { series } from 'gulp';

function runCommand(cmd, cb) {
	exec(cmd, (err, stdout, stderr) => {
		console.log(stdout);
		console.error(stderr);
		cb(err);
	});
}

const cleanApp = cb => runCommand('rm -rf out/app', cb);
const buildApp = cb => runCommand('yarn --cwd ./src/client build', cb);
const moveBuiltApp = cb => runCommand('mv src/client/build out/app', cb);

exports.default = series(cleanApp, buildApp, moveBuiltApp);

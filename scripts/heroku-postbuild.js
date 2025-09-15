const { execSync } = require('child_process');

function run(command) {
  console.log(`\n$ ${command}`);
  execSync(command, { stdio: 'inherit' });
}

try {
  run('npm --workspace apps/web run build');
  run('npm --workspace apps/api run build');
  console.log('\nHeroku postbuild completed successfully.');
} catch (error) {
  console.error('\nHeroku postbuild failed.');
  process.exit(1);
}



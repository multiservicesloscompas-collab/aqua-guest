const { execSync } = require('child_process');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const webAppPath = path.join(projectRoot, 'apps', 'web-app');
const jestPath = path.join(projectRoot, 'node_modules', 'jest', 'bin', 'jest.js');
const testFile = path.join('src', 'test', 'components', 'ventas', 'SalesList.test.tsx');
const configFile = path.join('jest.config.ts');

try {
  const command = `node "${jestPath}" "${testFile}" -c "${configFile}" -t "SalesList Component Renderizado básico"`;
  console.log('Executing:', command);
  console.log('Working directory:', webAppPath);
  
  const output = execSync(command, { 
    cwd: webAppPath, 
    stdio: 'inherit',
    shell: true 
  });
  
  console.log('Test completed successfully');
} catch (error) {
  console.error('Error executing test:', error.message);
  process.exit(1);
}

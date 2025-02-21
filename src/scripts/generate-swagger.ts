import { join } from 'path';
import { autoGenerateSwagger } from '../utils/swagger.auto';

// Path to modules directory
const modulesPath = join(__dirname, '..', 'modules');

console.log('Generating Swagger documentation...');

try {
  autoGenerateSwagger(modulesPath);
  console.log('Swagger documentation generated successfully!');
} catch (error) {
  console.error('Error generating Swagger documentation:', error);
  process.exit(1);
}

#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const __dirname = path.dirname(require.main?.filename || '');

function generateSocketCode(modelPath: string): string {
  const modelDir = path.dirname(modelPath);
  const modelName = path.basename(modelPath, '.ts');
  const capitalizedModelName = modelName.charAt(0).toUpperCase() + modelName.slice(1);

  return `import { Server, Socket } from 'socket.io';
import { ApiatoSocket } from '../../libs/apiato/no-sql/apiato-socket';
import { ${capitalizedModelName}Model } from './${modelName}';

export class ${capitalizedModelName}Socket extends ApiatoSocket {
  constructor(io: Server) {
    // Add your middleware logic here if needed
    const middleware = async ({ operation, socket, data }: { operation: string; socket: Socket; data: any }) => {
      try {
        const user = socket.data.user;
        
        // Implement your permission logic here
        // For example:
        if (!user) {
          return ['getMany', 'getOneWhere', 'getOneById'].includes(operation);
        }
        
        return true;
      } catch (error) {
        console.error('Socket middleware error:', error);
        return false;
      }
    };

    super(io, ${capitalizedModelName}Model, middleware);
  }
}`;
}

function generateSocket(modelPath: string): void {
  try {
    const modelDir = path.dirname(modelPath);
    const socketPath = path.join(modelDir, 'socket.ts');
    
    // Generate socket code
    const socketCode = generateSocketCode(modelPath);
    
    // Write socket file
    fs.writeFileSync(socketPath, socketCode);
    
    console.log(`Socket connector generated successfully at: ${socketPath}`);
  } catch (error) {
    console.error('Error generating socket connector:', error);
    process.exit(1);
  }
}

// Check if model path is provided
if (process.argv.length < 3) {
  console.error('Please provide the path to the model file');
  process.exit(1);
}

const modelPath = process.argv[2];
generateSocket(modelPath);

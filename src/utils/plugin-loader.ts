import fs from 'fs';
import path from 'path';
import { Express } from 'express';
import mongoose from 'mongoose';
import { IPlugin, IPluginConfig } from '../types/plugin';
import { logger } from './logger';

class PluginLoader {
  private static instance: PluginLoader;
  private plugins: Map<string, IPlugin> = new Map();
  private pluginsDir: string = path.join(__dirname, '..', 'plugins');
  private configFile: string = path.join(this.pluginsDir, 'config.json');

  private constructor() {
    this.ensurePluginStructure();
  }

  static getInstance(): PluginLoader {
    if (!PluginLoader.instance) {
      PluginLoader.instance = new PluginLoader();
    }
    return PluginLoader.instance;
  }

  private ensurePluginStructure(): void {
    if (!fs.existsSync(this.pluginsDir)) {
      fs.mkdirSync(this.pluginsDir, { recursive: true });
    }

    if (!fs.existsSync(this.configFile)) {
      fs.writeFileSync(this.configFile, JSON.stringify({}, null, 2));
    }
  }

  private loadPluginConfig(): Record<string, IPluginConfig> {
    try {
      const config = JSON.parse(fs.readFileSync(this.configFile, 'utf-8'));
      return config;
    } catch (error) {
      logger.error('Error loading plugin config:', error);
      return {};
    }
  }

  async loadPlugins(app: Express): Promise<void> {
    const pluginConfig = this.loadPluginConfig();
    const pluginDirs = fs.readdirSync(this.pluginsDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    for (const pluginDir of pluginDirs) {
      try {
        const pluginPath = path.join(this.pluginsDir, pluginDir);
        const pluginIndexPath = path.join(pluginPath, 'index.ts');
        const pluginRoutesPath = path.join(pluginPath, 'routes.ts');

        if (!fs.existsSync(pluginIndexPath)) {
          continue;
        }

        const { default: PluginClass } = await import(`file://${pluginIndexPath}`);
        
        // Get plugin config and API key from environment
        const config = pluginConfig[pluginDir];
        if (config && !config.enabled) {
          logger.info(`Plugin ${pluginDir} is disabled, skipping...`);
          continue;
        }

        // Get API key based on plugin name
        let apiKey: string | undefined;
        switch (pluginDir) {
          case 'stripe':
            apiKey = process.env.STRIPE_SECRET_KEY;
            break;
          case 'skydropx':
            apiKey = process.env.SKYDROPX_API_KEY;
            break;
          case 'enviacom':
            apiKey = process.env.ENVIACOM_API_KEY;
            break;
        }

        const plugin: IPlugin = new PluginClass(apiKey);

        // Initialize plugin
        await plugin.initialize(app, mongoose);
        this.plugins.set(plugin.name, plugin);

        // Load and register routes if they exist
        if (fs.existsSync(pluginRoutesPath)) {
          const { default: routesFunction } = await import(`file://${pluginRoutesPath}`);
          if (typeof routesFunction === 'function') {
            const router = routesFunction();
            // Apply auth middleware and register routes
            import('../middleware/auth.middleware').then(({ validateFirebaseToken }) => {
              app.use(`/api/v1/${pluginDir}`, validateFirebaseToken, router);
            });
          }
        }

        logger.info(`Plugin ${plugin.name} v${plugin.version} loaded successfully`);
      } catch (error) {
        logger.error(`Error loading plugin ${pluginDir}:`, error);
      }
    }
  }

  getPlugin<T extends IPlugin>(name: string): T | undefined {
    return this.plugins.get(name) as T | undefined;
  }

  async unloadPlugins(): Promise<void> {
    for (const [name, plugin] of this.plugins.entries()) {
      try {
        if (plugin.destroy) {
          await plugin.destroy();
        }
        this.plugins.delete(name);
        logger.info(`Plugin ${name} unloaded successfully`);
      } catch (error) {
        logger.error(`Error unloading plugin ${name}:`, error);
      }
    }
  }
}

export default PluginLoader;

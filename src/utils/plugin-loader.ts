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

        if (!fs.existsSync(pluginIndexPath)) {
          continue;
        }

        const pluginModule = require(pluginIndexPath);
        const plugin: IPlugin = new pluginModule.default();
        
        const config = pluginConfig[plugin.name];
        if (config && !config.enabled) {
          logger.info(`Plugin ${plugin.name} is disabled, skipping...`);
          continue;
        }

        await plugin.initialize(app, mongoose);
        this.plugins.set(plugin.name, plugin);
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
